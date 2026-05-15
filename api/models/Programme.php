<?php

/**
 * Programme Model Class
 * Handles programme entity data and validation.
 */
class Programme
{
    private $programmeId;
    private $departmentId;
    private $programmeCode;
    private $programmeName;
    private $degreeLevel;
    private $durationYears;
    private $createdAt;

    public function __construct(
        $programmeId = null,
        $departmentId = null,
        $programmeCode = null,
        $programmeName = null,
        $degreeLevel = 'UG',
        $durationYears = 4,
        $createdAt = null
    ) {
        $this->programmeId = $programmeId;
        $this->departmentId = $departmentId;
        $this->programmeCode = $programmeCode;
        $this->programmeName = $programmeName;
        $this->degreeLevel = $degreeLevel;
        $this->durationYears = $durationYears;
        $this->createdAt = $createdAt;
    }

    public function getProgrammeId() { return $this->programmeId; }
    public function getDepartmentId() { return $this->departmentId; }
    public function getProgrammeCode() { return $this->programmeCode; }
    public function getProgrammeName() { return $this->programmeName; }
    public function getDegreeLevel() { return $this->degreeLevel; }
    public function getDurationYears() { return $this->durationYears; }
    public function getCreatedAt() { return $this->createdAt; }

    public function setProgrammeId($programmeId)
    {
        if (!is_numeric($programmeId) || (int)$programmeId <= 0) {
            throw new InvalidArgumentException('Programme ID must be a positive number');
        }
        $this->programmeId = (int)$programmeId;
    }

    public function setDepartmentId($departmentId)
    {
        if (!is_numeric($departmentId) || (int)$departmentId <= 0) {
            throw new InvalidArgumentException('Department ID must be a positive number');
        }
        $this->departmentId = (int)$departmentId;
    }

    public function setProgrammeCode($programmeCode)
    {
        if (empty($programmeCode) || strlen(trim($programmeCode)) < 2) {
            throw new InvalidArgumentException('Programme code must be at least 2 characters long');
        }
        $this->programmeCode = strtoupper(trim($programmeCode));
    }

    public function setProgrammeName($programmeName)
    {
        if (empty($programmeName) || strlen(trim($programmeName)) < 2) {
            throw new InvalidArgumentException('Programme name must be at least 2 characters long');
        }
        $this->programmeName = trim($programmeName);
    }

    public function setDegreeLevel($degreeLevel)
    {
        $allowed = ['UG', 'PG', 'Diploma', 'PhD'];
        if (!in_array($degreeLevel, $allowed, true)) {
            throw new InvalidArgumentException('Degree level must be one of: UG, PG, Diploma, PhD');
        }
        $this->degreeLevel = $degreeLevel;
    }

    public function setDurationYears($durationYears)
    {
        if (!is_numeric($durationYears) || (int)$durationYears <= 0) {
            throw new InvalidArgumentException('Duration years must be a positive number');
        }
        $this->durationYears = (int)$durationYears;
    }

    public function toArray()
    {
        return [
            'programme_id' => $this->programmeId,
            'department_id' => $this->departmentId,
            'programme_code' => $this->programmeCode,
            'programme_name' => $this->programmeName,
            'degree_level' => $this->degreeLevel,
            'duration_years' => $this->durationYears,
            'created_at' => $this->createdAt,
        ];
    }
}
