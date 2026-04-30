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
        ?CoPoRepository $coPoRepo = null,
        ?AuditService $auditService = null
    ) {
        $this->auditService = $auditService;

        $this->courseRepo = $courseRepo;
        $this->offeringRepo = $offeringRepo;
        $this->scaleRepo = $scaleRepo;
        $this->coPoRepo = $coPoRepo;
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

        try {
            $resolved = $this->resolveOffering($offeringId);
            if (!$resolved) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Course offering not found']);
                return;
            }

            $this->offeringRepo->updateThresholds($offeringId, $coThreshold, $passingThreshold);

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
