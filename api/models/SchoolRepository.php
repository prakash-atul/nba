<?php

/**
 * School Repository Class
 * Follows Single Responsibility Principle - handles only database operations for schools
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class SchoolRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find school by ID
     * @param int $schoolId
     * @return School|null
     */
    public function findById($schoolId)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM schools WHERE school_id = ?");
            $stmt->execute([$schoolId]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new School(
                    $data['school_id'],
                    $data['school_code'],
                    $data['school_name'],
                    $data['description'],
                    $data['created_at']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find school by code
     * @param string $schoolCode
     * @return School|null
     */
    public function findByCode($schoolCode)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM schools WHERE school_code = ?");
            $stmt->execute([strtoupper($schoolCode)]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new School(
                    $data['school_id'],
                    $data['school_code'],
                    $data['school_name'],
                    $data['description'],
                    $data['created_at']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all schools
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*, COUNT(d.department_id) as departments_count 
                FROM schools s
                LEFT JOIN departments d ON s.school_id = d.school_id
                GROUP BY s.school_id
                ORDER BY s.school_name
            ");
            $stmt->execute();
            $schools = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $schools[] = [
                    'school_id' => $data['school_id'],
                    'school_code' => $data['school_code'],
                    'school_name' => $data['school_name'],
                    'description' => $data['description'],
                    'created_at' => $data['created_at'],
                    'departments_count' => (int)$data['departments_count']
                ];
            }

            return $schools;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Create a new school
     * @param School $school
     * @return int Last insert ID
     */
    public function create(School $school)
    {
        try {
            $school->validate();
            
            $stmt = $this->db->prepare("
                INSERT INTO schools (school_code, school_name, description) 
                VALUES (?, ?, ?)
            ");
            
            $stmt->execute([
                strtoupper($school->getSchoolCode()),
                $school->getSchoolName(),
                $school->getDescription()
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                throw new Exception("School code or name already exists");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Update an existing school
     * @param School $school
     * @return bool
     */
    public function update(School $school)
    {
        try {
            $school->validate();
            
            $stmt = $this->db->prepare("
                UPDATE schools 
                SET school_code = ?, school_name = ?, description = ?
                WHERE school_id = ?
            ");

            $stmt->execute([
                strtoupper($school->getSchoolCode()),
                $school->getSchoolName(),
                $school->getDescription(),
                $school->getSchoolId()
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                throw new Exception("School code or name already exists");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete a school by ID
     * @param int $schoolId
     * @return bool
     */
    public function delete($schoolId)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM schools WHERE school_id = ?");
            $stmt->execute([$schoolId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                throw new Exception("Cannot delete school: It has associated departments");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get departments by school
     * @param int $schoolId
     * @return array
     */
    public function getDepartmentsBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT * FROM departments 
                WHERE school_id = ? 
                ORDER BY department_name
            ");
            $stmt->execute([$schoolId]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
