<?php

/**
 * Test Model
 * Represents a test/assessment entity
 */
class Test
{
    private $test_id;
    private $offeringId;
    private $test_name;
    private $fullMarks;
    private $passMarks;
    private $questionPaperPdf;
    private $test_type;
    private $test_date;
    private $max_marks;
    private $weightage;
    private $courseCode; // For filename generation
    private $year; // For information
    private $semester; // For information

    public function __construct(
        $test_id, 
        $offeringId, 
        $test_name, 
        $fullMarks, 
        $passMarks, 
        $questionPaperPdf = null, 
        $test_type = null,
        $test_date = null,
        $weightage = null,
        $courseCode = null, 
        $year = null, 
        $semester = null
    ) {
        $this->test_id = $test_id;
        $this->setOfferingId($offeringId);
        $this->setTestName($test_name);
        $this->setFullMarks($fullMarks);
        $this->setPassMarks($passMarks);
        $this->questionPaperPdf = $questionPaperPdf;
        $this->test_type = $test_type;
        $this->test_date = $test_date;
        $this->weightage = $weightage;
        $this->courseCode = $courseCode;
        $this->year = $year;
        $this->semester = $semester;
    }

    // Getters
    public function getTestId()
    {
        return $this->test_id;
    }
    public function getOfferingId()
    {
        return $this->offeringId;
    }
    public function getCourseId()
    {
        // Backward compatibility
        return $this->offeringId;
    }
    public function getTestName()
    {
        return $this->test_name;
    }
    public function getFullMarks()
    {
        return $this->fullMarks;
    }
    public function getPassMarks()
    {
        return $this->passMarks;
    }
    public function getQuestionPaperPdf()
    {
        return $this->questionPaperPdf;
    }
    public function getTestType()
    {
        return $this->test_type;
    }
    public function getTestDate()
    {
        return $this->test_date;
    }
    public function getWeightage()
    {
        return $this->weightage;
    }

    // Setters with validation
    public function setTestId($test_id)
    {
        $this->test_id = $test_id;
    }

    public function setOfferingId($offeringId)
    {
        if (!is_numeric($offeringId)) {
            throw new Exception("Offering ID must be a number");
        }
        $this->offeringId = (int)$offeringId;
    }

    public function setCourseId($courseId)
    {
        // For compatibility
        $this->setOfferingId($courseId);
    }

    public function setTestName($test_name)
    {
        if (empty($test_name) || strlen($test_name) > 255) {
            throw new Exception("Test name must be between 1 and 255 characters");
        }
        $this->test_name = $test_name;
    }

    public function setFullMarks($fullMarks)
    {
        if (!is_numeric($fullMarks) || $fullMarks <= 0) {
            throw new Exception("Full marks must be greater than 0");
        }
        $this->fullMarks = (int)$fullMarks;
    }

    public function setPassMarks($passMarks)
    {
        if (!is_numeric($passMarks) || $passMarks < 0) {
            throw new Exception("Pass marks must be a non-negative number");
        }
        $this->passMarks = (int)$passMarks;
    }

    public function setQuestionPaperPdf($questionPaperPdf)
    {
        $this->questionPaperPdf = $questionPaperPdf;
    }

    public function setTestType($test_type)
    {
        $this->test_type = $test_type;
    }

    public function setTestDate($test_date)
    {
        $this->test_date = $test_date;
    }

    public function setMaxMarks($max_marks)
    {
        $this->max_marks = $max_marks;
    }

    public function setWeightage($weightage)
    {
        $this->weightage = $weightage;
    }

    public function setCourseCode($courseCode)
    {
        $this->courseCode = $courseCode;
    }

    public function setYear($year)
    {
        $this->year = $year;
    }

    public function setSemester($semester)
    {
        $this->semester = $semester;
    }

    /**
     * Convert to array
     */
    public function toArray()
    {
        // Generate filename dynamically: courseCode_year_semester_testName.pdf
        $generatedFilename = null;
        if (!is_null($this->questionPaperPdf) && $this->courseCode && $this->year && $this->semester) {
            // Sanitize test name for filename (remove special chars, spaces to underscores)
            $sanitizedTestName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $this->test_name);
            $sanitizedTestName = preg_replace('/_+/', '_', $sanitizedTestName); // Remove multiple underscores
            $generatedFilename = $this->courseCode . '_' . $this->year . '_' . $this->semester . '_' . $sanitizedTestName . '.pdf';
        }

        return [
            'id' => $this->test_id,
            'course_id' => $this->offeringId,
            'name' => $this->test_name,
            'full_marks' => $this->fullMarks,
            'pass_marks' => $this->passMarks,
            'test_type' => $this->test_type,
            'test_date' => $this->test_date,
            'max_marks' => $this->max_marks,
            'weightage' => $this->weightage,
            'question_paper_filename' => $generatedFilename,
            'has_question_paper_pdf' => !is_null($this->questionPaperPdf)
        ];
    }
}
