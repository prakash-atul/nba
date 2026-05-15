<?php

/**
 * Student Model
 * Represents a student entity
 */
class Student
{
    private $roll_no;
    private $student_name;
    private $programme_id;
    private $department_id;
    private $batch_year;
    private $student_status;
    private $email;
    private $phone;

    public function __construct(
        $roll_no, 
        $student_name, 
        $programme_id,
        $batch_year = null,
        $student_status = 'Active',
        $email = null,
        $phone = null,
        $department_id = null
    ) {
        $this->roll_no = $roll_no;
        $this->student_name = $student_name;
        $this->programme_id = $programme_id;
        $this->department_id = $department_id;
        $this->batch_year = $batch_year;
        $this->student_status = $student_status;
        $this->email = $email;
        $this->phone = $phone;
    }

    // Getters
    public function getRollNo()
    {
        return $this->roll_no;
    }

    public function getStudentName()
    {
        return $this->student_name;
    }

    public function getProgrammeId()
    {
        return $this->programme_id;
    }

    public function getDepartmentId()
    {
        return $this->department_id;
    }

    public function getBatchYear()
    {
        return $this->batch_year;
    }

    public function getStudentStatus()
    {
        return $this->student_status;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getPhone()
    {
        return $this->phone;
    }

    // Setters
    public function setStudentName($student_name)
    {
        $this->student_name = $student_name;
    }

    public function setProgrammeId($programme_id)
    {
        $this->programme_id = $programme_id;
    }

    public function setDepartmentId($department_id)
    {
        $this->department_id = $department_id;
    }

    public function setBatchYear($batch_year)
    {
        $this->batch_year = $batch_year;
    }

    public function setStudentStatus($student_status)
    {
        $this->student_status = $student_status;
    }

    public function setEmail($email)
    {
        $this->email = $email;
    }

    public function setPhone($phone)
    {
        $this->phone = $phone;
    }

    /**
     * Convert to array
     */
    public function toArray()
    {
        return [
            'roll_no' => $this->roll_no,
            'student_name' => $this->student_name,
            'programme_id' => $this->programme_id,
            'department_id' => $this->department_id,
            'batch_year' => $this->batch_year,
            'student_status' => $this->student_status,
            'email' => $this->email,
            'phone' => $this->phone
        ];
    }
}
