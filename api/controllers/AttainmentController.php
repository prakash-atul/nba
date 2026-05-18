<?php

require_once __DIR__ . '/../models/Course.php';
require_once __DIR__ . '/../models/CourseRepository.php';
require_once __DIR__ . '/../models/AttainmentScale.php';
require_once __DIR__ . '/../models/AttainmentScaleRepository.php';
require_once __DIR__ . '/../models/AttainmentSnapshotRepository.php';
require_once __DIR__ . '/../models/CoPoRepository.php';
require_once __DIR__ . '/../models/ProgrammeRepository.php';
require_once __DIR__ . '/../utils/AttainmentSnapshotService.php';

class AttainmentController
{
    protected $auditService;

    private ?CourseRepository $courseRepo;
    private ?CourseOfferingRepository $offeringRepo;
    private ?AttainmentScaleRepository $scaleRepo;
    private ?CoPoRepository $coPoRepo;
    private ?ProgrammeRepository $programmeRepo;
    private ?AttainmentSnapshotRepository $snapshotRepo;
    private ?AttainmentSnapshotService $snapshotService;

    public function __construct(
        ?CourseRepository $courseRepo = null,
        ?CourseOfferingRepository $offeringRepo = null,
        ?AttainmentScaleRepository $scaleRepo = null,
        ?CoPoRepository $coPoRepo = null,
        ?ProgrammeRepository $programmeRepo = null,
        ?AttainmentSnapshotRepository $snapshotRepo = null,
        ?AttainmentSnapshotService $snapshotService = null,
        ?AuditService $auditService = null
    ) {
        $this->auditService = $auditService;

        $this->courseRepo = $courseRepo;
        $this->offeringRepo = $offeringRepo;
        $this->scaleRepo = $scaleRepo;
        $this->coPoRepo = $coPoRepo;
        $this->programmeRepo = $programmeRepo;
        $this->snapshotRepo = $snapshotRepo;
        $this->snapshotService = $snapshotService;
    }

