# CO-PO Mapping Component Architecture

## Overview

This folder contains the refactored CO-PO (Course Outcome - Program Outcome) mapping system, extracted from a monolithic 2136-line component into maintainable, logical smaller components.

## Component Structure

```
copo/
├── types.ts                      # TypeScript type definitions
├── utils.ts                      # Pure utility functions
├── COPOMapping.tsx               # Main orchestrator component (~400 lines)
├── AttainmentSettingsPanel.tsx   # Settings configuration UI (~300 lines)
├── AttainmentCriteriaCard.tsx    # Criteria display component (~40 lines)
├── PassingMarksCard.tsx          # Threshold display component (~40 lines)
├── StudentMarksTable.tsx         # Student marks table with multi-row headers (~280 lines)
├── COAttainmentTable.tsx         # CO attainment tables (3.0 & Absolute scales) (~330 lines)
├── COPOMatrixTable.tsx           # CO-PO-PSO mapping matrix table (~170 lines)
└── index.ts                      # Barrel exports
```

## Component Responsibilities

### `types.ts`

Shared TypeScript interfaces:

-   `StudentMarks` - Student data structure with test marks and CO totals
-   `AttainmentThreshold` - Attainment level threshold definition
-   `AttainmentCriteria` - Formatted attainment criteria for display
-   `AttainmentData` - Statistical data for CO attainment calculations
-   `COPOMatrixState` - 6×15 CO-PO-PSO mapping matrix structure

### `utils.ts`

Pure utility functions:

-   `getLevelColor(level, maxLevel)` - Returns dynamic color classes (green→red gradient)
-   `getPercentageColor(percentage, getAttainmentLevel, maxLevel)` - Color based on attainment level
-   `formatCriteriaRange(minPct, maxPct)` - Formats percentage range strings
-   `getAttainmentCriteria(thresholds, zeroLevel)` - Generates criteria array from thresholds
-   `getAttainmentLevel(percentage, thresholds, zeroLevel)` - Core attainment calculation logic

### `COPOMapping.tsx` (Main Component)

The orchestrator component that:

-   Manages all state (thresholds, matrix, student data)
-   Loads data from API (`loadCOPOData`)
-   Coordinates child components via props
-   Handles threshold management (add, update, remove, save)
-   Calculates CO attainment and PO/PSO attainment
-   Provides helper function wrappers for child components

**Props Interface:**

```typescript
interface COPOMappingProps {
	courseCode: string;
	courseName: string;
	courseId: number;
	facultyName: string;
	departmentName: string;
	year: number;
	semester: number;
}
```

### `AttainmentSettingsPanel.tsx`

Complete settings configuration UI:

-   Zero Level threshold input (Level 0 criteria)
-   CO Attainment threshold input
-   Student Passing threshold input
-   Visual bar with dynamic green→red sections (reversed: high→low)
-   Horizontal pill-shaped threshold inputs with badges
-   Add/remove/update threshold functionality
-   Validation and save handling

**Props:** 11 props including thresholds, setters, and handlers

### `AttainmentCriteriaCard.tsx`

Simple display component:

-   Shows sorted attainment criteria badges
-   Color-coded by level (green to red)
-   Uses `formatCriteriaRange` utility

### `PassingMarksCard.tsx`

Simple display component:

-   Two-column grid layout
-   CO Attainment threshold (green border)
-   Student Passing threshold (blue border)

### `StudentMarksTable.tsx`

Complex table with:

-   University/course information header
-   4-row table header structure:
    1. Assessment names
    2. Maximum marks per assessment
    3. CO columns (CO1-CO6)
    4. CO-wise maximum marks
-   Student rows with test marks for each CO
-   CO total percentages with color coding
-   Loading and empty states

### `COAttainmentTable.tsx`

Two complete attainment tables:

1. **3.0 Point Scale Table:**

    - Absentee/Present student counts
    - Students above CO threshold
    - Percentage above threshold
    - Attainment level (based on criteria)
    - Final attainment level

2. **Absolute Scale Table:**
    - Absentee/Present student counts
    - Students above passing marks
    - Percentage above passing marks
    - Average percentage attainment
    - Final attainment (absolute scale)

### `COPOMatrixTable.tsx`

