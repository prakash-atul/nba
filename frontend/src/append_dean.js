const fs = require("fs");
const path = "c:/xampp/htdocs/nba-met4l/api/controllers/AdminController.php";
let content = fs.readFileSync(path, "utf8");

const method = `
    public function getDeanHistory() {
        if (!$this->requireAdmin()) return;
        try {
            $schools = $this->schoolRepository->findAll();
            $history = [];
            foreach ($schools as $school) {
                if ($this->deanAssignmentRepository) {
                    $records = $this->deanAssignmentRepository->getHistoryBySchool($school['school_id']);
                    foreach ($records as $record) {
                        $record['school_name'] = $school['school_name'];
                        $record['school_code'] = $school['school_code'];
                        $history[] = $record;
                    }
                }
            }
            usort($history, function ($a, $b) {
                return strtotime($b['start_date']) - strtotime($a['start_date']);
            });
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Dean history retrieved successfully', 'data' => $history]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
`;

content = content.replace(/}\s*$/, method + "\n}");
fs.writeFileSync(path, content, "utf8");
console.log("Successfully appended getDeanHistory to AdminController.php");
