<?php

require_once __DIR__ . '/../models/AttainmentSnapshotRepository.php';
require_once __DIR__ . '/../models/AttainmentScaleRepository.php';
require_once __DIR__ . '/../models/CoPoRepository.php';
require_once __DIR__ . '/../models/CourseOfferingRepository.php';

class AttainmentSnapshotService
{
    private $db;
    private $snapshotRepository;
    private $scaleRepository;
    private $coPoRepository;
    private $offeringRepository;

    public function __construct(
        $db,
        AttainmentSnapshotRepository $snapshotRepository,
        AttainmentScaleRepository $scaleRepository,
        CoPoRepository $coPoRepository,
        CourseOfferingRepository $offeringRepository
    ) {
        $this->db = $db;
        $this->snapshotRepository = $snapshotRepository;
        $this->scaleRepository = $scaleRepository;
        $this->coPoRepository = $coPoRepository;
        $this->offeringRepository = $offeringRepository;
    }

    public function calculatePreview($offeringId): array
    {
        return $this->buildSnapshotPayload((int)$offeringId);
    }

    public function calculateAndPersist($offeringId): array
    {
        $payload = $this->buildSnapshotPayload((int)$offeringId);

        $this->snapshotRepository->clearByOfferingId($offeringId);
        $this->snapshotRepository->saveCoAttainments($offeringId, $payload['co_attainment']);
        $this->snapshotRepository->savePoAttainments($offeringId, $payload['po_attainment']);

        return $payload;
    }

    public function clearSnapshots($offeringId): void
    {
        $this->snapshotRepository->clearByOfferingId((int)$offeringId);
    }

    private function buildSnapshotPayload(int $offeringId): array
    {
        $offering = $this->offeringRepository->findById($offeringId);
        if (!$offering) {
            throw new Exception('Course offering not found');
        }

        $coThreshold = (float)$offering->getCoThreshold();
        $passingThreshold = (float)$offering->getPassingThreshold();
        $thresholds = $this->scaleRepository->getByOfferingId($offeringId);
        usort($thresholds, function ($a, $b) {
            return $b->min_percentage <=> $a->min_percentage;
        });

        $coMaxMarks = $this->getCoMaxMarks($offeringId);
        $studentPercentages = $this->getStudentPercentages($offeringId, $coMaxMarks);
        $presentStudents = count($studentPercentages);
        $coAttainment = [];
        $coLevels = [];

        for ($coNumber = 1; $coNumber <= 6; $coNumber++) {
            $attainmentPercentage = 0.0;

            if ($presentStudents > 0 && ($coMaxMarks[$coNumber] ?? 0) > 0) {
                $aboveThreshold = 0;
                foreach ($studentPercentages as $studentCoPercentages) {
                    $percentage = round((float)($studentCoPercentages[$coNumber] ?? 0), 2);
                    if ($percentage >= $coThreshold) {
                        $aboveThreshold++;
                    }
                }

                $attainmentPercentage = round(($aboveThreshold / $presentStudents) * 100, 2);
            }

            $attainmentLevel = round($this->resolveAttainmentLevel($attainmentPercentage, $thresholds), 2);
            $coLevels[$coNumber] = $attainmentLevel;
            $coAttainment[] = [
                'co_number' => $coNumber,
                'co_name' => 'CO' . $coNumber,
                'attainment_percentage' => $attainmentPercentage,
                'attainment_level' => $attainmentLevel,
            ];
        }

        $poAttainment = $this->computePoAttainment($offeringId, $coLevels, count($thresholds));

        return [
            'offering_id' => $offeringId,
            'co_threshold' => $coThreshold,
            'passing_threshold' => $passingThreshold,
            'present_students' => $presentStudents,
            'attainment_thresholds' => array_map(function ($scale) {
                return [
                    'id' => $scale->id,
                    'level' => $scale->level,
                    'percentage' => (float)$scale->min_percentage,
                ];
            }, $thresholds),
            'co_attainment' => $coAttainment,
            'po_attainment' => $poAttainment,
        ];
    }

