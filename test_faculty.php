<?php
\['limit'] = '20';
\['sort'] = '-s.enrollment_date';
\['sort_dir'] = 'ASC';
\['cursor'] = base64_encode('CSB21028');

require 'api/config/DatabaseConfig.php';
require 'api/utils/PaginationHelper.php';
require 'api/models/CourseFacultyAssignmentRepository.php';

\ = new DatabaseConfig();
\ = \->getConnection();
\ = new CourseFacultyAssignmentRepository(\);

\ = 3101;
\ = \->getAssignmentsByFaculty(\);
\ = array_column(\, 'offering_id');
\ = implode(',', array_fill(0, count(\), '?'));

\ = PaginationHelper::parseParams(\, 'roll_no', 'roll_no', ['roll_no', 'student_name', 'batch_year'], ['batch_year', 'department_id', 'student_status']);
\ = ["e.offering_id IN (\)"];
\ = \;

\ = ltrim(\['sort'], 's.');
\ = 's.' . \;
\ = (\['sort_dir'] === 'ASC') ? '>' : '<';

if (\['cursor'] !== null) {
    \ = \['cursor'];
    if (\ === 'roll_no') {
        \[] = "s.roll_no \ ?";
        \[] = \;
    } else {
        \[] = "s.roll_no > ?";
        \[] = \;
    }
}
\ = implode(' AND ', \);
\ = 's.roll_no ' . \['sort_dir'];
\ = 21;

\ = "
    SELECT s.roll_no, s.student_name
    FROM enrollments e
    JOIN students s ON e.student_rollno = s.roll_no
    WHERE \
    GROUP BY s.roll_no, s.student_name
    ORDER BY \
    LIMIT \
";
\ = \->prepare(\);
\->execute(\);
\ = \->fetchAll(PDO::FETCH_ASSOC);

echo 'COUNT: ' . count(\) . PHP_EOL;
if (count(\) > 0) {
    echo 'FIRST: ' . \[0]['roll_no'] . PHP_EOL;
    echo 'LAST: ' . end(\)['roll_no'] . PHP_EOL;
}
