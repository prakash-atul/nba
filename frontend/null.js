const fs = require('fs');
const file = 'c:/xampp/htdocs/nba-met4l/frontend/src/features/users/StudentList.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStart = content.indexOf('{/* Filters */}');

let newFilters = {/* Filters */}
<div className="flex gap-4 flex-wrap items-end border-t pt-4">
<div className="flex-1 min-w-[200px]">
<label className="text-sm font-medium">
Search
</label>
<Input
placeholder="Search by name or roll number..."
value={search}
onChange={(e) => setSearch(e.target.value)}
disabled={isLoading}
/>
</div>

{availableFilters.includes("batch") && (
<div className="flex-1 min-w-[150px]">
<label className="text-sm font-medium">
Batch
</label>
<Input
placeholder="Filter by batch year..."
value={batchInput}
onChange={(e) =>
setBatchInput(e.target.value)
}
disabled={isLoading}
type="number"
/>
</div>
)}

{availableFilters.includes("status") && (
<div className="flex-1 min-w-[150px]">
<label className="text-sm font-medium">
Status
</label>
<Select
value={statusFilter}
onValueChange={setStatusFilter}
disabled={isLoading}
>
<SelectTrigger>
<SelectValue />
</SelectTrigger>
<SelectContent>
<SelectItem value="all">
All Statuses
</SelectItem>
{STATUS_OPTIONS.map((s) => (
<SelectItem key={s} value={s}>
{s}
</SelectItem>
))}
</SelectContent>
</Select>
</div>
)}

{availableFilters.includes("department") &&
permissions.allowDepartmentFilter && (
<div className="flex-1 min-w-[150px]">
<label className="text-sm font-medium">
Department Filter
</label>
<Input
placeholder="Dept ID..."
value={departmentFilter}
onChange={(e) =>
setDepartmentFilter(e.target.value)
}
disabled={isLoading}
/>
</div>
)}

{availableFilters.includes("course") && (
<div className="flex-1 min-w-[150px]">
<label className="text-sm font-medium">
Course Filter
</label>
<Input
placeholder="Course Code..."
value={courseFilter}
onChange={(e) => {
setCourseFilter(e.target.value);
setFilter("course_code", e.target.value || undefined);
}}
disabled={isLoading}
/>
</div>
)}

{hasFilters && (
<Button
variant="ghost"
size="sm"
onClick={() => {
setSearch("");
setBatchInput("");
setStatusFilter("all");
setDepartmentFilter("all");
setCourseFilter("");
setFilter("department_id", undefined);
setFilter("batch_year", undefined);
setFilter("student_status", undefined);
setFilter("course_code", undefined);
}}
disabled={isLoading}
>
<X className="h-4 w-4 mr-1" />
Clear
</Button>
)}
</div>;

let chunkStart = content.indexOf('{/* Filters */}');
let chunkEnd = content.indexOf('<CardContent>');
let before = content.substring(0, chunkStart).trim();
// clean up the ending of before that closes the hideHeader div and opens the Card
before = before.replace(/<\/div>\s*}\)\s*<Card>\s*<CardHeader>\s*<CardTitle className="flex items-center gap-2">\s*<GraduationCap className="h-5 w-5" \/>\s*Student List\s*<\/CardTitle>\s*<\/CardHeader>/m, '');
// wait, the original before string has:
// {onRefresh && ( ... )}
// </div>
// )}
//
// <Card> ... </CardHeader>
// I can just replace the whole section from {/* Filters */} down to </CardContent> by doing a more exact string replacement.
