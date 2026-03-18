const fs = require('fs');
let code = fs.readFileSync('../api/models/CourseRepository.php', 'utf8');

code = code.replace(/if \(!empty\(\$params\['filters'\]\['semester'\]\)\) {\s+\$sql \.\= " AND co\.semester = \?";\s+\$bindings\[\] = \$params\['filters'\]\['semester'\];\s+}/g,
`if (!empty($params['filters']['semester'])) {
    if (strtolower(trim($params['filters']['semester'])) === 'autumn') {
        $sql .= " AND (co.semester % 2 != 0)";
    } elseif (strtolower(trim($params['filters']['semester'])) === 'spring') {
        $sql .= " AND (co.semester % 2 = 0)";
    } else {
        $sql .= " AND co.semester = ?";
        $bindings[] = $params['filters']['semester'];
    }
}`);

fs.writeFileSync('../api/models/CourseRepository.php', code);
