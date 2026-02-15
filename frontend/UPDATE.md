## Plan: Frontend v3.0 Role-Assignment Upgrade

**TL;DR** — The backend now uses 3 fixed roles (`admin`, `faculty`, `staff`) with dynamic `is_hod`/`is_dean` boolean flags instead of 5 ENUM roles. The frontend is currently broken: login redirects, dashboard guards, role badges, faculty dropdowns, user creation forms, and the Dean's HOD appointment flow all check for `role === "hod"` or `role === "dean"` which will never match in v3. Additionally, new admin features (School Management, Dean Appointment) have no UI yet. This plan covers every change needed across ~20 files.

---

**Steps**

### Step 1: Update TypeScript Types (types.ts)

1. Add `is_hod`, `is_dean`, `hod_department_id`, `school_id` fields to the `User` interface (L8-16)
2. Change `CreateUserRequest.role` (L251) from `"admin" | "dean" | "hod" | "faculty" | "staff"` to `"admin" | "faculty" | "staff"`
3. Add `is_hod?: boolean` field to `DepartmentFaculty` interface (L313) so faculty lists can annotate HODs
4. Add `is_hod?: boolean`, `is_dean?: boolean` fields to `DeanUser` interface for the Dean's user list
5. Update `DeanStats.usersByRole` (L416-420) — remove `hod` key, keep `faculty` and `staff`
6. Add new types: `School` interface, `CreateSchoolRequest`, `AppointDeanRequest`, `AppointHODRequest` (with `appointment_order` field)
7. Add `school_id` to `CreateDepartmentRequest` since departments now belong to schools

### Step 2: Update API Service Layer

**A. auth.ts** — Verify the login response stores all new fields. The current code stores `data.data.user` as-is; as long as the `User` type is updated, this should work transparently. No code change likely needed, but verify the response path matches.

**B. admin.ts** — Add new methods:

- `getSchools()` → `GET /admin/schools`
- `createSchool(data)` → `POST /admin/schools`
- `appointDean(schoolId, data)` → `POST /admin/schools/{schoolId}/dean`
- `demoteDean(employeeId)` → `DELETE /admin/dean/{employeeId}`

**C. dean.ts** — Update `appointHOD()` signature (L49-62) to require `appointment_order` field in both "promote" and "create" scenarios.

**D. index.ts** — Export new types and verify new admin methods are wired through `apiService`.

### Step 3: Fix Login Redirect Logic (LoginPage.tsx L28-41)

Replace the current role-switch with priority-based flag checks:

1. `user.role === "admin"` → `/dashboard`
2. `user.is_dean === true` → `/dean`
3. `user.is_hod === true` → `/hod`
4. `user.role === "faculty"` → `/faculty`
5. `user.role === "staff"` → `/staff`

Dean check must come before HOD check (a user could theoretically be both, dean takes priority).

### Step 4: Fix Dashboard Access Guards (5 files)

**A. AdminDashboard.tsx L77-85** — Keep `role !== "admin"` guard. Update redirect fallback logic: remove `role === "hod"`, add `is_dean`/`is_hod` flag checks for redirects.

**B. DeanDashboard.tsx L93-101** — Change `storedUser.role !== "dean"` to `!storedUser.is_dean`. Update redirect logic to remove `role === "hod"`.

**C. HODDashboard.tsx L80-88** — Change `storedUser.role !== "hod"` to `!storedUser.is_hod`. Remove `role === "hod"` fallback.

**D. FacultyDashboard.tsx L61-71** — Change guard to `role !== "faculty"` only (HODs have `role: "faculty"` so they pass naturally). Remove dead `role === "dean"` redirect.

**E. StaffDashboard.tsx L47-51** — Keep `role !== "staff"` guard. Remove dead `role === "hod"` redirect.

### Step 5: Create Shared `getRoleBadgeColor` Utility

Create a single, authoritative badge utility that handles the new model. Update it to accept an optional `is_hod`/`is_dean` context, or always display the base role + a secondary flag badge:

**Update shared/DataTableView.tsx L215-233:**

- Keep `admin`, `faculty`, `staff` badge colors
- Remove `dean` and `hod` as role colors
- Add a new `StatusBadge` component for rendering `is_hod`/`is_dean` as separate indicator badges (e.g., purple "HOD" pill, gold "Dean" pill) alongside the role badge

This shared utility will be consumed by all views that render user lists.

### Step 6: Update Admin Dashboard Components

**A. admin/UsersView.tsx:**

- L62-76: Update `getRoleBadgeColor()` — remove `"dean"` and `"hod"` cases
- L193-201: Remove `"dean"` and `"hod"` from role `<select>` dropdown — only show `admin`, `faculty`, `staff`
- L348-351: Add secondary badge rendering for users who have `is_hod` or `is_dean` flags (requires the API to return these flags on user list items)

**B. Create new component: `admin/SchoolsView.tsx`** — New UI for:

