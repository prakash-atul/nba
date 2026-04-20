const fs = require("fs");
let content = fs.readFileSync("api/models/CourseOfferingRepository.php", "utf8");

const newMethods = `    /**
     * Find offerings by faculty ID (Paginated)
     */
    public function findByFacultyPaginated($facultyId, $params)
    {
        try {
            $whereConditions = ["cfa.employee_id = ?"];
            $queryParams = [$facultyId];
            
            if (!empty($params["search"])) {
                $whereConditions[] = "(c.course_code LIKE ? OR c.course_name LIKE ?)";
                $searchParam = "%{$params["search"]}%";
                array_push($queryParams, $searchParam, $searchParam);
            }
            if (!empty($params["filters"])) {
                foreach ($params["filters"] as $key => $value) {
                    if ($key === "department_id" || $key === "course_id") {
                        $whereConditions[] = "c.$key = ?";
                    } else {
                        $whereConditions[] = "co.$key = ?";
                    }
                    $queryParams[] = $value;
                }
            }

            $rawSort = ltrim($params["sort"], "co.");
            $rawSort = ltrim($rawSort, "c.");
            $sortCol = "co." . $rawSort;
            if ($rawSort === "course_code" || $rawSort === "course_name" || $rawSort === "department_id") {
                $sortCol = "c." . $rawSort;
            }

            $op = ($params["sort_dir"] === "ASC") ? ">" : "<";

            if ($params["cursor"] !== null) {
                $cursorVal = $params["cursor"];
                if ($rawSort === "offering_id") {
                    $whereConditions[] = "co.offering_id $op ?";
                    $queryParams[] = $cursorVal;
                } else {
                    $parts = explode("|", $cursorVal, 2);
                    if (count($parts) === 2) {
                        $cond1 = "$sortCol $op ?";
                        $cond2 = "($sortCol = ? AND co.offering_id > ?)";
                        $whereConditions[] = "($cond1 OR $cond2)";
                        array_push($queryParams, $parts[0], $parts[0], $parts[1]);
                    } else {
                        $whereConditions[] = "co.offering_id > ?";
                        $queryParams[] = $cursorVal;
                    }
                }
            }

            $whereClause = implode(" AND ", $whereConditions);
            
            // Note: avg_score_pct calculation in subquery and count
            $orderBy = "$sortCol {$params["sort_dir"]}, co.offering_id ASC";
            if ($rawSort === "offering_id") {
                $orderBy = "co.offering_id {$params["sort_dir"]}";
            }

            $limit = (int)$params["limit"];
            $fetchLimit = $limit + 1;

            $query = "
                SELECT DISTINCT co.*, c.course_code, c.course_name, c.credit,
                       cfa.assignment_type, cfa.employee_id, cfa.is_active as cfa_is_active,
                       (SELECT COUNT(*) FROM enrollments e WHERE e.offering_id = co.offering_id) AS enrollment_count,
                       (SELECT COUNT(*) FROM tests t WHERE t.offering_id = co.offering_id) AS test_count,
                       (SELECT ROUND(
                            SUM(m.marks_obtained) / NULLIF(
                                COUNT(DISTINCT m.student_roll_no) * 
                                (SELECT SUM(t2.full_marks) FROM tests t2 WHERE t2.offering_id = co.offering_id)
                            , 0) * 100, 
                        1)
                        FROM marks m
                        INNER JOIN tests t3 ON t3.test_id = m.test_id
                        WHERE t3.offering_id = co.offering_id
                       ) AS avg_score_pct
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                INNER JOIN course_faculty_assignments cfa ON co.offering_id = cfa.offering_id
                WHERE $whereClause
                ORDER BY $orderBy
                LIMIT $fetchLimit
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute($queryParams);
            $offerings = [];
            while ($data = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    "offering_id" => $data["offering_id"],
                    "course_id" => $data["course_id"],
                    "course_code" => $data["course_code"],
                    "course_name" => $data["course_name"],
                    "credit" => $data["credit"],
                    "year" => $data["year"],
                    "semester" => $data["semester"],
                    "co_threshold" => $data["co_threshold"],
                    "passing_threshold" => $data["passing_threshold"],
                    "assignment_type" => $data["assignment_type"],
                    "is_active" => (int)$data["cfa_is_active"],
                    "enrollment_count" => (int)$data["enrollment_count"],
                    "test_count" => (int)$data["test_count"],
                    "avg_score_pct" => $data["avg_score_pct"] !== null ? (float)$data["avg_score_pct"] : null
                ];
            }
            return $offerings;
        } catch (\PDOException $e) {
            throw new \Exception("Database error: " . $e->getMessage());
        }
    }

    public function countByFacultyPaginated($facultyId, $params)
    {
        try {
            $whereConditions = ["cfa.employee_id = ?"];
            $queryParams = [$facultyId];
            
            if (!empty($params["search"])) {
                $whereConditions[] = "(c.course_code LIKE ? OR c.course_name LIKE ?)";
                $searchParam = "%{$params["search"]}%";
                array_push($queryParams, $searchParam, $searchParam);
            }
            if (!empty($params["filters"])) {
                foreach ($params["filters"] as $key => $value) {
                    if ($key === "department_id" || $key === "course_id") {
                        $whereConditions[] = "c.$key = ?";
                    } else {
                        $whereConditions[] = "co.$key = ?";
                    }
                    $queryParams[] = $value;
                }
            }

            $whereClause = implode(" AND ", $whereConditions);
            $query = "
                SELECT COUNT(DISTINCT co.offering_id)
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                INNER JOIN course_faculty_assignments cfa ON co.offering_id = cfa.offering_id
                WHERE $whereClause
            ";
            $stmt = $this->db->prepare($query);
            $stmt->execute($queryParams);
            return (int)$stmt->fetchColumn();
        } catch (\PDOException $e) {
            throw new \Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Find offerings by department (Paginated)
     */
    public function findByDepartmentPaginated($departmentId, $params)
    {
        try {
            $whereConditions = ["c.department_id = ?"];
            $queryParams = [$departmentId];
            
            if (!empty($params["search"])) {
                $whereConditions[] = "(c.course_code LIKE ? OR c.course_name LIKE ?)";
                $searchParam = "%{$params["search"]}%";
                array_push($queryParams, $searchParam, $searchParam);
            }
            if (!empty($params["filters"])) {
                foreach ($params["filters"] as $key => $value) {
                    if ($key === "department_id" || $key === "course_id") {
                        $whereConditions[] = "c.$key = ?";
                    } else {
                        $whereConditions[] = "co.$key = ?";
                    }
                    $queryParams[] = $value;
                }
            }

            $rawSort = ltrim($params["sort"], "co.");
            $rawSort = ltrim($rawSort, "c.");
            $sortCol = "co." . $rawSort;
            if ($rawSort === "course_code" || $rawSort === "course_name" || $rawSort === "department_id") {
                $sortCol = "c." . $rawSort;
            }

            $op = ($params["sort_dir"] === "ASC") ? ">" : "<";

            if ($params["cursor"] !== null) {
                $cursorVal = $params["cursor"];
                if ($rawSort === "offering_id") {
                    $whereConditions[] = "co.offering_id $op ?";
                    $queryParams[] = $cursorVal;
                } else {
                    $parts = explode("|", $cursorVal, 2);
                    if (count($parts) === 2) {
                        $cond1 = "$sortCol $op ?";
                        $cond2 = "($sortCol = ? AND co.offering_id > ?)";
                        $whereConditions[] = "($cond1 OR $cond2)";
                        array_push($queryParams, $parts[0], $parts[0], $parts[1]);
                    } else {
                        $whereConditions[] = "co.offering_id > ?";
                        $queryParams[] = $cursorVal;
                    }
                }
            }

            $whereClause = implode(" AND ", $whereConditions);
            
            $orderBy = "$sortCol {$params["sort_dir"]}, co.offering_id ASC";
            if ($rawSort === "offering_id") {
                $orderBy = "co.offering_id {$params["sort_dir"]}";
            }

            $limit = (int)$params["limit"];
            $fetchLimit = $limit + 1;

            $query = "
                SELECT co.*, c.course_code, c.course_name, c.credit,
                       u.username as primary_faculty_name,
                       cfa.employee_id as primary_faculty_id,
                       (SELECT COUNT(*) FROM enrollments e WHERE e.offering_id = co.offering_id) AS enrollment_count,
                       (SELECT COUNT(*) FROM tests t WHERE t.offering_id = co.offering_id) AS test_count
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                LEFT JOIN course_faculty_assignments cfa 
                    ON co.offering_id = cfa.offering_id 
                    AND cfa.assignment_type = 'Primary' 
                    AND cfa.is_active = 1
                LEFT JOIN users u ON cfa.employee_id = u.employee_id
                WHERE $whereClause
                ORDER BY $orderBy
                LIMIT $fetchLimit
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute($queryParams);
            $offerings = [];
            while ($data = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $offerings[] = [
                    "offering_id" => $data["offering_id"],
                    "course_id" => $data["course_id"],
                    "course_code" => $data["course_code"],
                    "course_name" => $data["course_name"],
                    "credit" => $data["credit"],
                    "year" => $data["year"],
                    "semester" => $data["semester"],
                    "co_threshold" => $data["co_threshold"],
                    "passing_threshold" => $data["passing_threshold"],
                    "primary_faculty_id" => $data["primary_faculty_id"],
                    "primary_faculty_name" => $data["primary_faculty_name"],
                    "is_active" => $data["is_active"] ?? 1,
                    "created_at" => $data["created_at"],
                    "updated_at" => $data["updated_at"],
                    "enrollment_count" => (int)$data["enrollment_count"],
                    "test_count" => (int)$data["test_count"]
                ];
            }
            return $offerings;
        } catch (\PDOException $e) {
            throw new \Exception("Database error: " . $e->getMessage());
        }
    }

    public function countByDepartmentPaginated($departmentId, $params)
    {
        try {
            $whereConditions = ["c.department_id = ?"];
            $queryParams = [$departmentId];
            
            if (!empty($params["search"])) {
                $whereConditions[] = "(c.course_code LIKE ? OR c.course_name LIKE ?)";
                $searchParam = "%{$params["search"]}%";
                array_push($queryParams, $searchParam, $searchParam);
            }
            if (!empty($params["filters"])) {
                foreach ($params["filters"] as $key => $value) {
                    if ($key === "department_id" || $key === "course_id") {
                        $whereConditions[] = "c.$key = ?";
                    } else {
                        $whereConditions[] = "co.$key = ?";
                    }
                    $queryParams[] = $value;
                }
            }

            $whereClause = implode(" AND ", $whereConditions);
            $query = "
                SELECT COUNT(DISTINCT co.offering_id)
                FROM course_offerings co
                INNER JOIN courses c ON co.course_id = c.course_id
                WHERE $whereClause
            ";
            $stmt = $this->db->prepare($query);
            $stmt->execute($queryParams);
            return (int)$stmt->fetchColumn();
        } catch (\PDOException $e) {
            throw new \Exception("Database error: " . $e->getMessage());
        }
    }
`;

const insertIndex = content.lastIndexOf("}");
content = content.slice(0, insertIndex) + "\n" + newMethods + "\n" + content.slice(insertIndex);
fs.writeFileSync("api/models/CourseOfferingRepository.php", content);
console.log("Updated repository");

