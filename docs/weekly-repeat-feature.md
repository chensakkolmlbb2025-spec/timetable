# Weekly Repeat Schedule Feature

## Overview

Users can now schedule repeating tasks on specific days of the week (Monday through Sunday). This feature provides flexible scheduling options beyond the simple "repeat daily" option.

## Features

### Repeat Options

1. **No Repeat** (Default)
   - One-time task on a specific date

2. **Repeat Daily** (`repeatDaily: true`)
   - Task repeats every single day
   - Automatically appears on all dates going forward

3. **Repeat on Specific Days** (`repeatDays: [0,1,2,3,4,5,6]`)
   - Select individual days of the week
   - Days are indexed: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   - Example: `[1,3,5]` = Monday, Wednesday, Friday

### Quick Select Buttons

The RepeatDaysSelector component provides convenient shortcuts:

- **Weekdays**: Mon-Fri (days `[1,2,3,4,5]`)
- **Weekends**: Sat-Sun (days `[0,6]`)
- **Every Day**: Enables daily repeat mode
- **Clear**: Removes all repeat selections

## Database Schema

### New Column: `repeat_days`

```sql
ALTER TABLE public.time_blocks
ADD COLUMN repeat_days jsonb DEFAULT NULL;
```

**Type**: JSONB array  
**Format**: `[0, 1, 2, 3, 4, 5, 6]` (array of day indices)  
**Constraints**:
- Must be NULL or a valid JSON array
- Values must be integers 0-6 (enforced via trigger)
- Trigger: `trg_check_repeat_days` validates on INSERT/UPDATE

**Index**: `idx_time_blocks_repeat_days` (GIN index for fast filtering)

## API/Storage

### TimeBlock Interface

```typescript
export interface TimeBlock {
  id: string
  userId: string
  title: string
  description?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  category: "work" | "personal" | "health" | "learning" | "social" | "other"
  color: string
  completed: boolean
  repeatDaily?: boolean
  repeatDays?: number[] // NEW: Days of week [0-6]
  createdAt: string
}
```

### Storage Functions

#### `getTimeBlocksForDate(userId, dateStr)`

Enhanced to handle weekly repeats:

1. Returns blocks with exact date match
2. Returns daily repeat blocks (`repeatDaily: true`)
3. **NEW**: Returns weekly repeat blocks matching the requested date's day of week

**Example**:
```typescript
// For Monday, Jan 20, 2025:
const blocks = await getTimeBlocksForDate(userId, "2025-01-20")

// Returns:
// - All blocks with date: "2025-01-20"
// - All blocks with repeatDaily: true
// - All blocks with repeatDays including 1 (Monday)
```

#### `shouldBlockAppearOnDate(block, dateStr)`

Helper function that determines if a block should appear on a specific date:

```typescript
function shouldBlockAppearOnDate(block: TimeBlock, dateStr: string): boolean {
  // If it's a regular block with exact date match
  if (block.date === dateStr) return true
  
  // If it repeats daily
  if (block.repeatDaily) return true
  
  // If it repeats on specific days of the week
  if (block.repeatDays && block.repeatDays.length > 0) {
    const dayOfWeek = getDayOfWeek(dateStr)
    return block.repeatDays.includes(dayOfWeek)
  }
  
  return false
}
```

## UI Components

### RepeatDaysSelector

Reusable component for selecting repeat days.

**Location**: `components/ui/repeat-days-selector.tsx`

**Props**:
```typescript
interface RepeatDaysSelectorProps {
  selectedDays: number[]
  onChange: (days: number[]) => void
  repeatDaily?: boolean
  onRepeatDailyChange?: (daily: boolean) => void
  className?: string
  disabled?: boolean
  weekStartDay?: 0 | 1 // Default: 1 (Monday)
}
```

**Features**:
- Visual day-of-week buttons
- Quick select shortcuts (Weekdays, Weekends)
- Disables when `repeatDaily` is enabled
- Shows human-readable summary of selection
- Respects user's week start preference

### Integration Points

1. **New Time Block** (`app/dashboard/new/page.tsx`)
   - Full repeat options panel
   - Always visible for new blocks

2. **Edit Time Block** (`app/dashboard/[id]/page.tsx`)
   - Expandable repeat options section
   - Shows current repeat status
   - Easy transition between daily and weekly repeats

3. **Time Block Modal** (`components/time-block-modal.tsx`)
   - View repeat schedule in display mode
   - Edit repeat schedule in edit mode
   - Toggle daily vs. specific days

## Usage Examples

### Creating a Weekday Task

1. Go to "New Time Block"
2. Fill in title, time, category
3. In "Repeat Schedule", select Mon, Tue, Wed, Thu, Fri (or click "Weekdays")
4. Save

**Result**: Task appears every weekday, starting from the selected date

### Converting Daily to Weekdays

1. Edit an existing daily repeat task
2. Uncheck "Repeat every day"
3. Click "Weekdays" to select Mon-Fri
4. Save

**Result**: Task changes from daily to weekday-only repeat

### One-Time Task

1. Create block with no repeat options selected
2. Task appears only on the selected date

## Migration

Run `db/migrations/2025-12-19-add-repeat-days.sql` in Supabase:

```bash
# Features added:
- repeat_days column (JSONB array)
- GIN index for performance
- Simple CHECK constraint
- Validation function: validate_repeat_days()
- Trigger: trg_check_repeat_days for runtime validation
```

## Day Indexing

```
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

## Examples in Code

```typescript
// Task repeats Mon, Wed, Fri
const block = {
  ...baseBlock,
  repeatDays: [1, 3, 5]
}

// Task repeats every weekday
const block = {
  ...baseBlock,
  repeatDays: [1, 2, 3, 4, 5]
}

// Task repeats weekends
const block = {
  ...baseBlock,
  repeatDays: [0, 6]
}

// Task repeats daily (prefer using repeatDaily for this)
const block = {
  ...baseBlock,
  repeatDaily: true
  // repeatDays can be left undefined
}
```

## Performance Notes

- `repeat_days` column uses JSONB with GIN index
- Fast lookup of repeating tasks: `WHERE repeat_days && ARRAY[day_index]`
- `getTimeBlocksForDate()` fetches all user blocks and filters client-side
- For large datasets, consider server-side filtering with SQL

## Future Improvements

- Date range selection for repeat expiration
- Repeat end dates (e.g., "repeat until December 31")
- Monthly/yearly repeat patterns
- Bi-weekly or every-N-weeks patterns
- Exclude specific dates from repeats
- Copy repeat pattern between tasks
