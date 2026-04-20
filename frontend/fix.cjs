const fs = require("fs");
let code = fs.readFileSync("src/services/api/faculty.ts", "utf8");
code = code.replace(/};\r?\n}/, "}");
fs.writeFileSync("src/services/api/faculty.ts", code);
