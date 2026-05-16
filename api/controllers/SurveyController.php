<?php

require_once __DIR__ . '/../models/CourseExitSurveyRepository.php';
require_once __DIR__ . '/../models/CourseOfferingRepository.php';

class SurveyController
{
    private CourseExitSurveyRepository $surveyRepo;
    private ?CourseOfferingRepository $offeringRepo;

    public function __construct(
        ?CourseExitSurveyRepository $surveyRepo = null,
        ?CourseOfferingRepository $offeringRepo = null
    ) {
        $this->surveyRepo = $surveyRepo;
        $this->offeringRepo = $offeringRepo;
    }

    /**
     * Import course exit survey responses.
     * POST /offerings/{offeringId}/survey/course-exit/import
     */
    public function importCourseExitCsv(int $offeringId): void
    {
        try {
            if (!$this->surveyRepo || !$this->offeringRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $offering = $this->offeringRepo->findById($offeringId);
            if (!$offering) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['responses']) || !is_array($input['responses'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input: expected responses array']);
                return;
            }

            $validated = [];
            $errors = [];
            foreach ($input['responses'] as $i => $row) {
                $rollno = trim($row['student_rollno'] ?? '');
                $co = isset($row['co_number']) ? (int)$row['co_number'] : 0;
                $rating = isset($row['likert_rating']) ? (int)$row['likert_rating'] : 0;

                if ($rollno === '') {
                    $errors[] = "Row $i: missing student_rollno";
                    continue;
                }
                if ($co < 1 || $co > 6) {
                    $errors[] = "Row $i: co_number must be 1-6, got $co";
                    continue;
                }
                if ($rating < 1 || $rating > 5) {
                    $errors[] = "Row $i: likert_rating must be 1-5, got $rating";
                    continue;
                }

                $validated[] = [
                    'student_rollno' => $rollno,
                    'co_number' => $co,
                    'likert_rating' => $rating,
                ];
            }

            $imported = $this->surveyRepo->saveResponses($offeringId, $validated);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'imported_count' => $imported,
                    'error_count' => count($errors),
                    'errors' => $errors,
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get course exit survey results (CO averages).
     * GET /offerings/{offeringId}/survey/course-exit/results
     */
    public function getCourseExitResults(int $offeringId): void
    {
        try {
            if (!$this->surveyRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $averages = $this->surveyRepo->getCoAverages($offeringId);
            $responseCounts = $this->surveyRepo->getCoResponseCounts($offeringId);

            $coResults = [];
            for ($co = 1; $co <= 6; $co++) {
                $avgData = null;
                foreach ($averages as $a) {
                    if ((int)$a['co_number'] === $co) {
                        $avgData = $a;
                        break;
                    }
                }

                $coResults[] = [
                    'co_number' => $co,
                    'co_name' => 'CO' . $co,
                    'average_rating' => $avgData ? (float)$avgData['average_rating'] : null,
                    'respondent_count' => $responseCounts[$co] ?? 0,
                ];
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'offering_id' => $offeringId,
                    'has_data' => !empty($averages),
                    'co_results' => $coResults,
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Clear course exit survey data.
     * DELETE /offerings/{offeringId}/survey/course-exit
     */
    public function clearCourseExit(int $offeringId): void
    {
        try {
            if (!$this->surveyRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            $this->surveyRepo->deleteByOfferingId($offeringId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Course exit survey responses cleared',
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
