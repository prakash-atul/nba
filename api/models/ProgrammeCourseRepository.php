<?php

/**
 * ProgrammeCourse Repository Class
 * Handles database operations for programme_courses (many-to-many) table.
 */
class ProgrammeCourseRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Get all courses assigned to a programme with details.
     */
    public function findByProgrammeId(int $programmeId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                pc.id,
                pc.programme_id,
                pc.course_id,
                c.course_code,
                c.course_name,
                c.credit,
                pc.created_at
            FROM programme_courses pc
            JOIN courses c ON pc.course_id = c.course_id
            WHERE pc.programme_id = ?
            ORDER BY c.course_code ASC
        ");
        $stmt->execute([$programmeId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function ($row) {
            return [
                'id' => (int)$row['id'],
                'programme_id' => (int)$row['programme_id'],
                'course_id' => (int)$row['course_id'],
                'course_code' => $row['course_code'],
                'course_name' => $row['course_name'],
                'credits' => $row['credit'] !== null ? (float)$row['credit'] : null,
                'created_at' => $row['created_at'],
            ];
        }, $rows);
    }

    /**
     * Get courses NOT yet assigned to a programme.
     */
    public function findAvailableCourses(int $programmeId): array
    {
        $stmt = $this->db->prepare("
            SELECT c.course_id, c.course_code, c.course_name, c.credit
            FROM courses c
            WHERE c.course_id NOT IN (
                SELECT pc.course_id FROM programme_courses pc WHERE pc.programme_id = ?
            )
            ORDER BY c.course_code ASC
        ");
        $stmt->execute([$programmeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Assign a course to a programme.
     */
    public function addCourse(int $programmeId, int $courseId): bool
    {
        $stmt = $this->db->prepare("
            INSERT IGNORE INTO programme_courses (programme_id, course_id) VALUES (?, ?)
        ");
        $stmt->execute([$programmeId, $courseId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Remove a course from a programme.
     */
    public function removeCourse(int $programmeId, int $courseId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM programme_courses WHERE programme_id = ? AND course_id = ?
        ");
        $stmt->execute([$programmeId, $courseId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Get all programme IDs that a course is assigned to.
     */
    public function findByCourseId(int $courseId): array
    {
        $stmt = $this->db->prepare("
            SELECT programme_id FROM programme_courses WHERE course_id = ?
        ");
        $stmt->execute([$courseId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Check if a course is already assigned to a programme.
     */
    public function exists(int $programmeId, int $courseId): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM programme_courses WHERE programme_id = ? AND course_id = ?
        ");
        $stmt->execute([$programmeId, $courseId]);
        return (int)$stmt->fetchColumn() > 0;
    }
}
