<?php

class StakeholderSurveyRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    public function saveResponses(int $programmeId, int $batchYear, string $stakeholderType, array $responses): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO stakeholder_survey_responses (programme_id, stakeholder_type, batch_year, po_name, likert_rating, respondent_identifier)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                 likert_rating = VALUES(likert_rating),
                 respondent_identifier = VALUES(respondent_identifier)'
        );

        $count = 0;
        foreach ($responses as $row) {
            $stmt->execute([
                $programmeId,
                $stakeholderType,
                $batchYear,
                $row['po_name'],
                (int)$row['likert_rating'],
                $row['respondent_identifier'] ?? null,
            ]);
            $count++;
        }

        return $count;
    }

    public function getByProgrammeBatch(int $programmeId, int $batchYear, ?string $stakeholderType = null): array
    {
        $sql = 'SELECT * FROM stakeholder_survey_responses WHERE programme_id = ? AND batch_year = ?';
        $params = [$programmeId, $batchYear];

        if ($stakeholderType !== null) {
            $sql .= ' AND stakeholder_type = ?';
            $params[] = $stakeholderType;
        }

        $sql .= ' ORDER BY po_name, stakeholder_type';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPoAverages(int $programmeId, int $batchYear, ?string $stakeholderType = null): array
    {
        $sql = "SELECT
                    po_name,
                    ROUND(AVG(likert_rating), 2) AS average_rating,
                    COUNT(*) AS respondent_count
                FROM stakeholder_survey_responses
                WHERE programme_id = ? AND batch_year = ?";
        $params = [$programmeId, $batchYear];

        if ($stakeholderType !== null) {
            $sql .= ' AND stakeholder_type = ?';
            $params[] = $stakeholderType;
        }

        $sql .= ' GROUP BY po_name ORDER BY po_name ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPoAveragesByType(int $programmeId, int $batchYear): array
    {
        $stmt = $this->db->prepare(
            "SELECT
                stakeholder_type,
                po_name,
                ROUND(AVG(likert_rating), 2) AS average_rating,
                COUNT(*) AS respondent_count
            FROM stakeholder_survey_responses
            WHERE programme_id = ? AND batch_year = ?
            GROUP BY stakeholder_type, po_name
            ORDER BY stakeholder_type, po_name ASC"
        );
        $stmt->execute([$programmeId, $batchYear]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteByProgrammeBatch(int $programmeId, int $batchYear, ?string $stakeholderType = null): void
    {
        $sql = 'DELETE FROM stakeholder_survey_responses WHERE programme_id = ? AND batch_year = ?';
        $params = [$programmeId, $batchYear];

        if ($stakeholderType !== null) {
            $sql .= ' AND stakeholder_type = ?';
            $params[] = $stakeholderType;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }

    public function getDistinctTypes(int $programmeId, int $batchYear): array
    {
        $stmt = $this->db->prepare(
            'SELECT DISTINCT stakeholder_type FROM stakeholder_survey_responses WHERE programme_id = ? AND batch_year = ? ORDER BY stakeholder_type'
        );
        $stmt->execute([$programmeId, $batchYear]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
}
