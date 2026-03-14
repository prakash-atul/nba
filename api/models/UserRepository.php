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
                    $userData['password_hash'],
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
                    $userData['password_hash'],
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
                    $userData['password_hash'],
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
                    $userData['password_hash'],
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
                $stmt = $this->db->prepare("UPDATE users SET username = ?, email = ?, password_hash = ?, role = ?, department_id = ?, designation = ?, phone = ? WHERE employee_id = ?");
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
                $stmt = $this->db->prepare("INSERT INTO users (employee_id, username, email, password_hash, role, department_id, designation, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
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
     * Paginated list of users (admin view).
     * Uses keyset cursor on employee_id.
     *
     * Fetches limit+1 rows so the caller can detect has_more.
     *
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findPaginated(array $params): array
    {
        try {
            $sql = "
                SELECT u.employee_id, u.username, u.email, u.role,
                       u.designation, u.phone, u.department_id,
                       u.created_at, u.updated_at,
                       d.department_name, d.department_code, d.school_id,
                       CASE WHEN h.employee_id IS NOT NULL THEN 1 ELSE 0 END as is_hod,
                       CASE WHEN de.employee_id IS NOT NULL THEN 1 ELSE 0 END as is_dean
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.department_id
                LEFT JOIN hod_assignments h ON u.employee_id = h.employee_id AND h.end_date IS NULL
                LEFT JOIN dean_assignments de ON u.employee_id = de.employee_id AND de.end_date IS NULL
                WHERE 1=1
            ";
            $bindings = [];

            // Search filter
            if ($params['search']) {
                $sql .= " AND (u.username LIKE ? OR u.email LIKE ? OR u.designation LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
                $bindings[] = $like;
            }

            // Extra filters
            if (!empty($params['filters']['role'])) {
                $sql .= " AND u.role = ?";
                $bindings[] = $params['filters']['role'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND u.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }

            // Cursor
            PaginationHelper::applyCursor($sql, $bindings, 'u.employee_id', $params['cursor'], $params['sortDir']);

            // Sort + limit (fetch one extra to detect next page)
            $safeSort = $params['sort'];
            $limit = (int)$params['limit'] + 1;
            $sql .= " ORDER BY {$safeSort} {$params['sortDir']} LIMIT {$limit}";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count users matching pagination filters (for total count).
     *
     * @param array $params Result of PaginationHelper::parseParams()
     * @return int
     */
    public function countPaginated(array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM users u WHERE 1=1";
            $bindings = [];

            if ($params['search']) {
                $sql .= " AND (u.username LIKE ? OR u.email LIKE ? OR u.designation LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['role'])) {
                $sql .= " AND u.role = ?";
                $bindings[] = $params['filters']['role'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND u.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Paginated users scoped to a school (dean view).
     *
     * @param int   $schoolId
     * @param array $params   Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findBySchoolPaginated(int $schoolId, array $params): array
    {
        try {
            $sql = "
                SELECT u.employee_id, u.username, u.email, u.role,
                       u.designation, u.phone, u.department_id,
                       u.created_at, u.updated_at,
                       d.department_name, d.department_code,
                       CASE WHEN h.employee_id IS NOT NULL THEN 1 ELSE 0 END as is_hod,
                       CASE WHEN de.employee_id IS NOT NULL THEN 1 ELSE 0 END as is_dean
                FROM users u
                JOIN departments d ON u.department_id = d.department_id
                LEFT JOIN hod_assignments h ON u.employee_id = h.employee_id AND h.end_date IS NULL
                LEFT JOIN dean_assignments de ON u.employee_id = de.employee_id AND de.end_date IS NULL
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (u.username LIKE ? OR u.email LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['role'])) {
                $sql .= " AND u.role = ?";
                $bindings[] = $params['filters']['role'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND u.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 'u.employee_id', $params['cursor'], $params['sortDir']);

            $limit = (int)$params['limit'] + 1;
            $sql .= " ORDER BY {$params['sort']} {$params['sortDir']} LIMIT {$limit}";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count users in a school matching filters.
     */
    public function countBySchoolPaginated(int $schoolId, array $params): int
    {
        try {
            $sql = "
                SELECT COUNT(*)
                FROM users u
                JOIN departments d ON u.department_id = d.department_id
                WHERE d.school_id = ?
            ";
            $bindings = [$schoolId];

            if ($params['search']) {
                $sql .= " AND (u.username LIKE ? OR u.email LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['role'])) {
                $sql .= " AND u.role = ?";
                $bindings[] = $params['filters']['role'];
            }
            if (!empty($params['filters']['department_id'])) {
                $sql .= " AND u.department_id = ?";
                $bindings[] = (int)$params['filters']['department_id'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
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
            $sql = "SELECT COUNT(*) FROM hod_assignments WHERE department_id = ? AND end_date IS NULL";
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
            $sql = "SELECT COUNT(*) FROM dean_assignments WHERE end_date IS NULL";
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

    /**
     * Paginated faculty/staff scoped to a department (HOD / Staff view).
     *
     * @param int   $departmentId
     * @param array $params Result of PaginationHelper::parseParams()
     * @return array raw rows
     */
    public function findByDepartmentPaginated(int $departmentId, array $params): array
    {
        try {
            $sql = "
                SELECT u.employee_id, u.username, u.email, u.role,
                       u.designation, u.phone, u.department_id, u.created_at, u.updated_at,
                       CASE WHEN h.employee_id IS NOT NULL THEN 1 ELSE 0 END as is_hod,
                       CASE WHEN de.employee_id IS NOT NULL THEN 1 ELSE 0 END as is_dean
                FROM users u
                LEFT JOIN hod_assignments h ON u.employee_id = h.employee_id AND h.end_date IS NULL
                LEFT JOIN dean_assignments de ON u.employee_id = de.employee_id AND de.end_date IS NULL
                WHERE u.department_id = ? AND u.role IN ('faculty', 'staff')
            ";
            $bindings = [$departmentId];

            if ($params['search']) {
                $sql .= " AND (u.username LIKE ? OR u.email LIKE ? OR u.designation LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['role'])) {
                $sql .= " AND role = ?";
                $bindings[] = $params['filters']['role'];
            }

            PaginationHelper::applyCursor($sql, $bindings, 'employee_id', $params['cursor'], $params['sortDir']);

            $limit = (int)$params['limit'] + 1;
            $sql .= " ORDER BY {$params['sort']} {$params['sortDir']} LIMIT {$limit}";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Count faculty/staff in a department matching filters.
     */
    public function countByDepartmentPaginated(int $departmentId, array $params): int
    {
        try {
            $sql = "SELECT COUNT(*) FROM users WHERE department_id = ? AND role IN ('faculty', 'staff')";
            $bindings = [$departmentId];

            if ($params['search']) {
                $sql .= " AND (username LIKE ? OR email LIKE ? OR designation LIKE ?)";
                $like = '%' . $params['search'] . '%';
                $bindings[] = $like;
                $bindings[] = $like;
                $bindings[] = $like;
            }
            if (!empty($params['filters']['role'])) {
                $sql .= " AND role = ?";
                $bindings[] = $params['filters']['role'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($bindings);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
}