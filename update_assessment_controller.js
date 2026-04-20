const fs = require("fs");
const content = fs.readFileSync("api/controllers/AssessmentController.php", "utf8");

const newFunc = `    public function getFacultyCourses()
    {
        try {
            $userData = $_REQUEST["authenticated_user"];

            if ($userData["role"] !== "faculty" && $userData["role"] !== "hod" && $userData["role"] !== "dean") {
                if (isset($GLOBALS["fileLogger"])) { $GLOBALS["fileLogger"]->warn("AssessmentController", "Unauthorized access attempt", ["user" => $_REQUEST["authenticated_user"] ?? "anonymous"]); }
                http_response_code(403);
                echo json_encode([
                    "success" => false,
                    "message" => "Access denied. Only faculty can access courses."
                ]);
                return;
            }

            $facultyId = $userData["employee_id"];

            // Parse pagination parameters
            $params = \PaginationHelper::parseParams($_GET, "offering_id", "year", ["year", "semester", "course_code", "course_name", "offering_id"], ["course_id", "department_id", "semester", "year", "is_active"]);

            $isHod = ($userData["role"] === "hod");

            if ($isHod) {
                $departmentId = $userData["department_id"];
                $totalCount = $this->courseOfferingRepository->countByDepartmentPaginated($departmentId, $params);
                $offerings = $this->courseOfferingRepository->findByDepartmentPaginated($departmentId, $params);
            } else {
                $totalCount = $this->courseOfferingRepository->countByFacultyPaginated($facultyId, $params);
                $offerings = $this->courseOfferingRepository->findByFacultyPaginated($facultyId, $params);
            }

            $limit = (int)$params["limit"];
            $hasMore = count($offerings) > $limit;
            if ($hasMore) {
                array_pop($offerings);
            }

            $nextCursor = null;
            if (!empty($offerings)) {
                $lastItem = $offerings[count($offerings) - 1];
                $rawSort = ltrim($params["sort"], "co.");
                $rawSort = ltrim($rawSort, "c.");
                if ($rawSort !== "offering_id") {
                    $nextCursor = $lastItem[$rawSort] . "|" . $lastItem["offering_id"];
                } else {
                    $nextCursor = $lastItem["offering_id"];
                }
            }

            http_response_code(200);
            echo json_encode(\PaginationHelper::buildResponse($offerings, $totalCount, $hasMore, $nextCursor));
        } catch (\Exception $e) {
            if (isset($GLOBALS["fileLogger"])) { $GLOBALS["fileLogger"]->error("AssessmentController", "getFacultyCourses prompt", ["error" => $e->getMessage()]); }
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to retrieve courses",
                "error" => $e->getMessage()
            ]);
        }
    }`;

const replacedRegex = /public function getFacultyCourses\(\)[^\{]*\{[\s\S]*?\n    \}\r?\n\r?\n    \/\*\*/ms;
if (replacedRegex.test(content)) {
    const updated = content.replace(replacedRegex, newFunc + "\n\n    /**");
    fs.writeFileSync("api/controllers/AssessmentController.php", updated);
    console.log("Replaced successfully");
} else {
    console.log("Match not found");
}