- Listing all schools (`GET /admin/schools`)
- Creating a new school (`POST /admin/schools`)
- Showing current Dean per school
- "Appoint Dean" action (dialog with employee selection + `appointment_order` input)
- "Demote Dean" action (`DELETE /admin/dean/{employeeId}`)

**C. AdminDashboard.tsx L36-42** — Add "Schools" nav item to `adminNavItems` array, wire it to the new `SchoolsView` component.

**D. admin/index.ts** — Export the new `SchoolsView` component.

### Step 7: Update Dean Dashboard Components

**A. dean/HODManagement.tsx L153-170:**

- Add `appointment_order` text input to the "Appoint HOD" dialog (both promote and create flows)
- Include `appointment_order` in the `deanApi.appointHOD()` call payload

**B. dean/UsersView.tsx:**

- L29-41: Update `getRoleBadgeColor` — remove `"dean"` and `"hod"` cases, add flag-based secondary badges
- L103-109: Update role filter dropdown — remove `"dean"` and `"hod"` options. Optionally add filter checkboxes for "HOD Only" / "Dean Only" using `is_hod`/`is_dean` flags

**C. dean/DeanStatsCards.tsx L85:**

- Remove `stats.usersByRole?.hod` stat card (API no longer returns HOD count as a role)
- Alternatively, if the API starts returning an `hod_count` separately, wire that up

### Step 8: Update HOD Dashboard Components

**A. hod/FacultyManagement.tsx:**

- L206: Change `case "hod"` to check `member.is_hod === true` for badge rendering
- L231: Change `f.role === "faculty" || f.role === "hod"` to just `f.role === "faculty"` (HODs are faculty now) or keep the filter checking `is_hod` for display purposes
- L449: Change `member.role !== "hod"` to `!member.is_hod` for hiding edit/delete on HOD users

**B. hod/CoursesManagement.tsx:**

- L299-300: Change faculty filter from `f.role === "faculty" || f.role === "hod"` to `f.role === "faculty"` (which now includes HODs)
- L310: Change `f.role === "hod" ? "(HOD)" : ""` to `f.is_hod ? "(HOD)" : ""`
- L604-605, L613: Same changes in the edit dialog

### Step 9: Update Staff Dashboard Components

**staff/CourseManagement.tsx:**

- L336-337: Change faculty filter from `f.role === "faculty" || f.role === "hod"` to `f.role === "faculty"`
- L345: Change `f.role === "hod" ? "(HOD)" : ""` to `f.is_hod ? "(HOD)" : ""`
- L642-643, L651: Same changes in the edit dialog

### Step 10: Update Layout & Sidebar

**layout/AppSidebar.tsx L62:**

- Add logic so that when `user.is_hod` is true, the subtitle shows "Head of Department" instead of the raw role string "faculty"
- When `user.is_dean` is true, show "Dean" as the subtitle

### Step 11: Backend API Compatibility Check

Verify the backend `/hod/faculty` and `/dean/departments/{id}/faculty` endpoints return `is_hod` (and optionally `is_dean`) fields on each user object. If not, update the backend `DepartmentFaculty` model/query to include these flags before the frontend can render them. This is a **hard dependency** — the `(HOD)` labels in faculty dropdowns across 3 components rely on this data.

### Step 12: Update Documentation

- Update COMPONENT_ARCHITECTURE.md version to 3.0, add `SchoolsView` to the admin component tree, note the new role-flag model
- Update the footer of API_REFERENCE.md — change version to 3.0 and update the "last updated" date

---

**Verification**

1. **Login flow**: Log in as admin, faculty, staff, HOD (faculty+is_hod), Dean (faculty+is_dean) — verify each lands on the correct dashboard
2. **Dashboard guards**: Manually navigate to `/hod` as a plain faculty user — verify redirect to `/faculty`
3. **Admin Users View**: Create a user — verify only `admin`, `faculty`, `staff` roles are available in the dropdown
4. **Admin Schools View**: Create a school, appoint a Dean, demote a Dean — verify API round-trip
5. **Dean HOD Management**: Appoint an HOD with `appointment_order` field — verify the API accepts it
6. **Faculty Dropdowns**: In HOD Courses, Staff Courses — verify the "(HOD)" label appears next to the correct user
7. **Role Badges**: Across all user tables (Admin, Dean, HOD) — verify no orphaned "HOD"/"Dean" role badges; instead show base role + flag indicator

**Decisions**

- **Redirect priority**: Dean > HOD > base role (since a user could theoretically hold both flags)
- **Badge approach**: Show base role badge + separate flag indicator rather than a combined badge — this makes the 3-role model explicit
- **Backend dependency**: Step 11 (verifying `is_hod` in faculty API responses) must be confirmed before Steps 8-9 can be fully implemented. If the backend does not return this flag on list endpoints, a small backend patch is needed first.
