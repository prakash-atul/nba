<?php

class CourseExitSurveyRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    public function saveResponses(int $offeringId, array $responses): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO course_exit_survey_responses (offering_id, student_rollno, co_number, likert_rating)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE likert_rating = VALUES(likert_rating)'
        );

        $count = 0;
        foreach ($responses as $row) {
            $stmt->execute([
                $offeringId,
                $row['student_rollno'],
                (int)$row['co_number'],
                (int)$row['likert_rating'],
            ]);
            $count++;
        }

        return $count;
    }

    public function getByOfferingId(int $offeringId): array
    {
        $stmt = $this->db->prepare(
            'SELECT cesr.*, CONCAT(\'CO\', cesr.co_number) AS co_name
             FROM course_exit_survey_responses cesr
             WHERE cesr.offering_id = ?
             ORDER BY cesr.co_number, cesr.student_rollno'
        );
        $stmt->execute([$offeringId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getCoAverages(int $offeringId): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                co_number,
                CONCAT('CO', co_number) AS co_name,
                ROUND(AVG(likert_rating), 2) AS average_rating,
                COUNT(*) AS respondent_count
             FROM course_exit_survey_responses
             WHERE offering_id = ?
             GROUP BY co_number
             ORDER BY co_number ASC"
        );
        $stmt->execute([$offeringId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getCoResponseCounts(int $offeringId): array
    {
        $stmt = $this->db->prepare(
            'SELECT co_number, COUNT(DISTINCT student_rollno) AS respondent_count
             FROM course_exit_survey_responses
             WHERE offering_id = ?
             GROUP BY co_number'
        );
        $stmt->execute([$offeringId]);
        $result = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0, 6 => 0];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $result[(int)$row['co_number']] = (int)$row['respondent_count'];
        }
        return $result;
    }

    public function deleteByOfferingId(int $offeringId): void
    {
        $stmt = $this->db->prepare('DELETE FROM course_exit_survey_responses WHERE offering_id = ?');
        $stmt->execute([$offeringId]);
    }

    public function hasResponses(int $offeringId): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM course_exit_survey_responses WHERE offering_id = ?');
        $stmt->execute([$offeringId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    /**
     * Get pivoted responses: one row per student with CO1-CO6 Likert ratings.
     */
    public function getPivotResponses(int $offeringId): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                student_rollno,
                MAX(CASE WHEN co_number = 1 THEN likert_rating END) AS co1,
                MAX(CASE WHEN co_number = 2 THEN likert_rating END) AS co2,
                MAX(CASE WHEN co_number = 3 THEN likert_rating END) AS co3,
                MAX(CASE WHEN co_number = 4 THEN likert_rating END) AS co4,
                MAX(CASE WHEN co_number = 5 THEN likert_rating END) AS co5,
                MAX(CASE WHEN co_number = 6 THEN likert_rating END) AS co6
             FROM course_exit_survey_responses
             WHERE offering_id = ?
             GROUP BY student_rollno
             ORDER BY student_rollno ASC"
        );
        $stmt->execute([$offeringId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