    private function getCoMaxMarks(int $offeringId): array
    {
        $stmt = $this->db->prepare(
            'SELECT q.co AS co_number, SUM(q.max_marks) AS max_marks
             FROM tests t
             JOIN questions q ON q.test_id = t.test_id
             WHERE t.offering_id = ?
             GROUP BY q.co'
        );
        $stmt->execute([$offeringId]);

        $result = [1 => 0.0, 2 => 0.0, 3 => 0.0, 4 => 0.0, 5 => 0.0, 6 => 0.0];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $result[(int)$row['co_number']] = round((float)$row['max_marks'], 2);
        }

        return $result;
    }

    private function getStudentPercentages(int $offeringId, array $coMaxMarks): array
    {
        $studentsStmt = $this->db->prepare(
            "SELECT student_rollno
             FROM enrollments
             WHERE offering_id = ? AND enrollment_status != 'Dropped'"
        );
        $studentsStmt->execute([$offeringId]);
        $students = $studentsStmt->fetchAll(PDO::FETCH_COLUMN);

        $percentages = [];
        foreach ($students as $rollNo) {
            $percentages[$rollNo] = [1 => 0.0, 2 => 0.0, 3 => 0.0, 4 => 0.0, 5 => 0.0, 6 => 0.0];
        }

        if (empty($students)) {
            return $percentages;
        }

        $marksStmt = $this->db->prepare(
            'SELECT m.student_roll_no, m.co_number, SUM(m.marks_obtained) AS total_marks
             FROM marks m
             JOIN tests t ON t.test_id = m.test_id
             WHERE t.offering_id = ?
             GROUP BY m.student_roll_no, m.co_number'
        );
        $marksStmt->execute([$offeringId]);

        foreach ($marksStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $rollNo = $row['student_roll_no'];
            $coNumber = (int)$row['co_number'];
            $maxMarks = (float)($coMaxMarks[$coNumber] ?? 0);
            $obtained = (float)$row['total_marks'];

            if (!isset($percentages[$rollNo]) || $maxMarks <= 0) {
                continue;
            }

            $percentages[$rollNo][$coNumber] = round(($obtained / $maxMarks) * 100, 2);
        }

        return $percentages;
    }

    private function resolveAttainmentLevel(float $percentage, array $thresholds): float
    {
        if (empty($thresholds)) {
            return 0.0;
        }

        if ($percentage >= (float)$thresholds[0]->min_percentage) {
            return (float)count($thresholds);
        }

        for ($i = 1; $i < count($thresholds); $i++) {
            $current = (float)$thresholds[$i]->min_percentage;
            if ($percentage >= $current) {
                $baseLevel = count($thresholds) - $i;
                $next = (float)$thresholds[$i - 1]->min_percentage;
                $diff = $next - $current;

                if ($diff == 0.0) {
                    return (float)$baseLevel;
                }

                return $baseLevel + (($percentage - $current) / $diff);
            }
        }

        return 0.0;
    }

    private function computePoAttainment(int $offeringId, array $coLevels, int $attainmentPointsScale): array
    {
        $rows = $this->coPoRepository->getMatrix($offeringId);
        $sumByPo = [];
        $countByPo = [];

        foreach ($rows as $row) {
            $poName = $row['po_name'];
            $mappingValue = (int)$row['value'];
            $coNumber = (int)substr($row['co_name'], 2);

            if ($mappingValue <= 0 || $attainmentPointsScale <= 0) {
                continue;
            }

            $value = ((float)($coLevels[$coNumber] ?? 0) * $mappingValue) / $attainmentPointsScale;
            $sumByPo[$poName] = ($sumByPo[$poName] ?? 0) + $value;
            $countByPo[$poName] = ($countByPo[$poName] ?? 0) + 1;
        }

        $poAttainment = [];
        ksort($countByPo);
        foreach ($countByPo as $poName => $count) {
            $poAttainment[] = [
                'po_name' => $poName,
                'attainment_value' => $count > 0 ? round($sumByPo[$poName] / $count, 2) : 0.0,
            ];
        }

        return $poAttainment;
    }
}
