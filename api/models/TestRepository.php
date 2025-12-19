<?php

/**
 * Test Repository Class
 * Handles database operations for tests
 */
class TestRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find test by ID
     */
    public function findById($id)
    {
        try {
            // Join with course to get course_code, year, semester for filename generation
            $stmt = $this->db->prepare("
                SELECT t.*, c.course_code, c.year, c.semester 
                FROM test t
                JOIN course c ON t.course_id = c.id
                WHERE t.id = ?
            ");
            $stmt->execute([$id]);
            $data = $stmt->fetch();

            if ($data) {
                return new Test(
                    $data['id'],
                    $data['course_id'],
                    $data['name'],
                    $data['full_marks'],
                    $data['pass_marks'],
                    $data['question_paper_pdf'],
                    $data['course_code'],
                    $data['year'],
                    $data['semester']
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find tests by course ID
     */
    public function findByCourseId($courseId)
    {
        try {
            // Join with course to get course_code, year, semester for filename generation
            $stmt = $this->db->prepare("
                SELECT t.*, c.course_code, c.year, c.semester 
                FROM test t
                JOIN course c ON t.course_id = c.id
                WHERE t.course_id = ? 
                ORDER BY t.id DESC
            ");
            $stmt->execute([$courseId]);
            $tests = [];

            while ($data = $stmt->fetch()) {
                $tests[] = new Test(
                    $data['id'],
                    $data['course_id'],
                    $data['name'],
                    $data['full_marks'],
                    $data['pass_marks'],
                    $data['question_paper_pdf'],
                    $data['course_code'],
                    $data['year'],
                    $data['semester']
                );
            }

            return $tests;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Save test
     */
    public function save(Test $test)
    {
        try {
            if ($test->getId()) {
                // Update existing test
                $stmt = $this->db->prepare("UPDATE test SET course_id = ?, name = ?, full_marks = ?, pass_marks = ?, question_paper_pdf = ? WHERE id = ?");
                return $stmt->execute([
                    $test->getCourseId(),
                    $test->getName(),
                    $test->getFullMarks(),
                    $test->getPassMarks(),
                    $test->getQuestionPaperPdf(),
                    $test->getId()
                ]);
            } else {
                // Insert new test
                $stmt = $this->db->prepare("INSERT INTO test (course_id, name, full_marks, pass_marks, question_paper_pdf) VALUES (?, ?, ?, ?, ?)");
                $result = $stmt->execute([
                    $test->getCourseId(),
                    $test->getName(),
                    $test->getFullMarks(),
                    $test->getPassMarks(),
                    $test->getQuestionPaperPdf()
                ]);

                if ($result) {
                    $test->setId($this->db->lastInsertId());
                }

                return $result;
            }
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete test
     */
    public function delete($id)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM test WHERE id = ?");
            return $stmt->execute([$id]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all tests with course info
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT t.*, c.course_code, c.name as course_name, c.year, c.semester 
                FROM test t 
                JOIN course c ON t.course_id = c.id 
                ORDER BY t.id DESC
            ");
            $stmt->execute();
            $tests = [];

            while ($data = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $tests[] = [
                    'id' => $data['id'],
                    'course_id' => $data['course_id'],
                    'course_code' => $data['course_code'],
                    'course_name' => $data['course_name'],
                    'name' => $data['name'],
                    'full_marks' => $data['full_marks'],
                    'pass_marks' => $data['pass_marks'],
                    'year' => $data['year'],
                    'semester' => $data['semester']
                ];
            }

            return $tests;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all tests
     * @return int
     */
    public function countAll()
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM test");
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
