const fs = require("fs");
let t = fs.readFileSync(
	"c:/xampp/htdocs/nba-met4l/api/models/UserRepository.php",
	"utf8",
);
t = t.replace(
	/\$userData\['updated_at'\] \?\? null\s*\);/g,
	"$userData['updated_at'] ?? null,\n                    $userData['school_id'] ?? null\n                );",
);
fs.writeFileSync("c:/xampp/htdocs/nba-met4l/api/models/UserRepository.php", t);
