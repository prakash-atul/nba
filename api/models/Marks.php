<?php

/**
 * Marks Model
 * Represents CO-aggregated marks for a student in a test
 */
class Marks
{
    private $id;
    private $studentRollNo;
    private $testId;
    private $CO1;
    private $CO2;
    private $CO3;
    private $CO4;
    private $CO5;
    private $CO6;

    public function __construct($studentRollNo, $testId, $CO1 = 0, $CO2 = 0, $CO3 = 0, $CO4 = 0, $CO5 = 0, $CO6 = 0, $id = null)
    {
        $this->id = $id;
        $this->studentRollNo = $studentRollNo;
        $this->testId = $testId;
        $this->CO1 = $CO1;
        $this->CO2 = $CO2;
        $this->CO3 = $CO3;
        $this->CO4 = $CO4;
        $this->CO5 = $CO5;
        $this->CO6 = $CO6;
    }

    // Getters
    public function getId()
    {
        return $this->id;
    }

    public function getStudentRollNo()
    {
        return $this->studentRollNo;
    }

    public function getTestId()
    {
        return $this->testId;
    }

    public function getCO1()
    {
        return $this->CO1;
    }

    public function getCO2()
    {
        return $this->CO2;
    }

    public function getCO3()
    {
        return $this->CO3;
    }

    public function getCO4()
    {
        return $this->CO4;
    }

    public function getCO5()
    {
        return $this->CO5;
    }

    public function getCO6()
    {
        return $this->CO6;
    }

    // Setters
    public function setId($id)
    {
        $this->id = $id;
    }

    public function setCO1($CO1)
    {
        $this->CO1 = $CO1;
    }

    public function setCO2($CO2)
    {
        $this->CO2 = $CO2;
    }

    public function setCO3($CO3)
    {
        $this->CO3 = $CO3;
    }

    public function setCO4($CO4)
    {
        $this->CO4 = $CO4;
    }

    public function setCO5($CO5)
    {
        $this->CO5 = $CO5;
    }

    public function setCO6($CO6)
    {
        $this->CO6 = $CO6;
    }

    /**
     * Get CO value by number
     */
    public function getCOValue($coNumber)
    {
        $property = 'CO' . $coNumber;
        return $this->$property;
    }

    /**
     * Set CO value by number
     */
    public function setCOValue($coNumber, $value)
    {
        $property = 'CO' . $coNumber;
        $this->$property = $value;
    }

    /**
     * Add to CO value
     */
    public function addToCO($coNumber, $value)
    {
        $property = 'CO' . $coNumber;
        $this->$property += $value;
    }

    /**
     * Convert to array
     */
    public function toArray()
    {
        return [
            'id' => $this->id,
            'student_roll_no' => $this->studentRollNo,
            'test_id' => $this->testId,
            'CO1' => $this->CO1,
            'CO2' => $this->CO2,
            'CO3' => $this->CO3,
            'CO4' => $this->CO4,
            'CO5' => $this->CO5,
            'CO6' => $this->CO6
        ];
    }
}
