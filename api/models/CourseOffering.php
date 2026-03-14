<?php

/**
 * CourseOffering Model
 * Represents a specific offering of a course in a particular year and semester
 * with faculty assignments, enrollments, and session-specific configuration
 */
class CourseOffering
{
    private $offeringId;
    private $courseId;
    private $year;
    private $semester;
    private $coThreshold;
    private $passingThreshold;
    private $syllabusPdf;
    private $isActive;
    private $createdAt;
    private $updatedAt;

    public function __construct(
        $courseId,
        $year,
        $semester,
        $coThreshold = 40.00,
        $passingThreshold = 60.00,
        $syllabusPdf = null,
        $isActive = 1,
        $createdAt = null,
        $updatedAt = null,
        $offeringId = null
    ) {
        $this->offeringId = $offeringId;
        $this->courseId = $courseId;
        $this->year = $year;
        $this->semester = $semester;
        $this->coThreshold = $coThreshold;
        $this->passingThreshold = $passingThreshold;
        $this->syllabusPdf = $syllabusPdf;
        $this->isActive = $isActive;
        $this->createdAt = $createdAt;
        $this->updatedAt = $updatedAt;
    }

    // Getters
    public function getOfferingId() { return $this->offeringId; }
    public function getCourseId() { return $this->courseId; }
    public function getYear() { return $this->year; }
    public function getSemester() { return $this->semester; }
    public function getCoThreshold() { return $this->coThreshold; }
    public function getPassingThreshold() { return $this->passingThreshold; }
    public function getSyllabusPdf() { return $this->syllabusPdf; }
    public function getIsActive() { return $this->isActive; }
    public function getCreatedAt() { return $this->createdAt; }
    public function getUpdatedAt() { return $this->updatedAt; }

    // Setters
    public function setOfferingId($offeringId)
    {
        $this->offeringId = $offeringId;
    }

    public function setCourseId($courseId)
    {
        if (!is_numeric($courseId)) {
            throw new InvalidArgumentException("Course ID must be numeric");
        }
        $this->courseId = $courseId;
    }

    public function setYear($year)
    {
        if (!is_numeric($year) || $year < 1000 || $year > 9999) {
            throw new InvalidArgumentException("Year must be a valid 4-digit year");
        }
        $this->year = $year;
    }

    public function setSemester($semester)
    {
        $allowed = ['Spring', 'Autumn'];
        if (!in_array($semester, $allowed, true)) {
            throw new InvalidArgumentException("Semester must be 'Spring' or 'Autumn'");
        }
        $this->semester = $semester;
    }

    public function setCoThreshold($coThreshold)
    {
        if (!is_numeric($coThreshold) || $coThreshold < 0 || $coThreshold > 100) {
            throw new InvalidArgumentException("CO threshold must be between 0 and 100");
        }
        $this->coThreshold = $coThreshold;
    }

    public function setPassingThreshold($passingThreshold)
    {
        if (!is_numeric($passingThreshold) || $passingThreshold < 0 || $passingThreshold > 100) {
            throw new InvalidArgumentException("Passing threshold must be between 0 and 100");
        }
        $this->passingThreshold = $passingThreshold;
    }

    public function setSyllabusPdf($syllabusPdf)
    {
        $this->syllabusPdf = $syllabusPdf;
    }

    public function setIsActive($isActive)
    {
        $this->isActive = $isActive;
    }

    /**
     * Validate offering data
     */
    public function validate()
    {
        $errors = [];

        if (empty($this->courseId)) {
            $errors[] = "Course ID is required";
        }

        if (empty($this->year)) {
            $errors[] = "Year is required";
        }

        if (empty($this->semester)) {
            $errors[] = "Semester is required";
        }

        return $errors;
    }

    /**
     * Convert to array
     */
    public function toArray()
    {
        return [
            'offering_id' => $this->offeringId,
            'course_id' => $this->courseId,
            'year' => $this->year,
            'semester' => $this->semester,
            'co_threshold' => $this->coThreshold,
            'passing_threshold' => $this->passingThreshold,
            'syllabus_pdf' => $this->syllabusPdf,
            'is_active' => $this->isActive,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt
        ];
    }
}
