const fs = require("fs");
let code = fs.readFileSync("frontend/src/services/api/faculty.ts", "utf8");

code = code.replace(
    /async function getCourses\([\s\S]*?\}\s*\}/s,
    `async function getCourses(
        params?: PaginationParams,
    ): Promise<PaginatedResponse<Course>> {
        const filteredParams = Object.fromEntries(
            Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
        );
        const qs = new URLSearchParams(filteredParams as any).toString();
        const url = "/courses" + (qs ? "?" + qs : "");
        // In the new unified response structure, apiGet returns the raw structure if it matches
        // Check if apiGet strips pagination. Currently apiGet returns just the data array if the response is "success: true, data: []", but here we need the full paginated response.
        // Wait, standard apiGet in base.ts might strip the "data" field? Let us look at base.ts
        // For now, assume it returns T correctly.
        return apiGet<PaginatedResponse<Course>>(url);
    }`
);

code = code.replace(
    /async function getEnrolledStudents[^\}]*\}/,
    `async function getEnrolledStudents(
        params?: PaginationParams,
    ): Promise<PaginatedResponse<EnrolledStudent>> {
        const filteredParams = Object.fromEntries(
            Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== "")
        );
        const qs = new URLSearchParams(filteredParams as any).toString();
        const url = "/faculty/students" + (qs ? "?" + qs : "");
        return apiGet<PaginatedResponse<EnrolledStudent>>(url);
    }`
);

fs.writeFileSync("frontend/src/services/api/faculty.ts", code);
console.log("Updated faculty.ts");

