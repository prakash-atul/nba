const fs = require("fs");
let code = fs.readFileSync("frontend/src/services/api/faculty.ts", "utf8");

// Update imports
if (!code.includes("apiGetPaginated")) {
    code = code.replace(/import { apiGet, apiPut, apiDelete, apiPost } from "\.\/base";/, 
        `import { apiGet, apiPut, apiDelete, apiPost, apiGetPaginated } from "./base";`);
}

code = code.replace(
    /async function getCourses\([\s\S]*?\([\s\S]*?\}[^}]*\}/,
    `async function getCourses(
    params?: PaginationParams,
): Promise<PaginatedResponse<Course>> {
    return apiGetPaginated<Course>("/courses", params as any);
}`
);

code = code.replace(
    /async function getEnrolledStudents[\s\S]*?\([\s\S]*?\}[\s]*\}/,
    `async function getEnrolledStudents(
    params?: PaginationParams,
): Promise<PaginatedResponse<EnrolledStudent>> {
    return apiGetPaginated<EnrolledStudent>("/faculty/students", params as any);
}`
);

fs.writeFileSync("frontend/src/services/api/faculty.ts", code);
console.log("Updated faculty.ts again");

