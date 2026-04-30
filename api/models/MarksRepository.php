<?php

/**
 * MarksRepository
 * Handles database operations for Marks (CO-aggregated scores)
 */
class MarksRepository
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Find marks by test and student
     */
    public function findByTestAndStudent($testId, $studentId)
    {
        // Pivot the tall (co_number, marks_obtained) rows back to CO1-CO6 for the domain model
        $stmt = $this->db->prepare("
            SELECT
                student_roll_no, test_id,
                MAX(CASE WHEN co_number = 1 THEN marks_obtained ELSE 0 END) AS CO1,
                MAX(CASE WHEN co_number = 2 THEN marks_obtained ELSE 0 END) AS CO2,
                MAX(CASE WHEN co_number = 3 THEN marks_obtained ELSE 0 END) AS CO3,
                MAX(CASE WHEN co_number = 4 THEN marks_obtained ELSE 0 END) AS CO4,
                MAX(CASE WHEN co_number = 5 THEN marks_obtained ELSE 0 END) AS CO5,
                MAX(CASE WHEN co_number = 6 THEN marks_obtained ELSE 0 END) AS CO6
            FROM marks
            WHERE test_id = ? AND student_roll_no = ?
            GROUP BY student_roll_no, test_id
        ");
        $stmt->execute([$testId, $studentId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return new Marks(
                $row['student_roll_no'],
                $row['test_id'],
                $row['CO1'],
                $row['CO2'],
                $row['CO3'],
                $row['CO4'],
                $row['CO5'],
                $row['CO6'],
                null
            );
        }
        return null;
    }

    /**
     * Find all marks for a test
     */
    public function findByTest($testId)
    {
        // Pivot the tall rows back to CO1-CO6 per student
        $stmt = $this->db->prepare("
            SELECT
                m.student_roll_no, m.test_id, s.student_name,
                MAX(CASE WHEN m.co_number = 1 THEN m.marks_obtained ELSE 0 END) AS CO1,
                MAX(CASE WHEN m.co_number = 2 THEN m.marks_obtained ELSE 0 END) AS CO2,
                MAX(CASE WHEN m.co_number = 3 THEN m.marks_obtained ELSE 0 END) AS CO3,
                MAX(CASE WHEN m.co_number = 4 THEN m.marks_obtained ELSE 0 END) AS CO4,
                MAX(CASE WHEN m.co_number = 5 THEN m.marks_obtained ELSE 0 END) AS CO5,
                MAX(CASE WHEN m.co_number = 6 THEN m.marks_obtained ELSE 0 END) AS CO6
            FROM marks m
            JOIN students s ON m.student_roll_no = s.roll_no
            WHERE m.test_id = ?
            GROUP BY m.student_roll_no, m.test_id, s.student_name
            ORDER BY m.student_roll_no
        ");
        $stmt->execute([$testId]);

        $marksList = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $marks = new Marks(
                $row['student_roll_no'],
                $row['test_id'],
                $row['CO1'],
                $row['CO2'],
                $row['CO3'],
                $row['CO4'],
                $row['CO5'],
                $row['CO6']
            );
            $marksList[] = [
                'marks' => $marks,
                'student_name' => $row['student_name']
            ];
        }
        return $marksList;
    }

    /**
     * Save or update marks (upsert)
     */
    public function save(Marks $marks)
    {
        // Insert/update one row per CO number (tall table storage)
        $stmt = $this->db->prepare("
            INSERT INTO marks (student_roll_no, test_id, co_number, marks_obtained)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained)
        ");

        $result = true;
        for ($co = 1; $co <= 6; $co++) {
            $result = $stmt->execute([
                $marks->getStudentRollNo(),
                $marks->getTestId(),
                $co,
                $marks->getCOValue($co)
            ]) && $result;
        }

        return $result;
    }

    /**
     * Delete marks for a test and student
     */
    public function deleteByTestAndStudent($testId, $studentId)
    {
        $stmt = $this->db->prepare("DELETE FROM marks WHERE test_id = ? AND student_roll_no = ?");
        return $stmt->execute([$testId, $studentId]);
    }

    /**
     * Check if marks exist
     */
    public function exists($testId, $studentId)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM marks WHERE test_id = ? AND student_roll_no = ?");
        $stmt->execute([$testId, $studentId]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Aggregate CO marks from raw marks for a student in a test
     */
    public function aggregateFromRawMarks($testId, $studentId)
    {
        // Calculate CO totals from raw marks;
        // test context is now derived via question_id → questions.test_id
        $stmt = $this->db->prepare("
            SELECT q.co, SUM(r.marks_obtained) as total
            FROM raw_marks r
            JOIN questions q ON r.question_id = q.question_id
            WHERE q.test_id = ? AND r.student_id = ?
            GROUP BY q.co
        ");
        $stmt->execute([$testId, $studentId]);

        $coTotals = [
            'CO1' => 0,
            'CO2' => 0,
            'CO3' => 0,
            'CO4' => 0,
            'CO5' => 0,
            'CO6' => 0
        ];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $coKey = 'CO' . $row['co'];
            $coTotals[$coKey] = (float)$row['total'];
        }

        // Create or update marks record
        $marks = new Marks(
            $studentId,
            $testId,
            $coTotals['CO1'],
            $coTotals['CO2'],
            $coTotals['CO3'],
            $coTotals['CO4'],
            $coTotals['CO5'],
            $coTotals['CO6']
        );

        return $this->save($marks);
    }
}
