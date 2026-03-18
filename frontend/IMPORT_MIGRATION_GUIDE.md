# Import Migration Report: @/components/shared → @/features/shared

**Total Files to Update: 35**

## Files importing DataTable (23 files)

Update path from: `@/components/shared/DataTable` → `@/features/shared`

- src/components/faculty/FacultyOverview.tsx
- src/components/admin/StudentsView.tsx
- src/components/admin/UsersView.tsx
- src/features/users/StudentList.tsx
- src/features/courses/CourseList.tsx
- src/features/assessments/TestsList.tsx
- src/components/admin/DepartmentsView.tsx
- src/components/admin/TestsView.tsx
- src/components/admin/CoursesView.tsx
- src/components/staff/StaffEnrollmentView.tsx
- src/components/dean/UsersView.tsx
- src/components/staff/CourseManagement.tsx
- src/components/dean/TestsView.tsx
- src/components/dean/StudentsView.tsx
- src/components/faculty/FacultyStudents.tsx
- src/components/dean/HODManagement.tsx
- src/components/dean/DepartmentsView.tsx
- src/components/dean/CoursesView.tsx
- src/components/hod/HODStudents.tsx
- src/components/dean/AnalyticsView.tsx
- src/components/hod/CoursesManagement.tsx
- src/components/hod/FacultyManagement.tsx
- src/components/assessments/TestsList.tsx

### Example change:

```typescript
// BEFORE
import { DataTable } from "@/components/shared/DataTable";

// AFTER
import { DataTable } from "@/features/shared";
```

---

## Files importing EmptyState (2 files)

Update path from: `@/components/shared` → `@/features/shared`

- src/features/marks/EmptyStateCard.tsx
- src/components/marks/EmptyStateCard.tsx

### Example change:

```typescript
// BEFORE
import { EmptyState } from "@/components/shared";

// AFTER
import { EmptyState } from "@/features/shared";
```

---

## Files importing StatsGrid/StatItem (6 files)

Update path from: `@/components/shared` → `@/features/shared`

- src/components/admin/StatsCards.tsx
- src/components/staff/StatsStatsCards.tsx
- src/components/faculty/FacultyStatsCards.tsx
- src/components/dean/DeanStatsCards.tsx
- src/components/hod/HODStatsCards.tsx

### Example change:

```typescript
// BEFORE
import { StatsGrid, type StatItem } from "@/components/shared";

// AFTER
import { StatsGrid, type StatItem } from "@/features/shared";
```

---

## Files importing QuickAccessGrid/QuickAccessItem (5 files)

Update path from: `@/components/shared` → `@/features/shared`

- src/components/admin/QuickAccessCards.tsx
- src/components/staff/StaffQuickAccess.tsx
- src/components/faculty/FacultyQuickAccess.tsx
- src/components/hod/HODQuickAccess.tsx

### Example change:

```typescript
// BEFORE
import { QuickAccessGrid, type QuickAccessItem } from "@/components/shared";

// AFTER
import { QuickAccessGrid, type QuickAccessItem } from "@/features/shared";
```

---

## Setup for Batch Updates

### Option 1: Using Find & Replace All

1. Open Find & Replace (Ctrl+H)
2. For each import pattern, replace:
    - `import { DataTable } from "@/components/shared/DataTable"` → `import { DataTable } from "@/features/shared"`
    - `from "@/components/shared"` → `from "@/features/shared"` (for other components)

### Option 2: File List for Manual Review

See accompanying CSV file: `IMPORT_CHANGES_NEEDED.csv`

---

## Next Steps

1. Update all imports in the listed files
2. Run TypeScript compiler: `npx tsc --noEmit`
3. Verify no broken imports remain
4. Remove components/shared folder if it's no longer needed
