<?php
require "api/config/DatabaseConfig.php";
$db = (new DatabaseConfig())->getConnection();
$stmt = $db->query("SELECT s.roll_no FROM enrollments e JOIN students s ON e.student_rollno = s.roll_no JOIN course_offerings co ON e.offering_id = co.offering_id GROUP BY s.roll_no ORDER BY s.roll_no ASC");
$res = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "Total: " . count($res) . "\n";
echo "First 20:\n"; print_r(array_slice($res, 0, 20));
echo "index 19 (cursor for page 2): " . $res[19] . "\n";
$stmt2 = $db->prepare("SELECT s.roll_no FROM enrollments e JOIN students s ON e.student_rollno = s.roll_no JOIN course_offerings co ON e.offering_id = co.offering_id WHERE s.roll_no > ? GROUP BY s.roll_no ORDER BY s.roll_no ASC");
$stmt2->execute([$res[19]]);
$res2 = $stmt2->fetchAll(PDO::FETCH_COLUMN);
echo "Count after index 19: " . count($res2) . "\n";

