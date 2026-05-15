<?php

require_once __DIR__ . '/AttainmentScale.php';

class AttainmentScaleRepository
{
    private PDO $connection;

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    /**
     * Get all attainment scale entries for an offering
     */
    public function getByOfferingId(int $offeringId): array
    {
        $stmt = $this->connection->prepare(
            "SELECT * FROM attainment_scale WHERE offering_id = ? ORDER BY level DESC"
        );
        $stmt->execute([$offeringId]);
        
        $scales = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $scales[] = new AttainmentScale(
                (int)$row['id'],
                (int)$row['offering_id'],
                (int)$row['level'],
                (float)$row['min_percentage']
            );
        }
        
        return $scales;
    }

    /**
     * Save attainment scale for an offering (replaces all existing entries)
     */
    public function saveBulk(int $offeringId, array $scales): bool
    {
        try {
            $this->connection->beginTransaction();

            // Delete existing scales for this offering
            $stmt = $this->connection->prepare(
                "DELETE FROM attainment_scale WHERE offering_id = ?"
            );
            $stmt->execute([$offeringId]);

            // Insert new scales
            $stmt = $this->connection->prepare(
                "INSERT INTO attainment_scale (offering_id, level, min_percentage) VALUES (?, ?, ?)"
            );

            foreach ($scales as $scale) {
                $stmt->execute([
                    $offeringId,
                    $scale['level'],
                    $scale['min_percentage']
                ]);
            }

            $this->connection->commit();
            return true;
        } catch (Exception $e) {
            $this->connection->rollBack();
            throw $e;
        }
    }

    /**
     * Delete all attainment scales for an offering
     */
    public function deleteByOfferingId(int $offeringId): bool
    {
        $stmt = $this->connection->prepare(
            "DELETE FROM attainment_scale WHERE offering_id = ?"
        );
        return $stmt->execute([$offeringId]);
    }

    /**
     * Check if attainment scale exists for an offering
     */
    public function existsForOffering(int $offeringId): bool
    {
        $stmt = $this->connection->prepare(
            "SELECT COUNT(*) FROM attainment_scale WHERE offering_id = ?"
        );
        $stmt->execute([$offeringId]);
        return $stmt->fetchColumn() > 0;
    }
}
