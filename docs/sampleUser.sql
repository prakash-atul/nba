-- =============================================
-- SAMPLE DATA
-- =============================================
-- Departments
INSERT INTO `departments` (`department_name`, `department_code`)
VALUES ('Computer Science & Engineering', 'CSE'),
    ('Electronics & Communication Engineering', 'ECE'),
    ('Electrical Engineering', 'EE'),
    ('Mechanical Engineering', 'ME'),
    ('Civil Engineering', 'CE'),
    ('Food Engineering & Technology', 'FET'),
    ('Energy', 'ENE');
-- Admin (password: password123)
INSERT INTO `users`
VALUES (
        1001,
        'Admin One',
        'admin_01@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'admin',
        NULL
    );
-- HODs (password: password123)
INSERT INTO `users`
VALUES (
        2001,
        'HOD CSE',
        'hod_cse@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'hod',
        1
    ),
    (
        2002,
        'HOD ECE',
        'hod_ece@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'hod',
        2
    ),
    (
        2003,
        'HOD ME',
        'hod_me@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'hod',
        4
    ),
    (
        2004,
        'HOD CE',
        'hod_ce@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'hod',
        5
    ),
    (
        2005,
        'HOD FET',
        'hod_fet@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'hod',
        6
    );
-- Faculty (password: password123)
INSERT INTO `users`
VALUES (
        3001,
        'Faculty One',
        'faculty_01@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3002,
        'Faculty Two',
        'faculty_02@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3003,
        'Faculty Three',
        'faculty_03@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3004,
        'Faculty Four',
        'faculty_04@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        1
    ),
    (
        3005,
        'Faculty Five',
        'faculty_05@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        2
    ),
    (
        3006,
        'Faculty Six',
        'faculty_06@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        2
    ),
    (
        3007,
        'Faculty Seven',
        'faculty_07@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        4
    ),
    (
        3008,
        'Faculty Eight',
        'faculty_08@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        4
    ),
    (
        3009,
        'Faculty Nine',
        'faculty_09@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        4
    ),
    (
        3010,
        'Faculty Ten',
        'faculty_10@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        5
    ),
    (
        3011,
        'Faculty Eleven',
        'faculty_11@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        5
    ),
    (
        3012,
        'Faculty Twelve',
        'faculty_12@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        6
    ),
    (
        3013,
        'Faculty Thirteen',
        'faculty_13@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        6
    ),
    (
        3014,
        'Faculty Fourteen',
        'faculty_14@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        7
    ),
    (
        3015,
        'Faculty Fifteen',
        'faculty_15@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'faculty',
        7
    );
-- Staff (assigned to departments for enrollment management)
INSERT INTO `users`
VALUES (
        4001,
        'Staff One',
        'staff_01@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'staff',
        1
    ),
    (
        4002,
        'Staff Two',
        'staff_02@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'staff',
        2
    ),
    (
        4003,
        'Staff Three',
        'staff_03@tezu.ac.in',
        '$2y$10$nlejuSHfBoAun490JDUHCuB4ZudU/4YR7eSh0OGuCV50poRy1NGUe',
        'staff',
        4
    );