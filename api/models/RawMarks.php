<?php

/**
 * RawMarks Model
 * Represents per-question marks for a student in a test
 */
class RawMarks
{
    private $id;
    // testId removed: it was a transitive dependency (question_id → questions.test_id)
    private $studentId;
    private $questionId;
    private $marks_obtained;

    public function __construct($studentId, $questionId, $marks_obtained, $id = null)
    {
        $this->id = $id;
        $this->studentId = $studentId;
        $this->questionId = $questionId;
        $this->marks_obtained = $marks_obtained;
    }

    // Getters
    public function getId()
    {
        return $this->id;
    }

    public function getStudentId()
    {
        return $this->studentId;
    }

    public function getQuestionId()
    {
        return $this->questionId;
    }

    public function getMarksObtained()
    {
        return $this->marks_obtained;
    }

    // Setters
    public function setId($id)
    {
        $this->id = $id;
    }

    public function setMarksObtained($marks_obtained)
    {
        $this->marks_obtained = $marks_obtained;
    }

    /**
     * Convert to array
     */
    public function toArray()
    {
        return [
            'id' => $this->id,
            'student_id' => $this->studentId,
            'question_id' => $this->questionId,
            'marks_obtained' => $this->marks_obtained
        ];
    }
}
