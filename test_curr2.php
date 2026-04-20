<?php
require "api/models/User.php";
require "api/utils/JWTService.php";
$j = new JWTService();
$user = new User(3101, "faculty", null, null, "faculty");
$token = trim($j->generateToken($user));
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost/nba-met4l/api/faculty/students?limit=20&sort=-s.enrollment_date");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);
$res1 = json_decode(curl_exec($ch), true);

$cursor = $res1["pagination"]["next_cursor"];
print_r(array_map(function($r){return $r["roll_no"];}, $res1["data"]));

curl_setopt($ch, CURLOPT_URL, "http://localhost/nba-met4l/api/faculty/students?limit=20&sort=-s.enrollment_date&cursor=" . urlencode($cursor));
$res2 = json_decode(curl_exec($ch), true);
print_r(array_map(function($r){return $r["roll_no"];}, $res2["data"]));

