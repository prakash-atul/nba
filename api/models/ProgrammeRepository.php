<?php

/**
 * Programme Repository Class
 * Handles database operations for programmes.
 */
class ProgrammeRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    public function findById($programmeId)
    {
        $stmt = $this->db->prepare('SELECT * FROM programmes WHERE programme_id = ?');
        $stmt->execute([(int)$programmeId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Programme(
            (int)$row['programme_id'],
            (int)$row['department_id'],
            $row['programme_code'],
            $row['programme_name'],
            $row['degree_level'],
            (int)$row['duration_years'],
            $row['created_at'] ?? null
        );
    }

    public function findEnrichedPaginated(array $params): array
    {
        $sort = $params['sort'] ?? 'p.programme_id';
        $sortDir = strtoupper($params['sort_dir'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';
        $limit = max(1, (int)($params['limit'] ?? 20));
        $cursor = isset($params['cursor']) ? (int)$params['cursor'] : null;

        $where = [];
        $bindings = [];

        if (!empty($params['search'])) {
            $where[] = '(p.programme_code LIKE ? OR p.programme_name LIKE ? OR d.department_code LIKE ? OR d.department_name LIKE ?)';
            $like = '%' . $params['search'] . '%';
            $bindings[] = $like;
            $bindings[] = $like;
            $bindings[] = $like;
            $bindings[] = $like;
        }

        if (isset($params['department_id']) && $params['department_id'] !== '') {
            $where[] = 'p.department_id = ?';
            $bindings[] = (int)$params['department_id'];
        }

        if (isset($params['school_id']) && $params['school_id'] !== '') {
            $where[] = 'd.school_id = ?';
            $bindings[] = (int)$params['school_id'];
        }

        if (isset($params['degree_level']) && $params['degree_level'] !== '') {
            $where[] = 'p.degree_level = ?';
            $bindings[] = $params['degree_level'];
        }

        if ($cursor !== null) {
            $where[] = $sortDir === 'DESC' ? 'p.programme_id < ?' : 'p.programme_id > ?';
            $bindings[] = $cursor;
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

        $sql = "
            SELECT
                p.programme_id,
                p.department_id,
                p.programme_code,
                p.programme_name,
                p.degree_level,
                p.duration_years,
                p.created_at,
                d.department_name,
                d.department_code,
                d.school_id,
                s.school_name,
                s.school_code,
                (SELECT COUNT(*) FROM students st WHERE st.programme_id = p.programme_id) AS student_count,
                (SELECT COUNT(*) FROM programme_courses pc WHERE pc.programme_id = p.programme_id) AS course_count
            FROM programmes p
            JOIN departments d ON p.department_id = d.department_id
            LEFT JOIN schools s ON d.school_id = s.school_id
            {$whereSql}
            ORDER BY {$sort} {$sortDir}
            LIMIT {$limit}
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bindings);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function ($row) {
            return [
                'programme_id' => (int)$row['programme_id'],
                'department_id' => (int)$row['department_id'],
                'programme_code' => $row['programme_code'],
                'programme_name' => $row['programme_name'],
                'degree_level' => $row['degree_level'],
                'duration_years' => (int)$row['duration_years'],
                'created_at' => $row['created_at'],
                'department_name' => $row['department_name'],
                'department_code' => $row['department_code'],
                'school_id' => $row['school_id'] !== null ? (int)$row['school_id'] : null,
                'school_name' => $row['school_name'],
                'school_code' => $row['school_code'],
                'student_count' => (int)$row['student_count'],
                'course_count' => (int)$row['course_count'],
            ];
        }, $rows);
    }

    public function countEnrichedPaginated(array $params): int
    {
        $where = [];
        $bindings = [];

        if (!empty($params['search'])) {
            $where[] = '(p.programme_code LIKE ? OR p.programme_name LIKE ? OR d.department_code LIKE ? OR d.department_name LIKE ?)';
            $like = '%' . $params['search'] . '%';
            $bindings[] = $like;
            $bindings[] = $like;
            $bindings[] = $like;
            $bindings[] = $like;
        }

        if (isset($params['department_id']) && $params['department_id'] !== '') {
            $where[] = 'p.department_id = ?';
            $bindings[] = (int)$params['department_id'];
        }

        if (isset($params['school_id']) && $params['school_id'] !== '') {
            $where[] = 'd.school_id = ?';
            $bindings[] = (int)$params['school_id'];
        }

        if (isset($params['degree_level']) && $params['degree_level'] !== '') {
            $where[] = 'p.degree_level = ?';
            $bindings[] = $params['degree_level'];
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

        $stmt = $this->db->prepare("SELECT COUNT(*) FROM programmes p JOIN departments d ON p.department_id = d.department_id {$whereSql}");
        $stmt->execute($bindings);
        return (int)$stmt->fetchColumn();
    }

    public function save(Programme $programme): bool
    {
        if ($programme->getProgrammeId()) {
            $stmt = $this->db->prepare('UPDATE programmes SET department_id = ?, programme_code = ?, programme_name = ?, degree_level = ?, duration_years = ? WHERE programme_id = ?');
            return $stmt->execute([
                $programme->getDepartmentId(),
                $programme->getProgrammeCode(),
                $programme->getProgrammeName(),
                $programme->getDegreeLevel(),
                $programme->getDurationYears(),
                $programme->getProgrammeId(),
            ]);
        }

        $stmt = $this->db->prepare('INSERT INTO programmes (department_id, programme_code, programme_name, degree_level, duration_years) VALUES (?, ?, ?, ?, ?)');
        $ok = $stmt->execute([
            $programme->getDepartmentId(),
            $programme->getProgrammeCode(),
            $programme->getProgrammeName(),
            $programme->getDegreeLevel(),
            $programme->getDurationYears(),
        ]);

        if ($ok) {
            $programme->setProgrammeId($this->db->lastInsertId());
        }

        return $ok;
    }

    public function delete($programmeId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM programmes WHERE programme_id = ?');
        return $stmt->execute([(int)$programmeId]);
    }

    public function codeExists(string $programmeCode, ?int $excludeProgrammeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM programmes WHERE programme_code = ?';
        $params = [strtoupper(trim($programmeCode))];

        if ($excludeProgrammeId !== null) {
            $sql .= ' AND programme_id != ?';
            $params[] = $excludeProgrammeId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function nameExists(string $programmeName, ?int $excludeProgrammeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM programmes WHERE programme_name = ?';
        $params = [trim($programmeName)];

        if ($excludeProgrammeId !== null) {
            $sql .= ' AND programme_id != ?';
            $params[] = $excludeProgrammeId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function countStudents($programmeId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM students WHERE programme_id = ?');
        $stmt->execute([(int)$programmeId]);
        return (int)$stmt->fetchColumn();
    }
}
