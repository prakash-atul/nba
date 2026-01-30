<?php

require_once __DIR__ . '/../models/Course.php';
require_once __DIR__ . '/../models/CourseRepository.php';
require_once __DIR__ . '/../models/AttainmentScale.php';
require_once __DIR__ . '/../models/AttainmentScaleRepository.php';
require_once __DIR__ . '/../models/CoPoRepository.php';

class AttainmentController
{
    private CourseRepository $courseRepo;
    private AttainmentScaleRepository $scaleRepo;
    private CoPoRepository $coPoRepo;

    public function __construct(CourseRepository $courseRepo, AttainmentScaleRepository $scaleRepo, CoPoRepository $coPoRepo = null)
    {
        $this->courseRepo = $courseRepo;
        $this->scaleRepo = $scaleRepo;
        $this->coPoRepo = $coPoRepo;
    }

    /**
     * Get CO-PO Matrix
     * GET /courses/{courseId}/copo-matrix
     */
    public function getCoPoMatrix(int $courseId): void
    {
        try {
            if (!$this->coPoRepo) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Service not initialized']);
                return;
            }

            // Check course access
            $course = $this->courseRepo->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }

            $rows = $this->coPoRepo->getMatrix($courseId);

            // Transform sparse data into structured matrix if needed
            // Currently returning generic list, frontend can map it

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $rows
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Save CO-PO Matrix
     * POST /courses/{courseId}/copo-matrix
     */
    public function saveCoPoMatrix(int $courseId): void
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

            $course = $this->courseRepo->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }

            $this->coPoRepo->saveMatrix($courseId, $input['mappings']);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'CO-PO Matrix saved successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get attainment configuration for a course
     * GET /courses/{courseId}/attainment-config
     */
    public function getConfig(int $courseId): void
    {
        try {
            // Check if course exists and user has access
            $course = $this->courseRepo->findById((int)$courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }

            // Get attainment thresholds
            $scales = $this->scaleRepo->getByCourseId((int)$courseId);

            $response = [
                'success' => true,
                'data' => [
                    'course_id' => $course->getId(),
                    'co_threshold' => $course->getCoThreshold(),
                    'passing_threshold' => $course->getPassingThreshold(),
                    'attainment_thresholds' => array_map(function ($scale) {
                        return [
                            'id' => $scale->id,
                            'level' => $scale->level,
                            'percentage' => $scale->min_percentage
                        ];
                    }, $scales)
                ]
            ];

            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve configuration: ' . $e->getMessage()]);
        }
    }

    /**
     * Save attainment configuration for a course
     * POST /courses/{courseId}/attainment-config
     */
    public function saveConfig(int $courseId): void
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            return;
        }

        // Validate required fields
        $coThreshold = $input['co_threshold'] ?? null;
        $passingThreshold = $input['passing_threshold'] ?? null;
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

        // Validate attainment thresholds
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

        try {
            // Check if course exists and user has access
            $course = $this->courseRepo->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }

            // Update course thresholds
            $this->courseRepo->updateThresholds($courseId, $coThreshold, $passingThreshold);

            // Prepare scale data with proper levels
            // Sort by percentage descending to assign levels correctly
            usort($attainmentThresholds, function ($a, $b) {
                return $b['percentage'] <=> $a['percentage'];
            });

            $scaleData = [];
            foreach ($attainmentThresholds as $index => $threshold) {
                $scaleData[] = [
                    'level' => count($attainmentThresholds) - $index,
                    'min_percentage' => $threshold['percentage']
                ];
            }

            // Save attainment scales
            $this->scaleRepo->saveBulk($courseId, $scaleData);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Attainment configuration saved successfully',
                'data' => [
                    'course_id' => $courseId,
                    'co_threshold' => $coThreshold,
                    'passing_threshold' => $passingThreshold,
                    'attainment_thresholds_saved' => count($scaleData)
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save configuration: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete attainment configuration for a course
     * DELETE /attainment/config/{courseId}
     */
    public function deleteConfig(int $courseId): void
    {
        try {
            // Check if course exists
            $course = $this->courseRepo->findById($courseId);
            if (!$course) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }

            // Delete attainment scales
            $this->scaleRepo->deleteByCourseId($courseId);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Attainment configuration deleted successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete configuration: ' . $e->getMessage()]);
        }
    }
}