Editable CO-PO-PSO mapping matrix:

-   Header with university/course information
-   6 CO rows × (12 POs + 3 PSOs) = 90 editable input fields
-   Mapping scale: 0=None, 1=Low, 2=Medium, 3=High
-   Footer row with calculated PO/PSO attainment percentages
-   Color-coded attainment cells
-   Help text with formula explanation

## Key Features

### Attainment Calculation

-   **Formula:** `PO/PSO Attainment = Σ(COi × POk / attainment_points_scale) / m`
-   **Zero Level Threshold:** Explicit Level 0 criteria (default 40%)
-   **Dynamic Levels:** User-configurable attainment thresholds
-   **Color Gradient:** Green (highest) → Lime → Yellow → Orange → Red (Level 0)

### Visual Enhancements

-   **Reversed Bar:** Highest level on left, Level 0 on right
-   **Pill-shaped Inputs:** Compact horizontal threshold configuration
-   **Multi-row Headers:** Complex table structures with rowspan/colspan
-   **Color-coded Cells:** Dynamic coloring based on attainment levels

### State Management

-   All state managed in main `COPOMapping` component
-   Props drilling for child components
-   No context API needed (appropriate for component size)
-   Type-safe prop interfaces

## Usage

```typescript
import { COPOMapping } from "@/components/copo";

<COPOMapping
	courseCode="CS101"
	courseName="Introduction to Programming"
	courseId={1}
	facultyName="Faculty of Engineering"
	departmentName="Computer Science"
	year={1}
	semester={1}
/>;
```

## Data Flow

```
COPOMapping (Main)
├── loadCOPOData() → Fetches from API
├── State: thresholds, matrix, studentData
│
├─→ AttainmentSettingsPanel
│   └── Props: thresholds, handlers
│
├─→ AttainmentCriteriaCard
│   └── Props: criteria, colorFn
│
├─→ PassingMarksCard
│   └── Props: coThreshold, passingThreshold
│
├─→ StudentMarksTable
│   └── Props: studentsData, maxMarks, courseInfo, loading
│
├─→ COAttainmentTable
│   └── Props: attainmentData, getLevel, getColor
│
└─→ COPOMatrixTable
    └── Props: matrix, courseInfo, updateFn, calculateFn
```

## Refactoring Benefits

1. **Maintainability:** Components are 40-330 lines (vs 2136 original)
2. **Testability:** Pure functions in utils.ts are easy to unit test
3. **Reusability:** Display cards can be used in other contexts
4. **Readability:** Clear separation of concerns
5. **Type Safety:** All components have proper TypeScript interfaces
6. **Performance:** No bundle size increase (636 kB maintained)

## Migration from Original

**Before:**

```typescript
import { COPOMapping } from "@/components/assessments/COPOMapping";
```

**After:**

```typescript
import { COPOMapping } from "@/components/copo";
```

All functionality preserved - no breaking changes to API.

## Future Enhancements

-   [ ] Add unit tests for utility functions
-   [ ] Add component tests with React Testing Library
-   [ ] Extract data loading to custom hook (`useCOPOData`)
-   [ ] Implement localStorage persistence for matrix values
-   [ ] Add export/import functionality for settings
-   [ ] Create Storybook stories for components
-   [ ] Add loading states and error boundaries
-   [ ] Optimize re-renders with React.memo if needed
-   [ ] Consider moving to Context API if component tree deepens

## Technical Notes

-   **TypeScript:** Strict mode enabled, type-only imports for types
-   **Tailwind CSS:** All styling via utility classes
-   **ShadCn UI:** Component library (Card, Table, Input, Button, Badge)
-   **Lucide React:** Icon library (Settings, Plus, Trash2, Save)
-   **Build Size:** 636.73 kB (192.56 kB gzipped)

## Troubleshooting

**Issue:** Type import errors

-   **Solution:** Use `import type { ... }` for type-only imports

**Issue:** Props type mismatch

-   **Solution:** Check interface definitions in types.ts

**Issue:** Color classes not working

-   **Solution:** Ensure Tailwind includes dynamic color classes in safelist

**Issue:** Table not rendering correctly

-   **Solution:** Check that courseInfo/maxMarks data is properly formatted
