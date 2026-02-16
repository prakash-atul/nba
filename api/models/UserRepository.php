<?php

/**
 * User Repository Class
 * Follows Single Responsibility Principle - handles only database operations for users
 * Follows Dependency Inversion Principle - depends on abstractions (interfaces)
 */
class UserRepository
{
    private $db;

    public function __construct($dbConnection)
    {
        $this->db = $dbConnection;
    }

    /**
     * Find user by employee ID
     * @param int $employeeId
     * @return User|null
     */
    public function findByEmployeeId($employeeId)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE employee_id = ?");
            $stmt->execute([$employeeId]);
            $userData = $stmt->fetch();

            if ($userData) {
                return new User(
                    $userData['employee_id'],
                    $userData['username'],
                    $userData['email'],
                    $userData['password'],
                    $userData['role'],
                    $userData['department_id'],
                    $userData['designation'] ?? null,
                    $userData['phone'] ?? null,
                    $userData['created_at'] ?? null,
                    $userData['updated_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find user by username
     * @param string $username
     * @return User|null
     */
    public function findByUsername($username)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $userData = $stmt->fetch();

            if ($userData) {
                return new User(
                    $userData['employee_id'],
                    $userData['username'],
                    $userData['email'],
                    $userData['password'],
                    $userData['role'],
                    $userData['department_id'],
                    $userData['designation'] ?? null,
                    $userData['phone'] ?? null,
                    $userData['created_at'] ?? null,
                    $userData['updated_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find user by employee ID or email (for login)
     * @param string $employeeIdOrEmail
     * @return User|null
     */
    public function findByEmployeeIdOrEmail($employeeIdOrEmail)
    {
        try {
            // First try to find by employee_id (if it's numeric)
            if (is_numeric($employeeIdOrEmail)) {
                $user = $this->findByEmployeeId((int)$employeeIdOrEmail);
                if ($user) {
                    return $user;
                }
            }

            // If not found or not numeric, try by email
            return $this->findByEmail($employeeIdOrEmail);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find users by school ID
     * @param int $schoolId
     * @return array
     */
    public function findBySchool($schoolId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT u.* 
                FROM users u
                JOIN departments d ON u.department_id = d.department_id
                WHERE d.school_id = ?
                ORDER BY u.employee_id
            ");
            $stmt->execute([$schoolId]);
            $users = [];

            while ($userData = $stmt->fetch(PDO::FETCH_ASSOC)) {
                // Determine roles based on assignments if needed, but for now stick to base user data
                // The Controller will handle role assignment checks
                $users[] = new User(
                    $userData['employee_id'],
                    $userData['username'],
                    $userData['email'],
                    $userData['password'],
                    $userData['role'],
                    $userData['department_id'],
                    $userData['designation'] ?? null,
                    $userData['phone'] ?? null,
                    $userData['created_at'] ?? null,
                    $userData['updated_at'] ?? null
                );
            }
            return $users;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count users by school ID
     * @param int $schoolId
     * @param string|null $role
     * @return int
     */
    public function countBySchool($schoolId, $role = null)
    {
        try {
            $sql = "
                SELECT COUNT(*) 
                FROM users u
                JOIN departments d ON u.department_id = d.department_id
                WHERE d.school_id = ?
            ";
            $params = [$schoolId];

            if ($role) {
                $sql .= " AND u.role = ?";
                $params[] = $role;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find user by email
     * @param string $email
     * @return User|null
     */
    public function findByEmail($email)
    {
        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $userData = $stmt->fetch();

            if ($userData) {
                return new User(
                    $userData['employee_id'],
                    $userData['username'],
                    $userData['email'],
                    $userData['password'],
                    $userData['role'],
                    $userData['department_id'],
                    $userData['designation'] ?? null,
                    $userData['phone'] ?? null,
                    $userData['created_at'] ?? null,
                    $userData['updated_at'] ?? null
                );
            }
            return null;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Save user to database
     * @param User $user
     * @return bool
     */
    public function save(User $user)
    {
        try {
            // Check if user exists
            $existingUser = $this->findByEmployeeId($user->getEmployeeId());

            if ($existingUser) {
                // Update existing user
                $stmt = $this->db->prepare("UPDATE users SET username = ?, email = ?, password = ?, role = ?, department_id = ?, designation = ?, phone = ? WHERE employee_id = ?");
                return $stmt->execute([
                    $user->getUsername(),
                    $user->getEmail(),
                    $user->getPassword(),
                    $user->getRole(),
                    $user->getDepartmentId(),
                    $user->getDesignation(),
                    $user->getPhone(),
                    $user->getEmployeeId()
                ]);
            } else {
                // Insert new user
                $stmt = $this->db->prepare("INSERT INTO users (employee_id, username, email, password, role, department_id, designation, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                return $stmt->execute([
                    $user->getEmployeeId(),
                    $user->getUsername(),
                    $user->getEmail(),
                    $user->getPassword(),
                    $user->getRole(),
                    $user->getDepartmentId(),
                    $user->getDesignation(),
                    $user->getPhone()
                ]);
            }
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete user by employee ID
     * @param int $employeeId
     * @return bool
     */
    public function delete($employeeId)
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM users WHERE employee_id = ?");
            return $stmt->execute([$employeeId]);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if username exists
     * @param string $username
     * @param int|null $excludeEmployeeId
     * @return bool
     */
    public function usernameExists($username, $excludeEmployeeId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM users WHERE username = ?";
            $params = [$username];

            if ($excludeEmployeeId) {
                $sql .= " AND employee_id != ?";
                $params[] = $excludeEmployeeId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if email exists
     * @param string $email
     * @param int|null $excludeEmployeeId
     * @return bool
     */
    public function emailExists($email, $excludeEmployeeId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM users WHERE email = ?";
            $params = [$email];

            if ($excludeEmployeeId) {
                $sql .= " AND employee_id != ?";
                $params[] = $excludeEmployeeId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get all users with department info
     * @return array
     */
    public function findAll()
    {
        try {
            $stmt = $this->db->prepare("
                SELECT u.*, d.department_name, d.department_code, d.school_id
                FROM users u 
                LEFT JOIN departments d ON u.department_id = d.department_id 
                ORDER BY u.employee_id
            ");
            $stmt->execute();
            $users = [];

            while ($userData = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $users[] = [
                    'employee_id' => $userData['employee_id'],
                    'username' => $userData['username'],
                    'email' => $userData['email'],
                    'role' => $userData['role'],
                    'designation' => $userData['designation'],
                    'phone' => $userData['phone'],
                    'department_id' => $userData['department_id'],
                    'department_name' => $userData['department_name'],
                    'department_code' => $userData['department_code'],
                    'school_id' => $userData['school_id'] ?? null
                ];
            }

            return $users;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all users
     * @return int
     */
    public function countAll()
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM users");
            $stmt->execute();
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find faculty and staff by department
     * @param int $departmentId
     * @return array
     */
    public function findFacultyByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT employee_id, username, email, role, department_id, designation, phone
                FROM users 
                WHERE department_id = ? AND role IN ('faculty', 'staff')
                ORDER BY role, username
            ");
            $stmt->execute([$departmentId]);
            $faculty = [];

            while ($userData = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $faculty[] = [
                    'employee_id' => $userData['employee_id'],
                    'username' => $userData['username'],
                    'email' => $userData['email'],
                    'role' => $userData['role'],
                    'designation' => $userData['designation'],
                    'phone' => $userData['phone'],
                    'department_id' => $userData['department_id']
                ];
            }

            return $faculty;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count faculty by department
     * @param int $departmentId
     * @return int
     */
    public function countFacultyByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM users 
                WHERE department_id = ? AND role = 'faculty'
            ");
            $stmt->execute([$departmentId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count all users by department
     * @param int $departmentId
     * @return int
     */
    public function countByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM users WHERE department_id = ?");
            $stmt->execute([$departmentId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count students by department
     * @param int $departmentId
     * @return int
     */
    public function countStudentsByDepartment($departmentId)
    {
        try {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM students WHERE department_id = ?");
            $stmt->execute([$departmentId]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if HOD exists for a department
     * Now queries hod_assignments table instead of users.role
     * @param int $departmentId
     * @param int|null $excludeEmployeeId Optional employee ID to exclude from the check (for updates)
     * @return bool
     */
    public function hodExistsForDepartment($departmentId, $excludeEmployeeId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM hod_assignments WHERE department_id = ? AND is_current = 1";
            $params = [$departmentId];

            if ($excludeEmployeeId) {
                $sql .= " AND employee_id != ?";
                $params[] = $excludeEmployeeId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if Dean exists in the system
     * Now queries dean_assignments table instead of users.role
     * @param int|null $excludeEmployeeId Optional employee ID to exclude from the check (for updates)
     * @return bool
     */
    public function deanExists($excludeEmployeeId = null)
    {
        try {
            $sql = "SELECT COUNT(*) FROM dean_assignments WHERE is_current = 1";
            $params = [];

            if ($excludeEmployeeId) {
                $sql .= " AND employee_id != ?";
                $params[] = $excludeEmployeeId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchColumn() > 0;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}
