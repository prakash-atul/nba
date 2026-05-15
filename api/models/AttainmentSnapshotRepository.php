<?php

class AttainmentSnapshotRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    public function clearByOfferingId($offeringId): void
    {
        $stmt = $this->db->prepare('DELETE FROM offering_co_attainment WHERE offering_id = ?');
        $stmt->execute([(int)$offeringId]);

        $stmt = $this->db->prepare('DELETE FROM offering_po_attainment WHERE offering_id = ?');
        $stmt->execute([(int)$offeringId]);
    }

    public function saveCoAttainments($offeringId, array $rows): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO offering_co_attainment (offering_id, co_number, attainment_percentage, attainment_level)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                attainment_percentage = VALUES(attainment_percentage),
                attainment_level = VALUES(attainment_level),
                calculated_at = CURRENT_TIMESTAMP'
        );

        foreach ($rows as $row) {
            $stmt->execute([
                (int)$offeringId,
                (int)$row['co_number'],
                (float)$row['attainment_percentage'],
                (float)$row['attainment_level'],
            ]);
        }
    }

    public function savePoAttainments($offeringId, array $rows): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO offering_po_attainment (offering_id, po_name, attainment_value)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                attainment_value = VALUES(attainment_value),
                calculated_at = CURRENT_TIMESTAMP'
        );

        foreach ($rows as $row) {
            $stmt->execute([
                (int)$offeringId,
                $row['po_name'],
                (float)$row['attainment_value'],
            ]);
        }
    }

    public function getCoAttainmentsByOfferingId($offeringId): array
    {
        $stmt = $this->db->prepare(
            "SELECT offering_id, co_number, CONCAT('CO', co_number) AS co_name, attainment_percentage, attainment_level, calculated_at
             FROM offering_co_attainment
             WHERE offering_id = ?
             ORDER BY co_number ASC"
        );
        $stmt->execute([(int)$offeringId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPoAttainmentsByOfferingId($offeringId): array
    {
        $stmt = $this->db->prepare(
            'SELECT offering_id, po_name, attainment_value, calculated_at
             FROM offering_po_attainment
             WHERE offering_id = ?
             ORDER BY po_name ASC'
        );
        $stmt->execute([(int)$offeringId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function hasSnapshots($offeringId): bool
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM offering_po_attainment WHERE offering_id = ?');
        $stmt->execute([(int)$offeringId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function getProgrammePoAttainment($programmeId, ?int $batchYear = null): array
    {
        $params = [(int)$programmeId];
        $batchSql = '';

        if ($batchYear !== null) {
            $batchSql = ' AND s.batch_year = ?';
            $params[] = $batchYear;
        }

        $stmt = $this->db->prepare(
            "SELECT
                opa.po_name,
                ROUND(AVG(opa.attainment_value), 2) AS attainment_value,
                COUNT(DISTINCT opa.offering_id) AS offering_count
             FROM offering_po_attainment opa
             WHERE EXISTS (
                 SELECT 1
                 FROM enrollments e
                 JOIN students s ON s.roll_no = e.student_rollno
                 WHERE e.offering_id = opa.offering_id
                   AND e.enrollment_status != 'Dropped'
                   AND s.programme_id = ?{$batchSql}
             )
             GROUP BY opa.po_name
             ORDER BY opa.po_name ASC"
        );
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
