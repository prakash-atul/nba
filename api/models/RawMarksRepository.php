<?php

/**
 * RawMarksRepository
 * Handles database operations for RawMarks
 */
class RawMarksRepository
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Find raw marks by test and student
     */
    public function findByTestAndStudent($testId, $studentId)
    {
        // test_id is no longer stored; derive it via the questions join
        $stmt = $this->db->prepare("
            SELECT r.*, q.question_number, q.sub_question, q.co 
            FROM raw_marks r
            JOIN questions q ON r.question_id = q.question_id
            WHERE q.test_id = ? AND r.student_id = ?
            ORDER BY q.question_number, q.sub_question
        ");
        $stmt->execute([$testId, $studentId]);

        $rawMarks = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $rawMarks[] = [
                'raw_marks' => new RawMarks(
                    $row['student_id'],
                    $row['question_id'],
                    $row['marks_obtained'],
                    $row['id']
                ),
                'question_number' => $row['question_number'],
                'sub_question' => $row['sub_question'],
                'co' => $row['co']
            ];
        }
        return $rawMarks;
    }

    /**
     * Save or update raw marks (upsert)
     */
    public function save(RawMarks $rawMarks)
    {
        // test_id column removed from table; uniqueness is (student_id, question_id)
        $stmt = $this->db->prepare("
            INSERT INTO raw_marks (student_id, question_id, marks_obtained) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE marks_obtained = VALUES(marks_obtained)
        ");

        $result = $stmt->execute([
            $rawMarks->getStudentId(),
            $rawMarks->getQuestionId(),
            $rawMarks->getMarksObtained()
        ]);

        if ($result && $rawMarks->getId() === null) {
            $rawMarks->setId($this->db->lastInsertId());
        }

        return $result;
    }

    /**
     * Save multiple raw marks entries
     */
    public function saveMultiple(array $rawMarksArray)
    {
        $this->db->beginTransaction();
        try {
            foreach ($rawMarksArray as $rawMarks) {
                $this->save($rawMarks);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Delete all raw marks for a test and student
     */
    public function deleteByTestAndStudent($testId, $studentId)
    {
        // Join via questions to filter by test_id (no longer stored on raw_marks)
        $stmt = $this->db->prepare("
            DELETE r FROM raw_marks r
            JOIN questions q ON r.question_id = q.question_id
            WHERE q.test_id = ? AND r.student_id = ?
        ");
        return $stmt->execute([$testId, $studentId]);
    }

    /**
     * Calculate CO totals from raw marks
     * Returns array with CO1-CO6 totals
     */
    public function calculateCOTotals($testId, $studentId)
    {
        // test_id is derived via the questions join
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
            $coTotals['CO' . $row['co']] = $row['total'];
        }

        return $coTotals;
    }

    /**
     * Find raw marks by ID
     */
    public function findById($id)
    {
        $stmt = $this->db->prepare("SELECT * FROM raw_marks WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return new RawMarks(
                $row['student_id'],
                $row['question_id'],
                $row['marks_obtained'],
                $row['id']
            );
        }
        return null;
    }

    /**
     * Update existing raw marks
     */
    public function update(RawMarks $rawMarks)
    {
        $stmt = $this->db->prepare("
            UPDATE raw_marks 
            SET marks_obtained = ? 
            WHERE id = ?
        ");
        return $stmt->execute([
            $rawMarks->getMarksObtained(),
            $rawMarks->getId()
        ]);
    }

    /**
     * Delete raw marks by ID
     */
    public function delete($id)
    {
        $stmt = $this->db->prepare("DELETE FROM raw_marks WHERE id = ?");
        return $stmt->execute([$id]);
    }

    /**
     * Delete all raw marks for a specific course offering
     */
    public function deleteByOfferingId($offeringId)
    {
        $stmt = $this->db->prepare("
            DELETE rm FROM raw_marks rm
            INNER JOIN questions q ON rm.question_id = q.question_id
            INNER JOIN tests t ON q.test_id = t.test_id
            WHERE t.offering_id = ?
        ");
        return $stmt->execute([$offeringId]);
    }
}
