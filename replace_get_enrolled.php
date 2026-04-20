<?php
$content = file_get_contents('api/controllers/FacultyController.php');

$newFunc = <<<'EOD'
    public function getEnrolledStudents($facultyId)
    {
        try {
            $assignments = $this->courseFacultyAssignmentRepository->getAssignmentsByFaculty($facultyId);

            if (empty($assignments)) {
                http_response_code(200);
                header('Content-Type: application/json');
                echo json_encode(PaginationHelper::buildResponse([], 0, false, null));
                return;
            }

            $offeringIds = array_column($assignments, 'offering_id');
            $placeholders = implode(',', array_fill(0, count($offeringIds), '?'));

            // Parse pagination params
            $params = PaginationHelper::parseParams($_GET, 'roll_no', 'roll_no', ['roll_no', 'student_name', 'batch_year'], ['batch_year', 'department_id', 'student_status']);
            
            $whereConditions = ["e.offering_id IN ($placeholders)"];
            $queryParams = $offeringIds;

            if (!empty($params['search'])) {
                $whereConditions[] = "(s.student_name LIKE ? OR s.roll_no LIKE ? OR s.email LIKE ?)";
                $searchParam = "%{$params['search']}%";
                array_push($queryParams, $searchParam, $searchParam, $searchParam);
            }
            if (!empty($params['filters'])) {
                foreach ($params['filters'] as $key => $value) {
                    $whereConditions[] = "s.$key = ?";
                    $queryParams[] = $value;
                }
            }

            $sortCol = 's.' . $params['sort'];
            $op = ($params['sort_dir'] === 'ASC') ? '>' : '<';

            if ($params['cursor'] !== null) {
                $cursorVal = $params['cursor'];

                if ($params['sort'] === 'roll_no') {
                    $whereConditions[] = "s.roll_no $op ?";
                    $queryParams[] = $cursorVal;
                } else {
                    $parts = explode('|', $cursorVal, 2);
                    if (count($parts) === 2) {
                        $cond1 = "$sortCol $op ?";
                        $cond2 = "($sortCol = ? AND s.roll_no > ?)";
                        $whereConditions[] = "($cond1 OR $cond2)";
                        array_push($queryParams, $parts[0], $parts[0], $parts[1]);
                    } else {
                        // fallback
                        $whereConditions[] = "s.roll_no > ?";
                        $queryParams[] = $cursorVal;
                    }
                }
            }

            $whereClause = implode(' AND ', $whereConditions);

            // Count Query
            $countQuery = "
                SELECT COUNT(DISTINCT s.roll_no)
                FROM enrollments e
                JOIN students s ON e.student_rollno = s.roll_no
                WHERE $whereClause
            ";
            $stmtCount = $this->db->prepare($countQuery);
            $stmtCount->execute($queryParams);
            $totalCount = (int)$stmtCount->fetchColumn();

            if ($params['sort'] !== 'roll_no') {
                $orderBy = "$sortCol {$params['sort_dir']}, s.roll_no ASC";
            } else {
                $orderBy = "s.roll_no {$params['sort_dir']}";
            }

            $limit = (int)$params['limit'];
            // fetch limit+1 for hasMore
            $fetchLimit = $limit + 1;

            $dataQuery = "
                SELECT s.roll_no, s.student_name, s.department_id, s.batch_year, s.student_status,
                       s.email, s.phone, d.department_name, d.department_code,
                       GROUP_CONCAT(DISTINCT CONCAT(c.course_code, ': ', c.course_name, ' (', co.year, '/', co.semester, ')') ORDER BY c.course_code SEPARATOR ', ') AS enrolled_courses
                FROM enrollments e
                JOIN students s ON e.student_rollno = s.roll_no
                JOIN course_offerings co ON e.offering_id = co.offering_id
                JOIN courses c ON co.course_id = c.course_id
                LEFT JOIN departments d ON s.department_id = d.department_id
                WHERE $whereClause
                GROUP BY s.roll_no, s.student_name, s.department_id, s.batch_year, 
                         s.student_status, s.email, s.phone, d.department_name, d.department_code
                ORDER BY $orderBy
                LIMIT $fetchLimit
            ";

            $stmt = $this->db->prepare($dataQuery);
            $stmt->execute($queryParams);
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $hasMore = count($students) > $limit;
            if ($hasMore) {
                array_pop($students);
            }

            $nextCursor = null;
            if (!empty($students)) {
                $lastItem = $students[count($students) - 1];
                if ($params['sort'] !== 'roll_no') {
                    $nextCursor = $lastItem[$params['sort']] . '|' . $lastItem['roll_no'];
                } else {
                    $nextCursor = $lastItem['roll_no'];
                }
            }

            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode(PaginationHelper::buildResponse($students, $totalCount, $hasMore, $nextCursor));
        } catch (Exception $e) {
            if (isset($GLOBALS['fileLogger'])) { $GLOBALS['fileLogger']->error('FacultyController', 'getEnrolledStudents', ['error' => $e->getMessage()]); }
            error_log("Error getting enrolled students: " . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Failed to retrieve students', 'error' => $e->getMessage()]);
        }
    }
EOD;

$pattern = '/(\s*)public function getEnrolledStudents\(\$facultyId\)(.*?)\s*\/\*\*/s';
if (preg_match($pattern, $content)) {
    $content = preg_replace($pattern, "\n" . $newFunc . "\n\n    /**", $content, 1);
    file_put_contents('api/controllers/FacultyController.php', $content);
    echo "Replaced successfully\n";
} else {
    echo "Match not found!\n";
}
?>
