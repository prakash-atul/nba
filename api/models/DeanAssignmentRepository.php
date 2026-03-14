<?php

/**
 * DeanAssignment Repository Class
 * Follows Single Responsibility Principle - handles only database operations for Dean assignments
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class DeanAssignmentRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find Dean assignment by ID
     * @param int $id
     * @return DeanAssignment|null
     */
    public function findById($id)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *, (end_date IS NULL) AS is_current
                FROM dean_assignments WHERE id = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new DeanAssignment(
                    $data['id'],
                    $data['school_id'],
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
     * Get current Dean for a school
     * @param int $schoolId
     * @return DeanAssignment|null
     */
    public function getCurrentDean($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT *, (end_date IS NULL) AS is_current
                FROM dean_assignments 
                WHERE school_id = ? AND end_date IS NULL
                LIMIT 1
            ");
            $stmt->execute([$schoolId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new DeanAssignment(
                    $data['id'],
                    $data['school_id'],
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
     * Get all current Deans with details
     * @return array
     */
    public function getAllCurrentDeans()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    da.*,
                    (da.end_date IS NULL) AS is_current,
                    s.school_name,
                    s.school_code,
                    u.username,
                    u.email,
                    u.designation
                FROM dean_assignments da
                JOIN schools s ON da.school_id = s.school_id
                JOIN users u ON da.employee_id = u.employee_id
                WHERE da.end_date IS NULL
                ORDER BY s.school_name
            ");
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get Dean history for a school
     * @param int $schoolId
     * @return array
     */
    public function getHistoryBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    da.*,
                    (da.end_date IS NULL) AS is_current,
                    u.username,
                    u.email,
                    u.designation
                FROM dean_assignments da
                JOIN users u ON da.employee_id = u.employee_id
                WHERE da.school_id = ?
                ORDER BY da.start_date DESC
            ");
            $stmt->execute([$schoolId]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Create a new Dean assignment
     * @param DeanAssignment $assignment
     * @return int Last insert ID
     */
    public function create(DeanAssignment $assignment)
    {
        try {
            $assignment->validate();
            
            // Begin transaction to ensure data consistency
            $this->db->beginTransaction();

            // If this is marked as current, unset other current assignments for the same school
            if ($assignment->getIsCurrent()) {
                $stmt = $this->db->prepare("
                    UPDATE dean_assignments 
                    SET end_date = CURDATE()
                    WHERE school_id = ? AND end_date IS NULL
                ");
                $stmt->execute([$assignment->getSchoolId()]);
            }

            // Insert new assignment (is_current no longer stored; active = end_date IS NULL)
            $stmt = $this->db->prepare("
                INSERT INTO dean_assignments 
                (school_id, employee_id, start_date, end_date, appointment_order) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $assignment->getSchoolId(),
                $assignment->getEmployeeId(),
                $assignment->getStartDate(),
                $assignment->getIsCurrent() ? null : ($assignment->getEndDate() ?? date('Y-m-d')),
                $assignment->getAppointmentOrder()
            ]);

            $lastId = $this->db->lastInsertId();
            $this->db->commit();

            return $lastId;
        } catch (PDOException $e) {
            $this->db->rollBack();
            if ($e->getCode() == 23000) {
                throw new Exception("Duplicate Dean assignment");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * End current Dean assignment
     * @param int $schoolId
     * @param string $endDate
     * @return bool
     */
    public function endCurrentAssignment($schoolId, $endDate = null)
    {
        try {
            $endDate = $endDate ?? date('Y-m-d');
            
            $stmt = $this->db->prepare("
                UPDATE dean_assignments 
                SET end_date = ?
                WHERE school_id = ? AND end_date IS NULL
            ");

            $stmt->execute([$endDate, $schoolId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete a Dean assignment by ID
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM dean_assignments WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
