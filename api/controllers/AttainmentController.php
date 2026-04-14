<?php

require_once __DIR__ . '/../models/Course.php';
require_once __DIR__ . '/../models/CourseRepository.php';
require_once __DIR__ . '/../models/AttainmentScale.php';
require_once __DIR__ . '/../models/AttainmentScaleRepository.php';
require_once __DIR__ . '/../models/CoPoRepository.php';

class AttainmentController
{
    protected $auditService;

    private ?CourseRepository $courseRepo;
    private ?CourseOfferingRepository $offeringRepo;
    private ?AttainmentScaleRepository $scaleRepo;
    private ?CoPoRepository $coPoRepo;

    public function __construct(
        ?CourseRepository $courseRepo = null, 
        ?CourseOfferingRepository $offeringRepo = null,
        ?AttainmentScaleRepository $scaleRepo = null, 
        ?CoPoRepository $coPoRepo = null
    , ?AuditService $auditService = null) {
        $this->auditService = $auditService;

        $this->courseRepo = $courseRepo;
        $this->offeringRepo = $offeringRepo;
        $this->scaleRepo = $scaleRepo;
        $this->coPoRepo = $coPoRepo;
    }

    /**
     * Resolve an incoming id to a course_id.
     * Accepts either a template course_id or an offering_id.
     * Returns ['course_id' => int, 'offering_id' => int|null, 'course' => Course]
     * or null when not found.
     */
    private function resolveCourseId(int $id): ?array
    {
        // Try as a direct course_id first
        $course = $this->courseRepo->findById($id);
        if ($course) {
            return ['course_id' => $id, 'offering_id' => null, 'course' => $course];
        }
        // Try as an offering_id
        if ($this->offeringRepo) {
            $offering = $this->offeringRepo->findById($id);
            if ($offering) {
                $course = $this->courseRepo->findById($offering->getCourseId());
                if ($course) {
                    return [
                        'course_id'   => $offering->getCourseId(),
                        'offering_id' => $id,
                        'course'      => $course,
                    ];
                }
            }
        }
        return null;
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

            $resolved = $this->resolveCourseId($courseId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }

            $rows = $this->coPoRepo->getMatrix($resolved['course_id']);

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

            $resolved = $this->resolveCourseId($courseId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }

            $this->coPoRepo->saveMatrix($resolved['course_id'], $input['mappings']);

            http_response_code(200);
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('UPDATE', 'CoPoMatrix', null, ($GLOBALS['audit_old_state'] ?? null), $auditPayload);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AttainmentController', 'UPDATE operation successful in saveCoPoMatrix');
            }
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
            $resolved = $this->resolveCourseId($courseId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }
            $resolvedCourseId = $resolved['course_id'];

            // Use the specific offering when available, otherwise fall back to latest
            if ($resolved['offering_id'] !== null) {
                $offering = $this->offeringRepo->findById($resolved['offering_id']);
                $offeringData = $offering ? [
                    'co_threshold'      => $offering->getCoThreshold(),
                    'passing_threshold' => $offering->getPassingThreshold(),
                    'offering_id'       => $offering->getOfferingId(),
                ] : null;
            } else {
                $offerings = $this->offeringRepo->findByCourseId($resolvedCourseId);
                $offeringData = !empty($offerings) ? $offerings[0] : null;
            }

            // Get attainment thresholds
            $scales = $this->scaleRepo->getByCourseId($resolvedCourseId);

            $response = [
                'success' => true,
                'data' => [
                    'course_id' => $resolvedCourseId,
                    'co_threshold' => $offeringData ? (float)($offeringData['co_threshold'] ?? 40) : 40.00,
                    'passing_threshold' => $offeringData ? (float)($offeringData['passing_threshold'] ?? 60) : 60.00,
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
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('AttainmentController', 'getConfig prompt', ['error' => $e->getMessage()]); }
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
            $resolved = $this->resolveCourseId($courseId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course not found']);
                return;
            }
            $resolvedCourseId = $resolved['course_id'];

            // Update specific offering thresholds
            if ($resolved['offering_id'] !== null) {
                $this->offeringRepo->updateThresholds($resolved['offering_id'], $coThreshold, $passingThreshold);
            } else {
                $offerings = $this->offeringRepo->findByCourseId($resolvedCourseId);
                if (!empty($offerings)) {
                    $latestOfferingId = $offerings[0]['offering_id'];
                    $this->offeringRepo->updateThresholds($latestOfferingId, $coThreshold, $passingThreshold);
                }
            }

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
            $this->scaleRepo->saveBulk($resolvedCourseId, $scaleData);

            http_response_code(200);
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
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
                    'course_id' => $resolvedCourseId,
                    'co_threshold' => $coThreshold,
                    'passing_threshold' => $passingThreshold,
                    'attainment_thresholds_saved' => count($scaleData)
                ]
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('AttainmentController', 'saveConfig prompt', ['error' => $e->getMessage()]); }
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
            
            $auditPayload = isset($input) ? $input : (isset($data) ? $data : null);
            if (isset($this->auditService)) {
                $this->auditService->log('DELETE', 'Config', null, ($GLOBALS['audit_old_state'] ?? $auditPayload), null);
            }
            if (isset($GLOBALS['fileLogger'])) {
                $GLOBALS['fileLogger']->log('INFO', 'AttainmentController', 'DELETE operation successful in deleteConfig');
            }
            echo json_encode([
                'success' => true,
                'message' => 'Attainment configuration deleted successfully'
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('AttainmentController', 'deleteConfig prompt', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete configuration: ' . $e->getMessage()]);
        }
    }
}
