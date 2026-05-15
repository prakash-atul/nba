<?php

class CoPoRepository
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Get all mappings for an offering
     */
    public function getMatrix($offeringId)
    {
        $query = "SELECT CONCAT('CO', co_number) AS co_name, po_name, value FROM co_po_mapping WHERE offering_id = :offering_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':offering_id', $offeringId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Save matrix (bulk insert/update)
     */
    public function saveMatrix($offeringId, $matrixData)
    {
        // MatrixData is expected to be an array of ['co' => 'CO1', 'po' => 'PO1', 'value' => 2]

        $query = "INSERT INTO co_po_mapping (offering_id, co_number, po_name, value) 
                  VALUES (:offering_id, :co_number, :po_name, :value)
                  ON DUPLICATE KEY UPDATE value = :value_update";

        $stmt = $this->db->prepare($query);

        try {
            $this->db->beginTransaction();

            foreach ($matrixData as $row) {
                // Ensure value is integer
                $val = (int)$row['value'];
                // Convert 'CO1' → 1, 'CO2' → 2, etc.
                $coNumber = intval(substr($row['co'], 2));

                $stmt->bindValue(':offering_id', $offeringId);
                $stmt->bindValue(':co_number', $coNumber);
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
