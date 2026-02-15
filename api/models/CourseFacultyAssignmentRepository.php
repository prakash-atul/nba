<?php

/**
 * CourseFacultyAssignment Repository Class
 * Follows Single Responsibility Principle - handles only database operations for course faculty assignments
 * Follows Dependency Inversion Principle - depends on abstractions
 */
class CourseFacultyAssignmentRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find assignment by ID
     * @param int $id
     * @return CourseFacultyAssignment|null
     */
    public function findById($id)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM course_faculty_assignments WHERE id = ?");
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                return new CourseFacultyAssignment(
                    $data['id'],
                    $data['course_id'],
                    $data['employee_id'],
                    $data['year'],
                    $data['semester'],
                    $data['assignment_type'],
                    $data['assigned_date'],
                    $data['completion_date'],
                    $data['is_active'],
                    $data['created_at']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get active assignments for a course in specific year/semester
     * @param int $courseId
     * @param int $year
     * @param int $semester
     * @return array
     */
    public function getAssignmentsByCourse($courseId, $year, $semester)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    cfa.*,
                    u.username,
                    u.email,
                    u.designation
                FROM course_faculty_assignments cfa
                JOIN users u ON cfa.employee_id = u.employee_id
                WHERE cfa.course_id = ? AND cfa.year = ? AND cfa.semester = ? AND cfa.is_active = 1
                ORDER BY 
                    CASE cfa.assignment_type
                        WHEN 'Primary' THEN 1
                        WHEN 'Co-instructor' THEN 2
                        WHEN 'Lab' THEN 3
                    END
            ");
            $stmt->execute([$courseId, $year, $semester]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get active assignments for a faculty member
     * @param int $employeeId
     * @param int $year
     * @param int $semester
     * @return array
     */
    public function getAssignmentsByFaculty($employeeId, $year = null, $semester = null)
    {
        try {
            $sql = "
                SELECT 
                    cfa.*,
                    c.course_code,
                    c.course_name as course_name
                FROM course_faculty_assignments cfa
                JOIN courses c ON cfa.course_id = c.course_id
                WHERE cfa.employee_id = ? AND cfa.is_active = 1
            ";
            
            $params = [$employeeId];
            
            if ($year !== null) {
                $sql .= " AND cfa.year = ?";
                $params[] = $year;
            }
            
            if ($semester !== null) {
                $sql .= " AND cfa.semester = ?";
                $params[] = $semester;
            }
            
            $sql .= " ORDER BY cfa.year DESC, cfa.semester DESC, c.course_code";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get primary faculty for a course
     * @param int $courseId
     * @param int $year
     * @param int $semester
     * @return array|null
     */
    public function getPrimaryFaculty($courseId, $year, $semester)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    cfa.*,
                    u.username,
                    u.email,
                    u.designation
                FROM course_faculty_assignments cfa
                JOIN users u ON cfa.employee_id = u.employee_id
                WHERE cfa.course_id = ? AND cfa.year = ? AND cfa.semester = ? 
                    AND cfa.assignment_type = 'Primary' AND cfa.is_active = 1
                LIMIT 1
            ");
            $stmt->execute([$courseId, $year, $semester]);
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Create a new course faculty assignment
     * @param CourseFacultyAssignment $assignment
     * @return int Last insert ID
     */
    public function create(CourseFacultyAssignment $assignment)
    {
        try {
            $assignment->validate();
            
            $stmt = $this->db->prepare("
                INSERT INTO course_faculty_assignments 
                (course_id, employee_id, year, semester, assignment_type, assigned_date, completion_date, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $assignment->getCourseId(),
                $assignment->getEmployeeId(),
                $assignment->getYear(),
                $assignment->getSemester(),
                $assignment->getAssignmentType(),
                $assignment->getAssignedDate(),
                $assignment->getCompletionDate(),
                $assignment->getIsActive()
            ]);

            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                throw new Exception("Duplicate assignment for this course, faculty, year, semester, and type");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Update an assignment
     * @param CourseFacultyAssignment $assignment
     * @return bool
     */
    public function update(CourseFacultyAssignment $assignment)
    {
        try {
            $assignment->validate();
            
            $stmt = $this->db->prepare("
                UPDATE course_faculty_assignments 
                SET course_id = ?, employee_id = ?, year = ?, semester = ?, 
                    assignment_type = ?, assigned_date = ?, completion_date = ?, is_active = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $assignment->getCourseId(),
                $assignment->getEmployeeId(),
                $assignment->getYear(),
                $assignment->getSemester(),
                $assignment->getAssignmentType(),
                $assignment->getAssignedDate(),
                $assignment->getCompletionDate(),
                $assignment->getIsActive(),
                $assignment->getId()
            ]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                throw new Exception("Duplicate assignment for this course, faculty, year, semester, and type");
            }
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Deactivate an assignment
     * @param int $id
     * @param string $completionDate
     * @return bool
     */
    public function deactivate($id, $completionDate = null)
    {
        try {
            $completionDate = $completionDate ?? date('Y-m-d');
            
            $stmt = $this->db->prepare("
                UPDATE course_faculty_assignments 
                SET is_active = 0, completion_date = ?
                WHERE id = ?
            ");

            $stmt->execute([$completionDate, $id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete an assignment
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM course_faculty_assignments WHERE id = ?");
            $stmt->execute([$id]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all assignments for a department in a specific year/semester
     * @param int $departmentId
     * @param int $year
     * @param int $semester
     * @return array
     */
    public function getAssignmentsByDepartment($departmentId, $year, $semester)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    cfa.*,
                    c.course_code,
                    c.course_name as course_name,
                    u.username,
                    u.email
                FROM course_faculty_assignments cfa
                JOIN courses c ON cfa.course_id = c.course_id
                JOIN users u ON cfa.employee_id = u.employee_id
                WHERE c.department_id = ? AND cfa.year = ? AND cfa.semester = ? AND cfa.is_active = 1
                ORDER BY c.course_code, cfa.assignment_type
            ");
            $stmt->execute([$departmentId, $year, $semester]);
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
