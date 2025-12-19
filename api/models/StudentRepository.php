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
        $stmt = $this->db->prepare("SELECT * FROM student WHERE rollno = ?");
        $stmt->execute([$rollno]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return new Student($row['rollno'], $row['name'], $row['dept']);
        }
        return null;
    }

    /**
     * Find students by department
     */
    public function findByDepartment($deptId)
    {
        $stmt = $this->db->prepare("SELECT * FROM student WHERE dept = ? ORDER BY rollno");
        $stmt->execute([$deptId]);

        $students = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $students[] = new Student($row['rollno'], $row['name'], $row['dept']);
        }
        return $students;
    }

    /**
     * Create a new student
     */
    public function save(Student $student)
    {
        $stmt = $this->db->prepare("INSERT INTO student (rollno, name, dept) VALUES (?, ?, ?)");
        return $stmt->execute([
            $student->getRollno(),
            $student->getName(),
            $student->getDept()
        ]);
    }

    /**
     * Update student
     */
    public function update(Student $student)
    {
        $stmt = $this->db->prepare("UPDATE student SET name = ?, dept = ? WHERE rollno = ?");
        return $stmt->execute([
            $student->getName(),
            $student->getDept(),
            $student->getRollno()
        ]);
    }

    /**
     * Check if student exists
     */
    public function exists($rollno)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM student WHERE rollno = ?");
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
                FROM student s 
                LEFT JOIN departments d ON s.dept = d.department_id 
                ORDER BY s.rollno
            ");
            $stmt->execute();
            $students = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $students[] = [
                    'rollno' => $data['rollno'],
                    'name' => $data['name'],
                    'dept' => $data['dept'],
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
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM student");
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
