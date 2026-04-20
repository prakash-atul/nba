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
echo "P1 next_cursor: $cursor \n";

curl_setopt($ch, CURLOPT_URL, "http://localhost/nba-met4l/api/faculty/students?limit=20&sort=-s.enrollment_date&cursor=" . urlencode($cursor));
$res2 = json_decode(curl_exec($ch), true);
$c2 = $res2["pagination"]["next_cursor"];
echo "P2 next_cursor: $c2 \n";
echo "P2 has_more: " . ($res2["pagination"]["has_more"] ? "true" : "false") . "\n";
echo "P2 limit: " . $res2["pagination"]["limit"] . "  return count: " . count($res2["data"]) . "\n";

