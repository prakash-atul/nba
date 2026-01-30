<?php

class CoPoRepository
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Get all mappings for a course
     */
    public function getMatrix($courseId)
    {
        $query = "SELECT co_name, po_name, value FROM co_po_mapping WHERE course_id = :course_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':course_id', $courseId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Save matrix (bulk insert/update)
     */
    public function saveMatrix($courseId, $matrixData)
    {
        // MatrixData is expected to be an array of ['co' => 'CO1', 'po' => 'PO1', 'value' => 2]

        $query = "INSERT INTO co_po_mapping (course_id, co_name, po_name, value) 
                  VALUES (:course_id, :co_name, :po_name, :value)
                  ON DUPLICATE KEY UPDATE value = :value_update";

        $stmt = $this->db->prepare($query);

        try {
            $this->db->beginTransaction();

            foreach ($matrixData as $row) {
                // Ensure value is integer
                $val = (int)$row['value'];

                $stmt->bindValue(':course_id', $courseId);
                $stmt->bindValue(':co_name', $row['co']);
                $stmt->bindValue(':po_name', $row['po']);
                $stmt->bindValue(':value', $val);
                $stmt->bindValue(':value_update', $val);
                $stmt->execute();
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
