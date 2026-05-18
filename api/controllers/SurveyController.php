<?php

require_once __DIR__ . '/../models/CourseSurveyRepository.php';
require_once __DIR__ . '/../models/CourseOfferingRepository.php';
require_once __DIR__ . '/../models/StakeholderSurveyRepository.php';

class SurveyController
{
    private CourseSurveyRepository $surveyRepo;
    private ?CourseOfferingRepository $offeringRepo;
    private ?StakeholderSurveyRepository $stakeholderRepo;
    private ?ProgrammeRepository $programmeRepo;

    public function __construct(
        ?CourseSurveyRepository $surveyRepo = null,
        ?CourseOfferingRepository $offeringRepo = null,
        ?StakeholderSurveyRepository $stakeholderRepo = null,
        ?ProgrammeRepository $programmeRepo = null
    ) {
        $this->surveyRepo = $surveyRepo;
        $this->offeringRepo = $offeringRepo;
        $this->stakeholderRepo = $stakeholderRepo;
        $this->programmeRepo = $programmeRepo;
    }

    // --------------------------------------------------------------------------------
    // Course Exit Survey Endpoints
    // --------------------------------------------------------------------------------

    /**
     * Get Course Survey (with questions)
     * GET /offerings/{offeringId}/survey/course-exit
     */
    public function getCourseExitSurvey(int $offeringId): void
    {
        try {
            $survey = $this->surveyRepo->getSurveyByOfferingId($offeringId);
            if (!$survey) {
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => null]);
                return;
            }