    /**
     * Get CO/PO attainment for an offering.
     * Returns persisted snapshots when available, otherwise live preview.
     */
    public function getOfferingAttainment(int $offeringId): void
    {
        try {
            $resolved = $this->resolveOffering($offeringId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            if (!$this->snapshotRepo || !$this->snapshotService) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $snapshotExists = $this->snapshotRepo->hasSnapshots($offeringId);
            if ($snapshotExists) {
                $payload = [
                    'offering_id' => $offeringId,
                    'co_threshold' => (float)$resolved['offering']->getCoThreshold(),
                    'passing_threshold' => (float)$resolved['offering']->getPassingThreshold(),
                    'attainment_thresholds' => array_map(function ($scale) {
                        return [
                            'id' => $scale->id,
                            'level' => $scale->level,
                            'percentage' => (float)$scale->min_percentage,
                        ];
                    }, $this->scaleRepo->getByOfferingId($offeringId)),
                    'co_attainment' => $this->snapshotRepo->getCoAttainmentsByOfferingId($offeringId),
                    'po_attainment' => $this->snapshotRepo->getPoAttainmentsByOfferingId($offeringId),
                ];
            } else {
                $payload = $this->snapshotService->calculatePreview($offeringId);
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'snapshot_exists' => $snapshotExists,
                'data' => $payload,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get course-level PO/PSO attainment for the programme articulation matrix.
     * GET /programmes/{id}/attainment/courses?batch_year=
     */
    public function getCoursesProgrammeAttainment(int $programmeId): void
    {
        try {
            if (!$this->programmeRepo || !$this->snapshotRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $programme = $this->programmeRepo->findById($programmeId);
            if (!$programme) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Programme not found']);
                return;
            }

            $batchYear = isset($_GET['batch_year']) && $_GET['batch_year'] !== ''
                ? (int)$_GET['batch_year']
                : null;

            if (!$batchYear) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'batch_year query parameter is required']);
                return;
            }

            $rows = $this->snapshotRepo->getCourseLevelPoAttainment($programmeId, $batchYear);

            // Build all PO/PSO names (PO1-PO12, PSO1-PSO3)
            $poList = [];
            for ($i = 1; $i <= 12; $i++) { $poList[] = 'PO' . $i; }
            for ($i = 1; $i <= 3; $i++) { $poList[] = 'PSO' . $i; }

            // Pivot rows into per-course structure
            $courses = [];
            $sumDirect = array_fill_keys($poList, 0.0);
            $sumFinal = array_fill_keys($poList, 0.0);
            $countDirect = array_fill_keys($poList, 0);
            $countFinal = array_fill_keys($poList, 0);
            $seenCourses = [];

            foreach ($rows as $row) {
                $offeringId = (int)$row['offering_id'];
                $poName = $row['po_name'];

                // Skip unknown PO names (safety)
                if (!in_array($poName, $poList, true)) {
                    continue;
                }

                $directVal = $row['attainment_value'] !== null ? (float)$row['attainment_value'] : null;
                $finalVal = $row['final_attainment_value'] !== null ? (float)$row['final_attainment_value'] : null;

                if (!isset($seenCourses[$offeringId])) {
                    $courses[] = [
                        'offering_id' => $offeringId,
                        'course_code' => $row['course_code'],
                        'course_name' => $row['course_name'],
                        'values' => array_fill_keys($poList, null),
                    ];
                    $seenCourses[$offeringId] = count($courses) - 1;
                }

                $idx = $seenCourses[$offeringId];
                $courses[$idx]['values'][$poName] = $finalVal;

                // Accumulate for averages
                if ($directVal !== null) {
                    $sumDirect[$poName] += $directVal;
                    $countDirect[$poName]++;
                }
                if ($finalVal !== null) {
                    $sumFinal[$poName] += $finalVal;
                    $countFinal[$poName]++;
                }
            }

            // Read blended programme-level data from programme_batch_attainments
            $blendedStmt = $this->snapshotRepo->getDb()->prepare(
                "SELECT po_name, direct_attainment, indirect_attainment, final_attainment, target
                 FROM programme_batch_attainments
                 WHERE programme_id = ? AND batch_year = ?"
            );
            $blendedStmt->execute([$programmeId, $batchYear]);
            $blendedRows = $blendedStmt->fetchAll(PDO::FETCH_ASSOC);

            $hasBlended = !empty($blendedRows);
            $blendedByPo = [];
            foreach ($blendedRows as $b) {
                $blendedByPo[$b['po_name']] = $b;
            }

            // Compute averages — prefer blended when available
            $averages = [];
            $finals = [];
            $indirect = [];
            $targets = [];
            foreach ($poList as $po) {
                if ($hasBlended && isset($blendedByPo[$po])) {
                    $averages[$po] = (float)$blendedByPo[$po]['direct_attainment'];
                    $finals[$po] = (float)$blendedByPo[$po]['final_attainment'];
                    $indirect[$po] = (float)$blendedByPo[$po]['indirect_attainment'];
                    $targets[$po] = (float)$blendedByPo[$po]['target'];
                } else {
                    $averages[$po] = $countDirect[$po] > 0
                        ? round($sumDirect[$po] / $countDirect[$po], 2)
                        : 0.0;
                    $finals[$po] = $countFinal[$po] > 0
                        ? round($sumFinal[$po] / $countFinal[$po], 2)
                        : 0.0;
                    $indirect[$po] = null;
                    $targets[$po] = 0.0;
                }
            }

            // Override targets from separate query as fallback
            $savedTargets = $this->snapshotRepo->getTargets($programmeId, $batchYear);
            foreach ($savedTargets as $po => $val) {
                $targets[$po] = $val;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'programme_id' => $programmeId,
                    'batch_year' => $batchYear,
                    'po_list' => $poList,
                    'courses' => $courses,
                    'averages' => $averages,
                    'finals' => $finals,
                    'indirect' => $indirect,
                    'targets' => $targets,
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get programme-level PO attainment from persisted offering snapshots.
     */
    public function getProgrammeAttainment(int $programmeId): void
    {
        try {
            if (!$this->programmeRepo || !$this->snapshotRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $programme = $this->programmeRepo->findById($programmeId);
            if (!$programme) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Programme not found']);
                return;
            }

            $batchYear = isset($_GET['batch_year']) && $_GET['batch_year'] !== ''
                ? (int)$_GET['batch_year']
                : null;

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'programme_id' => $programmeId,
                    'batch_year' => $batchYear,
                    'po_attainment' => $this->snapshotRepo->getProgrammePoAttainment($programmeId, $batchYear),
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Calculate and persist programme-level batch attainment.
     * POST /programmes/{id}/attainment?batch_year=
     */
    public function calculateProgrammeAttainment(int $programmeId): void
    {
        try {
            if (!$this->snapshotService || !$this->programmeRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $programme = $this->programmeRepo->findById($programmeId);
            if (!$programme) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Programme not found']);
                return;
            }

            $batchYear = isset($_GET['batch_year']) && $_GET['batch_year'] !== ''
                ? (int)$_GET['batch_year']
                : null;

            if (!$batchYear) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'batch_year query parameter is required']);
                return;
            }

            $result = $this->snapshotService->calculateProgrammeBatchAttainment($programmeId, $batchYear);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'programme_id' => $programmeId,
                    'batch_year' => $batchYear,
                    'po_attainment' => $result,
                ],
                'message' => 'Programme attainment calculated successfully',
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Resolve and validate an offering id.
     * Returns ['offering' => CourseOffering, 'course' => Course] or null.
     */
    private function resolveOffering(int $offeringId): ?array
    {
        if (!$this->offeringRepo || !$this->courseRepo) {
            return null;
        }

        $offering = $this->offeringRepo->findById($offeringId);
        if (!$offering) {
            return null;
        }

        $course = $this->courseRepo->findById($offering->getCourseId());
        if (!$course) {
            return null;
        }

        return [
            'offering' => $offering,
            'course' => $course,
        ];
    }

    /**
     * Get CO-PO Matrix
     * GET /offerings/{offeringId}/copo-matrix
     */
    public function getCoPoMatrix(int $offeringId): void
    {
        try {
            if (!$this->coPoRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $resolved = $this->resolveOffering($offeringId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            $rows = $this->coPoRepo->getMatrix($offeringId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $rows,
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Save CO-PO Matrix
     * POST /offerings/{offeringId}/copo-matrix
     */
    public function saveCoPoMatrix(int $offeringId): void
    {
        try {
            if (!$this->coPoRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['mappings']) || !is_array($input['mappings'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input format']);
                return;
            }

            $resolved = $this->resolveOffering($offeringId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            $this->coPoRepo->saveMatrix($offeringId, $input['mappings']);

            http_response_code(200);

            $auditPayload = isset($input) ? $input : null;
            if (isset($this->auditService)) {
                $this->auditService->log('UPDATE', 'CoPoMatrix', null, ($GLOBALS['audit_old_state'] ?? null), $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AttainmentController', 'UPDATE operation successful in saveCoPoMatrix');
            }
            echo json_encode([
                'success' => true,
                'message' => 'CO-PO Matrix saved successfully',
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get attainment configuration for an offering
     * GET /offerings/{offeringId}/attainment-config
     */
    public function getConfig(int $offeringId): void
    {
        try {
            $resolved = $this->resolveOffering($offeringId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            $offering = $resolved['offering'];
            $course = $resolved['course'];

            $scales = $this->scaleRepo->getByOfferingId($offeringId);

            $response = [
                'success' => true,
                'data' => [
                    'offering_id' => $offeringId,
                    'course_id' => $course->getCourseId(),
                    'co_threshold' => (float)$offering->getCoThreshold(),
                    'passing_threshold' => (float)$offering->getPassingThreshold(),
                    'direct_weightage' => (float)($offering->getDirectWeightage() ?? 80.0),
                    'indirect_weightage' => (float)($offering->getIndirectWeightage() ?? 20.0),
                    'attainment_thresholds' => array_map(function ($scale) {
                        return [
                            'id' => $scale->id,
                            'level' => $scale->level,
                            'percentage' => $scale->min_percentage,
                        ];
                    }, $scales),
                ],
            ];

            echo json_encode($response);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->error('AttainmentController', 'getConfig prompt', ['error' => $e->getMessage()]);
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve configuration: ' . $e->getMessage()]);
        }
    }

    /**
     * Save attainment configuration for an offering
     * POST /offerings/{offeringId}/attainment-config
     */
    public function saveConfig(int $offeringId): void
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            return;
        }

        $coThreshold = $input['co_threshold'] ?? null;
        $passingThreshold = $input['passing_threshold'] ?? null;
        $directWeightage = $input['direct_weightage'] ?? null;
        $indirectWeightage = $input['indirect_weightage'] ?? null;
        $attainmentThresholds = $input['attainment_thresholds'] ?? [];

        if ($coThreshold !== null && ($coThreshold < 0 || $coThreshold > 100)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'CO threshold must be between 0 and 100']);
            return;
        }

        if ($passingThreshold !== null && ($passingThreshold < 0 || $passingThreshold > 100)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Passing threshold must be between 0 and 100']);
            return;
        }

        if (!is_array($attainmentThresholds) || empty($attainmentThresholds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'At least one attainment threshold is required']);
            return;
        }

        foreach ($attainmentThresholds as $threshold) {
            if (!isset($threshold['id']) || !isset($threshold['percentage'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Each threshold must have id and percentage']);
                return;
            }

            if ($threshold['percentage'] < 0 || $threshold['percentage'] > 100) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Threshold percentages must be between 0 and 100']);
                return;
            }
        }

        if ($directWeightage !== null || $indirectWeightage !== null) {
            $dw = (float)($directWeightage ?? 80.0);
            $iw = (float)($indirectWeightage ?? 20.0);
            if ($dw < 0 || $dw > 100 || $iw < 0 || $iw > 100) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Weightage values must be between 0 and 100']);
                return;
            }
            if (abs(($dw + $iw) - 100) > 0.01) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Direct and indirect weightage must sum to 100']);
                return;
            }
        }

        try {
            $resolved = $this->resolveOffering($offeringId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            $this->offeringRepo->updateThresholds($offeringId, $coThreshold, $passingThreshold);

            if ($directWeightage !== null || $indirectWeightage !== null) {
                $this->offeringRepo->updateWeightage(
                    $offeringId,
                    (float)($directWeightage ?? 80.0),
                    (float)($indirectWeightage ?? 20.0)
                );
            }

            usort($attainmentThresholds, function ($a, $b) {
                return $b['percentage'] <=> $a['percentage'];
            });

            $scaleData = [];
            foreach ($attainmentThresholds as $index => $threshold) {
                $scaleData[] = [
                    'level' => count($attainmentThresholds) - $index,
                    'min_percentage' => $threshold['percentage'],
                ];
            }

            $this->scaleRepo->saveBulk($offeringId, $scaleData);

            http_response_code(200);

            $auditPayload = isset($input) ? $input : null;
            if (isset($this->auditService)) {
                $this->auditService->log('UPDATE', 'Config', null, ($GLOBALS['audit_old_state'] ?? null), $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AttainmentController', 'UPDATE operation successful in saveConfig');
            }
            echo json_encode([
                'success' => true,
                'message' => 'Attainment configuration saved successfully',
                'data' => [
                    'offering_id' => $offeringId,
                    'course_id' => $resolved['course']->getCourseId(),
                    'co_threshold' => $coThreshold,
                    'passing_threshold' => $passingThreshold,
                    'direct_weightage' => (float)($directWeightage ?? 80.0),
                    'indirect_weightage' => (float)($indirectWeightage ?? 20.0),
                    'attainment_thresholds_saved' => count($scaleData),
                ],
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->error('AttainmentController', 'saveConfig prompt', ['error' => $e->getMessage()]);
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save configuration: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete attainment configuration for an offering
     * DELETE /attainment/config/{offeringId}
     */
    public function deleteConfig(int $offeringId): void
    {
        try {
            $resolved = $this->resolveOffering($offeringId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            $this->scaleRepo->deleteByOfferingId($offeringId);

            http_response_code(200);

            if (isset($this->auditService)) {
                $this->auditService->log('DELETE', 'Config', null, ($GLOBALS['audit_old_state'] ?? null), null);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AttainmentController', 'DELETE operation successful in deleteConfig');
            }
            echo json_encode([
                'success' => true,
                'message' => 'Attainment configuration deleted successfully',
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->error('AttainmentController', 'deleteConfig prompt', ['error' => $e->getMessage()]);
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete configuration: ' . $e->getMessage()]);
        }
    }
}
