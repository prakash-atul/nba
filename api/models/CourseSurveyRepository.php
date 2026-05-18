<?php

class CourseSurveyRepository
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getDb(): PDO
    {
        return $this->db;
    }

    public function getSurveyByOfferingId(int $offeringId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM course_surveys WHERE offering_id = ?');
        $stmt->execute([$offeringId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function createSurvey(int $offeringId, string $title = 'Course Exit Survey'): int
    {
        $stmt = $this->db->prepare('INSERT INTO course_surveys (offering_id, title) VALUES (?, ?)');
        $stmt->execute([$offeringId, $title]);
        return (int)$this->db->lastInsertId();
    }

    public function getQuestions(int $surveyId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM course_survey_questions WHERE survey_id = ? ORDER BY question_number');
        $stmt->execute([$surveyId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function saveQuestions(int $surveyId, array $questions): void
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare('DELETE FROM course_survey_questions WHERE survey_id = ?');
            $stmt->execute([$surveyId]);

            if (!empty($questions)) {
                $stmt = $this->db->prepare(
                    'INSERT INTO course_survey_questions (survey_id, question_number, question_text, co_number, mapping_weight) 
                     VALUES (?, ?, ?, ?, ?)'
                );
                foreach ($questions as $q) {
                    $stmt->execute([
                        $surveyId,
                        $q['question_number'],
                        $q['question_text'],
                        $q['co_number'],
                        $q['mapping_weight']
                    ]);
                }
            }

            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function saveResponses(int $surveyId, array $responses): int
    {
        try {
            $this->db->beginTransaction();

            // responses: array of ['student_rollno' => x, 'question_id' => y, 'likert_rating' => z]
            $stmt = $this->db->prepare(
                'INSERT INTO course_survey_responses (survey_id, student_rollno, question_id, likert_rating) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE likert_rating = VALUES(likert_rating)'
            );

            $count = 0;
            foreach ($responses as $row) {
                $stmt->execute([
                    $surveyId,
                    $row['student_rollno'],
                    $row['question_id'],
                    $row['likert_rating']
                ]);
                $count++;
            }

            $this->db->commit();
            return $count;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function hasResponses(int $offeringId): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) 
             FROM course_survey_responses r
             JOIN course_surveys s ON r.survey_id = s.survey_id
             WHERE s.offering_id = ?'
        );
        $stmt->execute([$offeringId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function getCoAverages(int $offeringId): array
    {
        $stmt = $this->db->prepare(
            'SELECT 
                q.co_number, 
                SUM(r.likert_rating * q.mapping_weight) / SUM(q.mapping_weight) as average_rating,
                COUNT(DISTINCT r.student_rollno) as respondent_count
             FROM course_survey_responses r
             JOIN course_survey_questions q ON r.question_id = q.question_id
             JOIN course_surveys s ON r.survey_id = s.survey_id
             WHERE s.offering_id = ?
             GROUP BY q.co_number'
        );
        $stmt->execute([$offeringId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getQuestionAverages(int $surveyId): array
    {
        $stmt = $this->db->prepare(
            'SELECT 
                q.question_id,
                q.question_number,
                q.question_text,
                q.co_number,
                q.mapping_weight,
                AVG(r.likert_rating) as average_rating,
                STDDEV(r.likert_rating) as rating_variance,
                COUNT(r.id) as respondent_count
             FROM course_survey_questions q
             LEFT JOIN course_survey_responses r ON q.question_id = r.question_id
             WHERE q.survey_id = ?
             GROUP BY q.question_id
             ORDER BY q.question_number'
        );
        $stmt->execute([$surveyId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPivotResponses(int $offeringId): array
    {
        // This simulates the old pivot response where we need co1...co6 averages per student.
        // It's useful for raw data viewing.
        $stmt = $this->db->prepare(
            'SELECT 
                r.student_rollno,
                q.co_number,
                SUM(r.likert_rating * q.mapping_weight) / SUM(q.mapping_weight) as co_rating
             FROM course_survey_responses r
             JOIN course_survey_questions q ON r.question_id = q.question_id
             JOIN course_surveys s ON r.survey_id = s.survey_id
             WHERE s.offering_id = ?
             GROUP BY r.student_rollno, q.co_number'
        );
        $stmt->execute([$offeringId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $pivot = [];
        foreach ($rows as $row) {
            $rollno = $row['student_rollno'];
            if (!isset($pivot[$rollno])) {
                $pivot[$rollno] = ['student_rollno' => $rollno];
            }
            $pivot[$rollno]['co' . $row['co_number']] = round((float)$row['co_rating'], 2);
        }

        return array_values($pivot);
    }

    public function deleteSurvey(int $surveyId): void
    {
        $stmt = $this->db->prepare('DELETE FROM course_surveys WHERE survey_id = ?');
        $stmt->execute([$surveyId]);
    }

    public function getResponses(int $surveyId): array
    {
        $stmt = $this->db->prepare(
            'SELECT r.*, q.question_number, q.question_text, q.co_number
             FROM course_survey_responses r
             JOIN course_survey_questions q ON r.question_id = q.question_id
             WHERE r.survey_id = ?
             ORDER BY r.student_rollno, q.question_number'
        );
        $stmt->execute([$surveyId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function clearResponses(int $surveyId): void
    {
        $stmt = $this->db->prepare('DELETE FROM course_survey_responses WHERE survey_id = ?');
        $stmt->execute([$surveyId]);
    }
}
