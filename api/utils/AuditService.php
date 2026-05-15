<?php

class AuditService {
    private $auditRepo;

    public function __construct($auditRepo) {
        $this->auditRepo = $auditRepo;
    }

    /**
     * Log an action securely.
     *
     * @param string $action 'CREATE', 'UPDATE', 'DELETE'
     * @param string $entityType e.g., 'Course', 'User', 'Test'
     * @param string $entityId The primary key of the modified record
     * @param mixed $oldValues Previous state (array/object or null)
     * @param mixed $newValues New state (array/object or null)
     */
    public function log($action, $entityType, $entityId, $oldValues = null, $newValues = null) {
        $fileLogger = $GLOBALS['fileLogger'] ?? null;
        if ($fileLogger) {
            $fileLogger->debug('AuditService', "Attempting to log action: $action on $entityType:$entityId");
        }

        $userId = null;
        if (isset($_REQUEST['authenticated_user']) && isset($_REQUEST['authenticated_user']['employee_id'])) {
            $userId = $_REQUEST['authenticated_user']['employee_id'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
            try {
                if (class_exists('JWTService')) {
                    $jwtService = new JWTService();
                    $userData = $jwtService->getUserFromToken($token);
                    if ($userData) {
                        $userId = $userData['employee_id'];
                    }
                }
            } catch (Exception $e) {
                if ($fileLogger) $fileLogger->error('AuditService', "JWT Error: " . $e->getMessage());
            }
        }

        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        }

        try {
            $result = $this->auditRepo->create(
                $userId,
                strtoupper($action),
                $entityType,
                (string)$entityId,
                $oldValues,
                $newValues,
                $ipAddress
            );
            
            if ($fileLogger) {
                if ($result) {
                    $fileLogger->info('AuditService', "Audit log created successfully.");
                } else {
                    $fileLogger->error('AuditService', "Audit log creation returned false.");
                }
            }
            return $result;
        } catch (Exception $e) {
            if ($fileLogger) {
                $fileLogger->error('AuditService', "Audit log exception: " . $e->getMessage());
            }
            return false;
        }
    }
}
