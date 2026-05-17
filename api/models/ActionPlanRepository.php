<?php

class ActionPlanRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    public function findByProgramme(int $programmeId, ?int $batchYear = null): array
    {
        $sql = 'SELECT * FROM action_plans WHERE programme_id = ?';
        $params = [$programmeId];

        if ($batchYear !== null) {
            $sql .= ' AND batch_year = ?';
            $params[] = $batchYear;
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM action_plans WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO action_plans
                (programme_id, batch_year, po_name, gap_description, action_text, responsible_person, target_date, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            (int)$data['programme_id'],
            isset($data['batch_year']) ? (int)$data['batch_year'] : null,
            $data['po_name'] ?? null,
            $data['gap_description'],
            $data['action_text'],
            $data['responsible_person'] ?? null,
            $data['target_date'] ?? null,
            $data['status'] ?? 'Open',
            isset($data['created_by']) ? (int)$data['created_by'] : null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = [];

        $allowed = ['gap_description', 'action_text', 'responsible_person', 'target_date', 'status', 'po_name'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $params[] = $id;
        $stmt = $this->db->prepare(
            'UPDATE action_plans SET ' . implode(', ', $fields) . ' WHERE id = ?'
        );
        return $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM action_plans WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function setTargets(int $programmeId, int $batchYear, array $targets): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO programme_batch_attainments
                (programme_id, batch_year, po_name, target)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE target = VALUES(target)'
        );

        foreach ($targets as $poName => $targetVal) {
            $stmt->execute([
                $programmeId,
                $batchYear,
                $poName,
                (float)$targetVal,
            ]);
        }
    }

    public function getTargets(int $programmeId, int $batchYear): array
    {
        $stmt = $this->db->prepare(
            "SELECT po_name, target FROM programme_batch_attainments
             WHERE programme_id = ? AND batch_year = ? AND target > 0
             ORDER BY po_name ASC"
        );
        $stmt->execute([$programmeId, $batchYear]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $result = [];
        foreach ($rows as $r) {
            $result[$r['po_name']] = (float)$r['target'];
        }
        return $result;
    }
}
