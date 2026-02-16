<?php

/**
 * StudentRepository
 * Handles database operations for Student
 */
class StudentRepository
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Find student by roll number
     */
    public function findByRollno($rollno)
    {
        $stmt = $this->db->prepare("SELECT * FROM students WHERE roll_no = ?");
        $stmt->execute([$rollno]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return new Student(
                $row['roll_no'], 
                $row['student_name'], 
                $row['department_id'],
                $row['batch_year'] ?? null,
                $row['student_status'] ?? 'Active',
                $row['email'] ?? null,
                $row['phone'] ?? null
            );
        }
        return null;
    }

    /**
     * Find students by department
     */
    public function findByDepartment($deptId)
    {
        $stmt = $this->db->prepare("SELECT * FROM students WHERE department_id = ? ORDER BY roll_no");
        $stmt->execute([$deptId]);

        $students = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $students[] = new Student(
                $row['roll_no'], 
                $row['student_name'], 
                $row['department_id'],
                $row['batch_year'] ?? null,
                $row['student_status'] ?? 'Active',
                $row['email'] ?? null,
                $row['phone'] ?? null
            );
        }
        return $students;
    }

    /**
     * Find students by school ID
     * @param int $schoolId
     * @return array
     */
    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.* 
                FROM students s
                JOIN departments d ON s.department_id = d.department_id
                WHERE d.school_id = ?
                ORDER BY s.roll_no
            ");
            $stmt->execute([$schoolId]);
            $students = [];

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $students[] = new Student(
                    $row['roll_no'], 
                    $row['student_name'], 
                    $row['department_id'],
                    $row['batch_year'] ?? null,
                    $row['student_status'] ?? 'Active',
                    $row['email'] ?? null,
                    $row['phone'] ?? null
                );
            }
            return $students;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count students by school ID
     * @param int $schoolId
     * @return int
     */
    public function countBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) 
                FROM students s
                JOIN departments d ON s.department_id = d.department_id
                WHERE d.school_id = ?
            ");
            $stmt->execute([$schoolId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Create a new student
     */
    public function save(Student $student)
    {
        $stmt = $this->db->prepare(
            "INSERT INTO students (roll_no, student_name, department_id, batch_year, student_status, email, phone) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        return $stmt->execute([
            $student->getRollNo(),
            $student->getStudentName(),
            $student->getDepartmentId(),
            $student->getBatchYear(),
            $student->getStudentStatus(),
            $student->getEmail(),
            $student->getPhone()
        ]);
    }

    /**
     * Update student
     */
    public function update(Student $student)
    {
        $stmt = $this->db->prepare(
            "UPDATE students SET student_name = ?, department_id = ?, batch_year = ?, 
             student_status = ?, email = ?, phone = ? WHERE roll_no = ?"
        );
        return $stmt->execute([
            $student->getStudentName(),
            $student->getDepartmentId(),
            $student->getBatchYear(),
            $student->getStudentStatus(),
            $student->getEmail(),
            $student->getPhone(),
            $student->getRollNo()
        ]);
    }

    /**
     * Check if student exists
     */
    public function exists($rollno)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM students WHERE roll_no = ?");
        $stmt->execute([$rollno]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Get all students with department info
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT s.*, d.department_name, d.department_code 
                FROM students s 
                LEFT JOIN departments d ON s.department_id = d.department_id 
                ORDER BY s.roll_no
            ");
            $stmt->execute();
            $students = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $students[] = [
                    'roll_no' => $data['roll_no'],
                    'student_name' => $data['student_name'],
                    'department_id' => $data['department_id'],
                    'batch_year' => $data['batch_year'],
                    'student_status' => $data['student_status'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'department_name' => $data['department_name'],
                    'department_code' => $data['department_code']
                ];
            }

            return $students;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all students
     * @return int
     */
    public function countAll()
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM students");
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
