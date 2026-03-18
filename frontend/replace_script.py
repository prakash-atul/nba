import sys
import io

with open('c:/xampp/htdocs/nba-met4l/api/controllers/StaffController.php', 'r', encoding='utf-8') as f:
    text = f.read()

start_idx = text.find('    public function getCourseEnrollments(')
end_idx = text.find('    public function updateCourse(')

if start_idx == -1 or end_idx == -1:
    print('Failed to find indices')
    sys.exit(1)

doc_start = text.rfind('    /**', 0, start_idx)
doc_start_update = text.rfind('    /**', 0, end_idx)

with open('replacement_methods.txt', 'r', encoding='utf-8-sig') as f:
    replacement = f.read()

new_text = text[:doc_start] + replacement + '\n\n' + text[doc_start_update:]

with open('c:/xampp/htdocs/nba-met4l/api/controllers/StaffController.php', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Success!')
