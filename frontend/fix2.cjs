const fs = require("fs");
let code = fs.readFileSync("src/components/faculty/FacultyStudents.tsx", "utf8");
code = code.replace(/const data = await facultyApi\.getEnrolledStudents\(\);/,
  "const response = await facultyApi.getEnrolledStudents({ limit: 1000 });\n                        const data = response.data;");
fs.writeFileSync("src/components/faculty/FacultyStudents.tsx", code);
