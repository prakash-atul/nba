# Survey Page Fixes

## Fix 1: Bar chart empty-state message
**File**: `frontend/src/components/faculty/FacultyCourseSurvey.tsx`  
**Lines**: 468-481

Wrap the existing bar rendering in a conditional. When `attainmentCoData` is empty, show a centered text message instead of an empty chart.

### Before (lines 468-481):
```tsx
<div className="flex justify-around items-end h-full z-10 w-full mt-auto">
    {[1, 2, 3, 4, 5, 6].map((coNum) => {
        const coData = attainmentCoData.find((c) => c.co_name === `CO${coNum}`);
        if (!coData) return null;
        const directPct = coData.attainment_percentage ?? 0;
        const indirectPct = coData.indirect_attainment_percentage ?? directPct;
        return (
            <div key={coNum} className="flex items-end gap-1 w-10">
                <div className="w-full bg-muted-foreground/30 rounded-t-sm" style={{ height: `${Math.round(directPct)}%` }} title={`CO${coNum} Direct: ${directPct.toFixed(1)}%`} />
                <div className="w-full bg-primary rounded-t-sm" style={{ height: `${Math.round(indirectPct)}%` }} title={`CO${coNum} Indirect: ${indirectPct.toFixed(1)}%`} />
            </div>
        );
    })}
</div>
```

### After:
```tsx
{attainmentCoData.length > 0 ? (
    <div className="flex justify-around items-end h-full z-10 w-full mt-auto">
        {[1, 2, 3, 4, 5, 6].map((coNum) => {
            const coData = attainmentCoData.find((c) => c.co_name === `CO${coNum}`);
            if (!coData) return null;
            const directPct = coData.attainment_percentage ?? 0;
            const indirectPct = coData.indirect_attainment_percentage ?? 0;
            return (
                <div key={coNum} className="flex items-end gap-1 w-10">
                    <div className="w-full bg-muted-foreground/30 rounded-t-sm" style={{ height: `${Math.round(directPct)}%` }} title={`CO${coNum} Direct: ${directPct.toFixed(1)}%`} />
                    <div className="w-full bg-primary rounded-t-sm" style={{ height: `${Math.round(indirectPct)}%` }} title={`CO${coNum} Indirect: ${indirectPct.toFixed(1)}%`} />
                </div>
            );
        })}
    </div>
) : (
    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
        No attainment data to display
    </div>
)}
```

### Diff summary:
- Wrap bar content in `{attainmentCoData.length > 0 ? (...bars...) : (...empty message...)}`
- Also fix the indirect fallback: `?? directPct` → `?? 0` (fixes issue 3 at the same time)

---

## Fix 2: Indirect column fallback in blended table
**File**: `frontend/src/components/faculty/FacultyCourseSurvey.tsx`  
**Line**: 434

### Before:
```tsx
const indirectVal = coData.indirect_attainment_level ?? coData.final_attainment_level ?? 0;
```

### After:
```tsx
const indirectVal = coData.indirect_attainment_level ?? 0;
```

When no survey data, `indirect_attainment_level` is null → shows 0 instead of leaking the direct value.

---

## Fix 3: Indirect fallback in bar chart
**File**: `frontend/src/components/faculty/FacultyCourseSurvey.tsx`  
**Line**: 473

(Handled by Fix 1 above — `?? directPct` → `?? 0`)

---

## Fix 4: Weighted Val. uses normalized_rating
**File**: `frontend/src/components/faculty/FacultyCourseSurvey.tsx`  
**Lines**: 538-539

### Before:
```tsx
const weightedVal = q.average_rating
    ? Number(q.average_rating) * Number(q.mapping_weight)
    : null;
```

### After:
```tsx
const weightedVal = q.normalized_rating !== null && q.normalized_rating !== undefined
    ? Number(q.normalized_rating) * Number(q.mapping_weight)
    : null;
```

---

## Fix 5: Remove 1-5 fallback in question avg display
**File**: `frontend/src/components/faculty/FacultyCourseSurvey.tsx`  
**Line**: 552

### Before:
```tsx
{q.normalized_rating !== null && q.normalized_rating !== undefined ? Number(q.normalized_rating).toFixed(2) : q.average_rating ? Number(q.average_rating).toFixed(2) : "-"}
```

### After:
```tsx
{q.normalized_rating !== null && q.normalized_rating !== undefined ? Number(q.normalized_rating).toFixed(2) : "-"}
```

Same for the subtotal on line 217 — change:
### Before:
```tsx
coGroups[q.co_number] = { questions: [], avg: coResult?.normalized_rating ?? coResult?.average_rating ?? null };
```
### After:
```tsx
coGroups[q.co_number] = { questions: [], avg: coResult?.normalized_rating ?? null };
```

---

## Build & Verify
```bash
cd frontend
npm run build
```
