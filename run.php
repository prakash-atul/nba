<?php
require "api/models/User.php";
require "api/utils/JWTService.php";
$j = new JWTService();
$user = new User(3101, "faculty_user", null, null, "faculty");
echo $j->generateToken($user);

