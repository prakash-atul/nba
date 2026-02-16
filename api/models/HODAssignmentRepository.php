<?php

/**
 * HODAssignment Repository Class
 * Follows Single Responsibility Principle - handles only database operations for HOD assignments
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class HODAssignmentRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find HOD assignment by ID
     * @param int $id
     * @return HODAssignment|null
     */
    public function findById($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM hod_assignments WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new HODAssignment(
                    $data['id'],
                    $data['department_id'],
                    $data['employee_id'],
                    $data['start_date'],
                    $data['end_date'],
                    $data['is_current'],
                    $data['appointment_order'],
                    $data['created_at']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get current HOD for a department
     * @param int $departmentId
     * @return HODAssignment|null
     */
    public function getCurrentHOD($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM hod_assignments 
                WHERE department_id = ? AND is_current = 1
                LIMIT 1
            ");
            $stmt->execute([$departmentId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new HODAssignment(
                    $data['id'],
                    $data['department_id'],
                    $data['employee_id'],
                    $data['start_date'],
                    $data['end_date'],
                    $data['is_current'],
                    $data['appointment_order'],
                    $data['created_at']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all current HODs with details
     * @return array
     */
    public function getAllCurrentHODs()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    h.*,
                    d.department_name,
                    d.department_code,
                    u.username,
                    u.email,
                    u.designation
                FROM hod_assignments h
                JOIN departments d ON h.department_id = d.department_id
                JOIN users u ON h.employee_id = u.employee_id
                WHERE h.is_current = 1
                ORDER BY d.department_name
            ");
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get HOD history for a department
     * @param int $departmentId
     * @return array
     */
    public function getHistoryByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    h.*,
                    u.username,
                    u.email,
                    u.designation
                FROM hod_assignments h
                JOIN users u ON h.employee_id = u.employee_id
                WHERE h.department_id = ?
                ORDER BY h.start_date DESC
            ");
            $stmt->execute([$departmentId]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Create a new HOD assignment
     * @param HODAssignment $assignment
     * @return int Last insert ID
     */
    public function create(HODAssignment $assignment)
    {
        try {
            $assignment->validate();
            
            // Begin transaction to ensure data consistency
            $this->db->beginTransaction();

            // Check if there's an existing assignment with same dept, employee, and start_date
            // (handles case where HOD is demoted and re-appointed on the same day)
            $checkStmt = $this->db->prepare("
                SELECT id FROM hod_assignments 
                WHERE department_id = ? AND employee_id = ? AND start_date = ?
            ");
            $checkStmt->execute([
                $assignment->getDepartmentId(),
                $assignment->getEmployeeId(),
                $assignment->getStartDate()
            ]);
            $existingId = $checkStmt->fetchColumn();

            if ($existingId) {
                // Reactivate existing assignment instead of creating duplicate
                $updateStmt = $this->db->prepare("
                    UPDATE hod_assignments 
                    SET is_current = ?, end_date = ?, appointment_order = ?
                    WHERE id = ?
                ");
                $updateStmt->execute([
                    $assignment->getIsCurrent(),
                    $assignment->getEndDate(),
                    $assignment->getAppointmentOrder(),
                    $existingId
                ]);
                
                // Also end any other current assignments for this department
                if ($assignment->getIsCurrent()) {
                    $endOthersStmt = $this->db->prepare("
                        UPDATE hod_assignments 
                        SET is_current = 0, end_date = CURDATE()
                        WHERE department_id = ? AND is_current = 1 AND id != ?
                    ");
                    $endOthersStmt->execute([$assignment->getDepartmentId(), $existingId]);
                }
                
                $this->db->commit();
                return $existingId;
            }

            // If this is marked as current, unset other current assignments for the same department
            if ($assignment->getIsCurrent()) {
                $stmt = $this->db->prepare("
                    UPDATE hod_assignments 
                    SET is_current = 0, end_date = CURDATE()
                    WHERE department_id = ? AND is_current = 1
                ");
                $stmt->execute([$assignment->getDepartmentId()]);
            }

            // Insert new assignment
            $stmt = $this->db->prepare("
                INSERT INTO hod_assignments 
                (department_id, employee_id, start_date, end_date, is_current, appointment_order) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $assignment->getDepartmentId(),
                $assignment->getEmployeeId(),
                $assignment->getStartDate(),
                $assignment->getEndDate(),
                $assignment->getIsCurrent(),
                $assignment->getAppointmentOrder()
            ]);

            $lastId = $this->db->lastInsertId();
            $this->db->commit();

            return $lastId;
        } catch (PDOException $e) {
            $this->db->rollBack();
            if ($e->getCode() == 23000) {
                throw new Exception("Duplicate HOD assignment");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * End current HOD assignment
     * @param int $departmentId
     * @param string $endDate
     * @return bool
     */
    public function endCurrentAssignment($departmentId, $endDate = null)
    {
        try {
            $endDate = $endDate ?? date('Y-m-d');
            
            $stmt = $this->db->prepare("
                UPDATE hod_assignments 
                SET is_current = 0, end_date = ?
                WHERE department_id = ? AND is_current = 1
            ");

            $stmt->execute([$endDate, $departmentId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete an HOD assignment by ID
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM hod_assignments WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
