<?php

class AttainmentScale
{
    public int $id;
    public int $offering_id;
    public int $level;
    public float $min_percentage;

    public function __construct(
        int $id,
        int $offering_id,
        int $level,
        float $min_percentage
    ) {
        $this->id = $id;
        $this->offering_id = $offering_id;
        $this->level = $level;
        $this->min_percentage = $min_percentage;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'offering_id' => $this->offering_id,
            'level' => $this->level,
            'min_percentage' => $this->min_percentage
        ];
    }
}
