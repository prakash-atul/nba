<?php

/**
 * Department Repository Class
 * Follows Single Responsibility Principle - handles only database operations for departments
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class DepartmentRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find department by ID
     * @param int $departmentId
     * @return Department|null
     */
    public function findById($departmentId)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM departments WHERE department_id = ?");
            $stmt->execute([$departmentId]);
            $deptData = $stmt->fetch();

            if ($deptData) {
                return new Department(
                    $deptData['department_id'],
                    $deptData['department_name'],
                    $deptData['department_code'],
                    $deptData['school_id'] ?? null,
                    $deptData['description'] ?? null,
                    $deptData['created_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find department by code
     * @param string $departmentCode
     * @return Department|null
     */
    public function findByCode($departmentCode)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM departments WHERE department_code = ?");
            $stmt->execute([strtoupper($departmentCode)]);
            $deptData = $stmt->fetch();

            if ($deptData) {
                return new Department(
                    $deptData['department_id'],
                    $deptData['department_name'],
                    $deptData['department_code'],
                    $deptData['school_id'] ?? null,
                    $deptData['description'] ?? null,
                    $deptData['created_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all departments
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT d.*, s.school_name, s.school_code 
                FROM departments d 
                LEFT JOIN schools s ON d.school_id = s.school_id 
                ORDER BY d.department_name
            ");
            $stmt->execute();
            $departments = [];

            while ($deptData = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $departments[] = [
                    'department_id' => $deptData['department_id'],
                    'department_name' => $deptData['department_name'],
                    'department_code' => $deptData['department_code'],
                    'school_id' => $deptData['school_id'],
                    'school_name' => $deptData['school_name'] ?? null,
                    'school_code' => $deptData['school_code'] ?? null,
                    'description' => $deptData['description'],
                    'created_at' => $deptData['created_at']
                ];
            }

            return $departments;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find departments by school ID
     * @param int $schoolId
     * @return array
     */
    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT d.*, s.school_name, s.school_code 
                FROM departments d 
                LEFT JOIN schools s ON d.school_id = s.school_id 
                WHERE d.school_id = ?
                ORDER BY d.department_name
            ");
            $stmt->execute([$schoolId]);
            $departments = [];

            while ($deptData = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $departments[] = [
                    'department_id' => $deptData['department_id'],
                    'department_name' => $deptData['department_name'],
                    'department_code' => $deptData['department_code'],
                    'school_id' => $deptData['school_id'],
                    'school_name' => $deptData['school_name'] ?? null,
                    'school_code' => $deptData['school_code'] ?? null,
                    'description' => $deptData['description'],
                    'created_at' => $deptData['created_at']
                ];
            }

            return $departments;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count departments by school ID
     * @param int $schoolId
     * @return int
     */
    public function countBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM departments WHERE school_id = ?");
            $stmt->execute([$schoolId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Save department to database
     * @param Department $department
     * @return bool
     */
    public function save(Department $department)
    {
        try {
            if ($department->getDepartmentId()) {
                // Update existing department
                $stmt = $this->db->prepare("UPDATE departments SET department_name = ?, department_code = ?, school_id = ?, description = ? WHERE department_id = ?");
                return $stmt->execute([
                    $department->getDepartmentName(),
                    $department->getDepartmentCode(),
                    $department->getSchoolId(),
                    $department->getDescription(),
                    $department->getDepartmentId()
                ]);
            } else {
                // Insert new department
                $stmt = $this->db->prepare("INSERT INTO departments (department_name, department_code, school_id, description) VALUES (?, ?, ?, ?)");
                $result = $stmt->execute([
                    $department->getDepartmentName(),
                    $department->getDepartmentCode(),
                    $department->getSchoolId(),
                    $department->getDescription()
                ]);

                if ($result) {
                    $department->setDepartmentId($this->db->lastInsertId());
                }

                return $result;
            }
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete department by ID
     * @param int $departmentId
     * @return bool
     */
    public function delete($departmentId)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM departments WHERE department_id = ?");
            return $stmt->execute([$departmentId]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if department code exists
     * @param string $departmentCode
     * @param int|null $excludeDepartmentId
     * @return bool
     */
    public function codeExists($departmentCode, $excludeDepartmentId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM departments WHERE department_code = ?";
            $params = [strtoupper($departmentCode)];

            if ($excludeDepartmentId) {
                $sql .= " AND department_id != ?";
                $params[] = $excludeDepartmentId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if department name exists
     * @param string $departmentName
     * @param int|null $excludeDepartmentId
     * @return bool
     */
    public function nameExists($departmentName, $excludeDepartmentId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM departments WHERE department_name = ?";
            $params = [$departmentName];

            if ($excludeDepartmentId) {
                $sql .= " AND department_id != ?";
                $params[] = $excludeDepartmentId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all departments
     * @return int
     */
    public function countAll()
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM departments");
            $stmt->execute();
            return (int) $stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
