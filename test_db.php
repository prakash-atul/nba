<?php
require "api/config/DatabaseConfig.php";
$db = (new DatabaseConfig())->getConnection();
$stmt = $db->query("DESCRIBE enrollments");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

