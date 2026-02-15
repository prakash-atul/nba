<?php

/**
 * Faculty Controller
 * Handles faculty-specific operations
 */
class FacultyController
{
    private $courseRepository;
    private $testRepository;
    private $enrollmentRepository;
    private $marksRepository;
    private $db;

    public function __construct(
        CourseRepository $courseRepository,
        TestRepository $testRepository,
        EnrollmentRepository $enrollmentRepository,
        MarksRepository $marksRepository,
        $db
    ) {
        $this->courseRepository = $courseRepository;
        $this->testRepository = $testRepository;
        $this->enrollmentRepository = $enrollmentRepository;
        $this->marksRepository = $marksRepository;
        $this->db = $db;
    }

    /**
     * Get faculty dashboard statistics
     */
    public function getStats($facultyId)
    {
        try {
            // Get courses taught by this faculty
            $stmt = $this->db->prepare("
                SELECT course_id FROM courses WHERE faculty_id = ?
            ");
            $stmt->execute([$facultyId]);
            $courses = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $totalCourses = count($courses);

            // Get total assessments
            $totalAssessments = 0;
            $totalStudents = 0;
            $totalAttainment = 0;
            $assessmentCount = 0;

            foreach ($courses as $courseId) {
                // Count tests for this course
                $stmt = $this->db->prepare("
                    SELECT COUNT(*) FROM tests WHERE course_id = ?
                ");
                $stmt->execute([$courseId]);
                $totalAssessments += $stmt->fetchColumn();

                // Count enrolled students
                $stmt = $this->db->prepare("
                    SELECT COUNT(DISTINCT student_rollno) 
                    FROM enrollments 
                    WHERE course_id = ?
                ");
                $stmt->execute([$courseId]);
                $totalStudents += $stmt->fetchColumn();

                // Calculate average attainment for this course (if tests exist)
                // Sum all CO marks and compare to full_marks to get percentage
                $stmt = $this->db->prepare("
                    SELECT 
                        AVG(
                            ((marks.CO1 + marks.CO2 + marks.CO3 + marks.CO4 + marks.CO5 + marks.CO6) / tests.full_marks) * 100
                        ) as avg_attainment
                    FROM marks
                    JOIN tests ON marks.test_id = tests.test_id
                    WHERE tests.course_id = ?
                ");
                $stmt->execute([$courseId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($result && $result['avg_attainment'] !== null) {
                    $totalAttainment += floatval($result['avg_attainment']);
                    $assessmentCount++;
                }
            }

            $averageAttainment = $assessmentCount > 0 
                ? round($totalAttainment / $assessmentCount, 1) 
                : 0;

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Faculty stats retrieved successfully',
                'data' => [
                    'totalCourses' => $totalCourses,
                    'totalAssessments' => $totalAssessments,
                    'totalStudents' => $totalStudents,
                    'averageAttainment' => $averageAttainment
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error getting faculty stats: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve faculty statistics',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Delete a test/assessment
     * Also deletes all associated questions, raw marks, and CO marks (CASCADE)
     */
    public function deleteTest($testId, $facultyId)
    {
        try {
            // First verify that this test belongs to a course taught by this faculty
            $stmt = $this->db->prepare("
                SELECT t.test_id, t.test_name, c.course_code, c.course_name
                FROM tests t
                JOIN courses c ON t.course_id = c.course_id
                WHERE t.test_id = ? AND c.faculty_id = ?
            ");
            $stmt->execute([$testId, $facultyId]);
            $test = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$test) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => false,
                    'message' => 'Test not found or you do not have permission to delete this test'
                ]);
                return;
            }

            // Get counts for confirmation message
            $stmt = $this->db->prepare("
                SELECT 
                    (SELECT COUNT(*) FROM questions WHERE test_id = ?) as question_count,
                    (SELECT COUNT(DISTINCT student_roll_no) FROM marks WHERE test_id = ?) as student_count,
                    (SELECT COUNT(*) FROM raw_marks WHERE test_id = ?) as raw_marks_count
            ");
            $stmt->execute([$testId, $testId, $testId]);
            $counts = $stmt->fetch(PDO::FETCH_ASSOC);

            // Delete the test (CASCADE will handle questions, raw_marks, and marks)
            $stmt = $this->db->prepare("DELETE FROM tests WHERE test_id = ?");
            $stmt->execute([$testId]);

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'message' => 'Test deleted successfully',
                'data' => [
                    'test_name' => $test['test_name'],
                    'course_code' => $test['course_code'],
                    'questions_deleted' => (int)$counts['question_count'],
                    'students_affected' => (int)$counts['student_count'],
                    'raw_marks_deleted' => (int)$counts['raw_marks_count']
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error deleting test: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete test',
                'error' => $e->getMessage()
            ]);
        }
    }
}