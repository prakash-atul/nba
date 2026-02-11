# NBA System - Component Architecture

## Application Architecture

### Routing Structure

```
App.tsx (BrowserRouter)
├── /login → LoginPage
├── /dashboard → AdminDashboard
├── /dean → DeanDashboard
├── /hod → HODDashboard
├── /staff → StaffDashboard
├── /faculty → FacultyDashboard
├── / → Navigate to /login
└── * → Navigate to /login
```

## Component Hierarchy

```
App.tsx (Root)
├── BrowserRouter
│   └── Routes
│       ├── LoginPage (/login)
│       │   ├── LoginHero (Animated visual side)
│       │   └── LoginForm (Email/Password + Validation)
│       │
│       ├── AdminDashboard (/dashboard)
│       │   ├── Sidebar (AppSidebar)
│       │   └── Main Content
│       │       ├── Header (AppHeader)
│       │       ├── StatsCards (Admin variant)
│       │       ├── QuickAccessCards (Admin variant)
│       │       └── Views (Users, Departments, Courses, Students, Tests)
│       │
│       ├── DeanDashboard (/dean)
│       │   ├── Sidebar
│       │   └── Main Content
│       │       ├── Header
│       │       ├── DeanStatsCards (6 focused cards)
│       │       ├── DeanQuickAccess
│       │       └── Views (Departments, Users, Courses, Students, Tests, Analytics)
│       │
│       ├── HODDashboard (/hod)
│       │   ├── Sidebar
│       │   └── Main Content
│       │       ├── Header
│       │       ├── HODStatsCards
│       │       ├── HODQuickAccess
│       │       └── Views (Courses Management, Faculty Management)
│       │
│       ├── StaffDashboard (/staff)
│       │   ├── Sidebar
│       │   └── Main Content
│       │       ├── Header
│       │       ├── StaffStatsCards
│       │       ├── StaffQuickAccess
│       │       └── Views (Courses Management, Enrollment Management)
│       │
│       └── FacultyDashboard (/faculty)
│           ├── Sidebar
│           └── Main Content
│               ├── Header
│               ├── FacultyStatsCards
│               ├── FacultyQuickAccess
│               └── Views (My Courses, Assessments, Marks Entry, CO-PO Mapping)
```

## Specialized Feature Modules

### 1. Assessment Management (`src/components/assessments/`)

- **Purpose**: Handles the complex workflow of creating and managing tests.
- **Key Components**:
    - `CreateAssessmentForm`: Multi-step form for test configuration.
    - `QuestionsTable`: Dynamic table for adding/editing test questions with CO mapping.
    - `CSVFileUpload`: Bulk student enrollment via Excel/CSV.
    - `ViewAssessmentDialog`: Summary view of test details and breakdown.

### 2. Marks Entry System (`src/components/marks/`)

- **Purpose**: High-performance data entry for student marks.
- **Key Components**:
    - `BulkMarksTable`: Spreadsheet-like interface for rapid marks entry.
    - `MarksEntrySelector`: Logic for switching between entry by Question or by CO.
    - `TestInfoCard`: Contextual display of test metadata during grading.

### 3. CO-PO Mapping & Attainment (`src/components/copo/`)

- **Purpose**: Calculates and visualizes NBA outcome attainments.
- **Key Components**:
    - `COPOMatrixTable`: Grid for mapping Course Outcomes to Program Outcomes.
    - `COAttainmentTable`: Visual calculation of Direct/Indirect attainment percentages.
    - `AttainmentSettingsPanel`: Configuration for target levels and criteria.

## Shared Component Library

### 1. StatsCard Component (`src/components/shared/StatsCard.tsx`)

**Props**:

```typescript
{
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'gradient' | 'solid' | 'outline';
  suffix?: string;  // e.g., "%"
}
```

### 2. DataTableView Component (`src/components/shared/DataTableView.tsx`)

**Purpose**: Generic data table with built-in search, loading states, and action buttons (Edit/Delete).

### 3. QuickAccessCard Component (`src/components/shared/QuickAccessCard.tsx`)

**Purpose**: Dashboard shortcut buttons with icon and description.

## State & Data Flow

### 1. Server State (TanStack Query)

- **Queries**: Used for all `GET` requests (e.g., `['courses']`, `['stats']`).
- **Mutations**: Used for `POST`, `PUT`, `DELETE` operations with automatic cache invalidation.

```typescript
const { data } = useQuery({
	queryKey: ["adminStats"],
	queryFn: adminApi.getStats,
});
```

### 2. API Service Layer (`src/services/api/`)

- **Modular Design**: Each role (Admin, Faculty, HOD) has its own dedicated service file.
- **Base Config**: `src/services/api.ts` handles Axios instance and JWT interceptors.

### 3. Authentication Flow

- **Storage**: JWT stored in `localStorage`.
- **Validation**: `App.tsx` checks token existence on mount.
- **Interceptors**: Automatically adds `Authorization: Bearer <token>` to every request.

## UI/UX Technology Stack

### ShadCN UI Components

Utilized for base UI elements: `Button`, `Dialog`, `Select`, `Table`, `Tabs`, `Toast`, `Skeleton`.

### Magic UI Components

Enhanced animations: `NumberTicker` (for stats), `DotPattern` (backgrounds), `ThemeToggler`.

### Styling System

- **Tailwind CSS**: Utility-first styling with custom theme colors.
- **Responsive**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` patterns used throughout.
- **Dark Mode**: Fully supported via `theme-provider.tsx` and class-based toggling.

## Project Structure

```
frontend/
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── admin/             # Administrator specific views
│   │   ├── assessments/       # Test creation and management
│   │   ├── copo/              # CO-PO attainment logic
│   │   ├── faculty/           # Faculty dashboard views
│   │   ├── layout/            # Sidebar, Header, etc.
│   │   ├── marks/             # Grading and marks entry
│   │   ├── shared/            # Common UI patterns
│   │   └── ui/                # Base ShadCN primitives
│   ├── pages/                 # Full-page route components
│   │   ├── AdminDashboard.tsx
│   │   ├── LoginPage.tsx
│   │   └── ...
│   ├── services/              # API and auth logic
│   │   ├── api.ts             # Axios configuration
│   │   └── api/               # API modules (auth, admin, etc.)
│   ├── lib/                   # Utilities and Excel parsers
│   └── main.tsx               # Entry point
├── package.json
└── tsconfig.json
```

---

**Version**: 2.1  
**Last Updated**: February 11, 2026  
**Status**: Updated with Assessment, Marks, and CO-PO module details.
