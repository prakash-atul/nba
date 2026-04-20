const fs = require("fs");
let code = fs.readFileSync("frontend/src/pages/faculty/FacultyStudentsPage.tsx", "utf8");

code = code.replace(
    /fetchFn=\{async \(\) => {[\s\S]*?return \{[\s\S]*?\};[\s]*\}\}/,
    `fetchFn={facultyApi.getEnrolledStudents}`
);
code = code.replace(
    /paginationMode="client"/,
    `paginationMode="server"`
);

fs.writeFileSync("frontend/src/pages/faculty/FacultyStudentsPage.tsx", code);
console.log("Updated FacultyStudentsPage.tsx");

