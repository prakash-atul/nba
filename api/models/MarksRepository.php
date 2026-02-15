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
        $stmt = $this->db->prepare("SELECT * FROM marks WHERE test_id = ? AND student_roll_no = ?");
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
                $row['id']
            );
        }
        return null;
    }

    /**
     * Find all marks for a test
     */
    public function findByTest($testId)
    {
        $stmt = $this->db->prepare("
            SELECT m.*, s.student_name as student_name 
            FROM marks m
            JOIN students s ON m.student_roll_no = s.roll_no
            WHERE m.test_id = ?
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
                $row['CO6'],
                $row['id']
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
        $stmt = $this->db->prepare("
            INSERT INTO marks (student_roll_no, test_id, CO1, CO2, CO3, CO4, CO5, CO6) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                CO1 = VALUES(CO1),
                CO2 = VALUES(CO2),
                CO3 = VALUES(CO3),
                CO4 = VALUES(CO4),
                CO5 = VALUES(CO5),
                CO6 = VALUES(CO6)
        ");

        $result = $stmt->execute([
            $marks->getStudentRollNo(),
            $marks->getTestId(),
            $marks->getCO1(),
            $marks->getCO2(),
            $marks->getCO3(),
            $marks->getCO4(),
            $marks->getCO5(),
            $marks->getCO6()
        ]);

        if ($result && $marks->getId() === null) {
            $marks->setId($this->db->lastInsertId());
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
        // Calculate CO totals from raw marks
        $stmt = $this->db->prepare("
            SELECT q.co, SUM(r.marks_obtained) as total
            FROM raw_marks r
            JOIN questions q ON r.question_id = q.question_id
            WHERE r.test_id = ? AND r.student_id = ?
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
