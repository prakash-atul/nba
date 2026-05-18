<?php

require_once __DIR__ . '/../models/ActionPlanRepository.php';
require_once __DIR__ . '/../models/ProgrammeRepository.php';
require_once __DIR__ . '/../models/AttainmentSnapshotRepository.php';

class ActionPlanController
{
    private ActionPlanRepository $repo;
    private ?ProgrammeRepository $programmeRepo;
    private ?AttainmentSnapshotRepository $snapshotRepo;

    public function __construct(
        ActionPlanRepository $repo,
        ?ProgrammeRepository $programmeRepo = null,
        ?AttainmentSnapshotRepository $snapshotRepo = null
    ) {
        $this->repo = $repo;
        $this->programmeRepo = $programmeRepo;
        $this->snapshotRepo = $snapshotRepo;
    }

    /**
     * List action plans for a programme.
     * GET /programmes/{id}/action-plans?batch_year=
     */
    public function listByProgramme(int $programmeId): void
    {
        try {
            $batchYear = isset($_GET['batch_year']) && $_GET['batch_year'] !== ''
                ? (int)$_GET['batch_year']
                : null;
            $plans = $this->repo->findByProgramme($programmeId, $batchYear);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $plans,
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('ActionPlanController', 'listByProgramme error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Create an action plan.
     * POST /programmes/{id}/action-plans
     */
    public function create(int $programmeId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['gap_description']) || empty($input['action_text'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'gap_description and action_text are required']);
                return;
            }

            $input['programme_id'] = $programmeId;
            $input['created_by'] = $_REQUEST['authenticated_user']['employee_id'] ?? null;

            $id = $this->repo->create($input);

            $plan = $this->repo->findById($id);

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'ActionPlanController', 'CREATE operation successful'); }
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => $plan,
                'message' => 'Action plan created',
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('ActionPlanController', 'action error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Update an action plan.
     * PUT /action-plans/{id}
     */
    public function update(int $id): void
    {
        try {
            $existing = $this->repo->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Action plan not found']);
                return;
            }

            $input = json_decode(file_get_contents('php://input'), true);
            $this->repo->update($id, $input);

            $plan = $this->repo->findById($id);
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'ActionPlanController', 'UPDATE operation successful'); }
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $plan,
                'message' => 'Action plan updated',
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('ActionPlanController', 'action error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Delete an action plan.
     * DELETE /action-plans/{id}
     */
    public function delete(int $id): void
    {
        try {
            $existing = $this->repo->findById($id);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Action plan not found']);
                return;
            }

            $this->repo->delete($id);

            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->log('INFO', 'ActionPlanController', 'DELETE operation successful'); }
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Action plan deleted',
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('ActionPlanController', 'action error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Set PO targets for a programme/batch.
     * POST /programmes/{id}/attainment/targets
     */
    public function setTargets(int $programmeId): void
    {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $batchYear = isset($input['batch_year']) ? (int)$input['batch_year'] : 0;
            $targets = $input['targets'] ?? [];

            if ($batchYear <= 0 || empty($targets) || !is_array($targets)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'batch_year and targets map required']);
                return;
            }

            $this->repo->setTargets($programmeId, $batchYear, $targets);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Targets saved successfully',
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('ActionPlanController', 'action error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Get PO targets for a programme/batch.
     * GET /programmes/{id}/attainment/targets?batch_year=
     */
    public function getTargets(int $programmeId): void
    {
        try {
            $batchYear = isset($_GET['batch_year']) && $_GET['batch_year'] !== ''
                ? (int)$_GET['batch_year']
                : 0;

            if ($batchYear <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'batch_year query parameter required']);
                return;
            }

            $targets = $this->repo->getTargets($programmeId, $batchYear);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => [
                    'programme_id' => $programmeId,
                    'batch_year' => $batchYear,
                    'targets' => $targets,
                ],
            ]);
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('ActionPlanController', 'action error', ['error' => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