            $questions = $this->surveyRepo->getQuestions((int)$survey['survey_id']);
            $survey['questions'] = $questions;

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $survey]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Create or Update Course Survey Questions
     * POST /offerings/{offeringId}/survey/course-exit/questions
     */
    public function saveCourseExitQuestions(int $offeringId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['questions']) || !is_array($input['questions'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input: expected questions array']);
                return;
            }

            $survey = $this->surveyRepo->getSurveyByOfferingId($offeringId);
            $surveyId = $survey ? (int)$survey['survey_id'] : $this->surveyRepo->createSurvey($offeringId);

            $this->surveyRepo->saveQuestions($surveyId, $input['questions']);

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'SurveyController', 'Course exit questions saved'); }
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Questions saved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Import course exit survey responses.
     * POST /offerings/{offeringId}/survey/course-exit/import
     */
    public function importCourseExitCsv(int $offeringId): void
    {
        try {
            $survey = $this->surveyRepo->getSurveyByOfferingId($offeringId);
            if (!$survey) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Survey questions must be configured before importing responses.']);
                return;
            }
            $surveyId = (int)$survey['survey_id'];

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['responses']) || !is_array($input['responses'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input: expected responses array']);
                return;
            }

            $imported = $this->surveyRepo->saveResponses($surveyId, $input['responses']);

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'SurveyController', 'Course exit CSV imported', ['count' => $imported]); }
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'imported_count' => $imported,
                    'error_count' => 0,
                    'errors' => [],
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get course exit survey results (CO averages & Analysis Matrix).
     * GET /offerings/{offeringId}/survey/course-exit/results
     */
    public function getCourseExitResults(int $offeringId): void
    {
        try {
            $survey = $this->surveyRepo->getSurveyByOfferingId($offeringId);
            if (!$survey) {
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => ['has_data' => false]]);
                return;
            }
            $surveyId = (int)$survey['survey_id'];

            $coAverages = $this->surveyRepo->getCoAverages($offeringId);
            $questionAverages = $this->surveyRepo->getQuestionAverages($surveyId);
            $pivotResponses = $this->surveyRepo->getPivotResponses($offeringId);

            $coResults = [];
            for ($co = 1; $co <= 6; $co++) {
                $avgData = null;
                foreach ($coAverages as $a) {
                    if ((int)$a['co_number'] === $co) {
                        $avgData = $a;
                        break;
                    }
                }
                $avgRating = $avgData ? (float)$avgData['average_rating'] : null;
                $coResults[] = [
                    'co_number' => $co,
                    'co_name' => 'CO' . $co,
                    'average_rating' => $avgRating,
                    'normalized_rating' => $avgRating !== null ? round(($avgRating - 1) / 4 * 3, 2) : null,
                    'respondent_count' => $avgData ? (int)$avgData['respondent_count'] : 0,
                ];
            }

            $rawResponses = [];
            foreach ($pivotResponses as $row) {
                $ratings = [];
                for ($co = 1; $co <= 6; $co++) {
                    $key = 'co' . $co;
                    $ratings['CO' . $co] = isset($row[$key]) ? (float)$row[$key] : null;
                }
                $rawResponses[] = [
                    'student_rollno' => $row['student_rollno'],
                    'ratings' => $ratings,
                ];
            }

            // Normalize question analysis to 0-3 scale
            $normalizedQuestionAnalysis = array_map(function ($qa) {
                $avg = isset($qa['average_rating']) ? (float)$qa['average_rating'] : 0;
                $qa['normalized_rating'] = $avg > 0 ? round(($avg - 1) / 4 * 3, 2) : null;
                return $qa;
            }, $questionAverages);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'offering_id' => $offeringId,
                    'has_data' => !empty($coAverages),
                    'co_results' => $coResults,
                    'question_analysis' => $normalizedQuestionAnalysis,
                    'raw_responses' => $rawResponses,
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get enrolled students with their existing survey responses (for manual entry).
     * GET /offerings/{offeringId}/survey/course-exit/enrollments
     */
    public function getCourseExitEnrollments(int $offeringId): void
    {
        try {
            $survey = $this->surveyRepo->getSurveyByOfferingId($offeringId);
            $questions = $survey ? $this->surveyRepo->getQuestions((int)$survey['survey_id']) : [];

            // Get enrolled students
            $enrollmentRepo = new EnrollmentRepository($this->surveyRepo->getDb());
            $enrollments = $enrollmentRepo->findByOfferingId($offeringId);

            // Get existing responses keyed by student -> question_id
            $existingResponses = [];
            if ($survey) {
                $responses = $this->surveyRepo->getResponses((int)$survey['survey_id']);
                foreach ($responses as $r) {
                    $existingResponses[$r['student_rollno']][(int)$r['question_id']] = (int)$r['likert_rating'];
                }
            }

            // Build enrollment list with responses
            $enrollmentList = [];
            foreach ($enrollments as $e) {
                $rollno = $e['student_rollno'];
                $enrollmentList[] = [
                    'roll_no' => $rollno,
                    'student_name' => $e['student_name'] ?? '',
                    'responses' => $existingResponses[$rollno] ?? [],
                ];
            }

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'SurveyController', 'getCourseExitEnrollments', ['students' => count($enrollmentList)]); }
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'enrollments' => $enrollmentList,
                    'questions' => $questions,
                ],
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('SurveyController', 'getCourseExitEnrollments error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Save manual Likert entries (replaces all responses for this survey).
     * POST /offerings/{offeringId}/survey/course-exit/responses/manual
     */
    public function saveManualResponses(int $offeringId): void
    {
        try {
            $survey = $this->surveyRepo->getSurveyByOfferingId($offeringId);
            if (!$survey) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Survey must be configured first.']);
                return;
            }
            $surveyId = (int)$survey['survey_id'];

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['responses']) || !is_array($input['responses'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input: expected responses array']);
                return;
            }

            $this->surveyRepo->clearResponses($surveyId);
            $count = $this->surveyRepo->saveResponses($surveyId, $input['responses']);

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'SurveyController', 'Manual responses saved', ['count' => $count]); }
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => ['imported_count' => $count],
                'message' => 'Manual responses saved',
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('SurveyController', 'saveManualResponses error', ['error' => $e->getMessage()]); }
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
            $survey = $this->surveyRepo->getSurveyByOfferingId($offeringId);
            if ($survey) {
                $this->surveyRepo->deleteSurvey((int)$survey['survey_id']);
            }
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Survey cleared']);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('SurveyController', 'error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    // --------------------------------------------------------------------------------
    // Stakeholder Survey Endpoints
    // --------------------------------------------------------------------------------

    /**
     * Get Stakeholder Survey (with questions)
     * GET /programmes/{programmeId}/survey/stakeholder?batch_year=&stakeholder_type=
     */
    public function getStakeholderSurvey(int $programmeId): void
    {
        try {
            $batchYear = isset($_GET['batch_year']) ? (int)$_GET['batch_year'] : 0;
            $stakeholderType = !empty($_GET['stakeholder_type']) ? trim($_GET['stakeholder_type']) : null;

            if ($batchYear <= 0 || !$stakeholderType) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'batch_year and stakeholder_type are required']);
                return;
            }

            $survey = $this->stakeholderRepo->getSurvey($programmeId, $batchYear, $stakeholderType);
            if (!$survey) {
                http_response_code(200);
                echo json_encode(['success' => true, 'data' => null]);
                return;
            }

            $questions = $this->stakeholderRepo->getQuestions((int)$survey['survey_id']);
            $survey['questions'] = $questions;

            http_response_code(200);
            echo json_encode(['success' => true, 'data' => $survey]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Create or Update Stakeholder Survey Questions
     * POST /programmes/{programmeId}/survey/stakeholder/questions
     */
    public function saveStakeholderQuestions(int $programmeId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $batchYear = isset($input['batch_year']) ? (int)$input['batch_year'] : 0;
            $stakeholderType = trim($input['stakeholder_type'] ?? '');
            
            if ($batchYear <= 0 || !$stakeholderType || !isset($input['questions']) || !is_array($input['questions'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                return;
            }

            $survey = $this->stakeholderRepo->getSurvey($programmeId, $batchYear, $stakeholderType);
            $surveyId = $survey ? (int)$survey['survey_id'] : $this->stakeholderRepo->createSurvey($programmeId, $batchYear, $stakeholderType);

            $this->stakeholderRepo->saveQuestions($surveyId, $input['questions']);

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'SurveyController', 'Stakeholder questions saved'); }
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Questions saved successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Import stakeholder survey responses.
     * POST /programmes/{programmeId}/survey/stakeholder/import
     */
    public function importStakeholderCsv(int $programmeId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $batchYear = isset($input['batch_year']) ? (int)$input['batch_year'] : 0;
            $stakeholderType = trim($input['stakeholder_type'] ?? '');

            if ($batchYear <= 0 || !$stakeholderType || !isset($input['responses']) || !is_array($input['responses'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid input']);
                return;
            }

            $survey = $this->stakeholderRepo->getSurvey($programmeId, $batchYear, $stakeholderType);
            if (!$survey) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Survey questions must be configured first.']);
                return;
            }

            $imported = $this->stakeholderRepo->saveResponses((int)$survey['survey_id'], $input['responses']);

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'SurveyController', 'Stakeholder CSV imported', ['count' => $imported]); }
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'imported_count' => $imported,
                    'error_count' => 0,
                    'errors' => [],
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get stakeholder survey results (PO averages).
     * GET /programmes/{programmeId}/survey/stakeholder/results?batch_year=&stakeholder_type=
     */
    public function getStakeholderResults(int $programmeId): void
    {
        try {
            $batchYear = isset($_GET['batch_year']) ? (int)$_GET['batch_year'] : 0;
            $stakeholderType = !empty($_GET['stakeholder_type']) ? trim($_GET['stakeholder_type']) : null;

            $averages = $this->stakeholderRepo->getPoAverages($programmeId, $batchYear, $stakeholderType);
            $byType = $this->stakeholderRepo->getPoAveragesByType($programmeId, $batchYear);
            $types = $this->stakeholderRepo->getDistinctTypes($programmeId, $batchYear);
            $individual = $this->stakeholderRepo->getByProgrammeBatchGrouped($programmeId, $batchYear, $stakeholderType);

            $results = [];
            foreach ($averages as $avg) {
                $avgRating = (float)$avg['average_rating'];
                $results[] = [
                    'po_name' => $avg['po_name'],
                    'average_rating' => $avgRating,
                    'attainment_percentage' => $avgRating > 0 ? round(($avgRating - 1) / 4 * 100, 2) : 0.0,
                    'respondent_count' => (int)$avg['respondent_count'],
                ];
            }

            $byTypeFormatted = [];
            foreach ($byType as $row) {
                $byTypeFormatted[] = [
                    'stakeholder_type' => $row['stakeholder_type'],
                    'po_name' => $row['po_name'],
                    'average_rating' => (float)$row['average_rating'],
                    'respondent_count' => (int)$row['respondent_count'],
                ];
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'programme_id' => $programmeId,
                    'batch_year' => $batchYear,
                    'has_data' => !empty($averages),
                    'stakeholder_types' => $types,
                    'averages' => $results,
                    'by_type' => $byTypeFormatted,
                    'individual' => $individual,
                ],
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Clear stakeholder survey data.
     * DELETE /programmes/{programmeId}/survey/stakeholder?batch_year=&stakeholder_type=
     */
    public function clearStakeholder(int $programmeId): void
    {
        try {
            $batchYear = isset($_GET['batch_year']) ? (int)$_GET['batch_year'] : 0;
            $stakeholderType = !empty($_GET['stakeholder_type']) ? trim($_GET['stakeholder_type']) : null;

            $this->stakeholderRepo->deleteByProgrammeBatch($programmeId, $batchYear, $stakeholderType);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Stakeholder survey cleared',
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}