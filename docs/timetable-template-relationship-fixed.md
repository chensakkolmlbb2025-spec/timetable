# Timetable-Template Relationship - Fixed and Working

## Overview
The timetable and template system now works correctly. Templates are saved schedules that can be applied to populate your weekly timetable.

## How It Works

### 1. Creating Templates (Set as Default)

**Dashboard → Add blocks → Click "Set as Default"**

```
Monday Dashboard:
- 09:00-10:00 Morning Meeting
- 10:00-12:00 Focus Work
- 12:00-13:00 Lunch
- 13:00-17:00 Afternoon Work

Click "Set as Default" → Saves as "Monday Template"
```

**What happens:**
- Current day's blocks are saved to `default_templates` table
- Template includes: title, description, startTime, endTime, category, color
- Linked to dayOfWeek (0=Sunday, 1=Monday, etc.)
- Overwrites existing template for that day

### 2. Applying Templates (Apply Default Templates)

**Dashboard → Click "Apply Default Templates"**

```
Templates stored:
- Monday: 4 blocks
- Tuesday: 3 blocks  
- Wednesday: 4 blocks
- Thursday: 3 blocks
- Friday: 2 blocks

Click "Apply Default Templates" → Populates entire current week
```

**What happens:**
1. Gets start of current week (Sunday)
2. For each day (0-6):
   - Finds template for that day
   - Deletes existing blocks for that date
   - Creates new blocks from template
   - Inserts into `time_blocks` table
3. Reloads current day's blocks

### 3. Viewing Templates

**Templates Page → See all your default templates**

```
Template Cards:
┌────────────────┐
│ Monday         │
│ 4 time blocks  │
│ [Edit] [Copy]  │
└────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    1. CREATE TEMPLATE                    │
│                                                          │
│  Dashboard (Today)                                       │
│  ├── User adds blocks to current day                    │
│  ├── Clicks "Set as Default"                            │
│  └── handleSetAsDefault()                               │
│      ├── Maps blocks to template format                 │
│      ├── Checks for existing template (same dayOfWeek)  │
│      └── saveDefaultTemplate()                          │
│          └── Upserts to default_templates table         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   2. APPLY TEMPLATES                     │
│                                                          │
│  Dashboard                                               │
│  ├── User clicks "Apply Default Templates"              │
│  └── handleApplyDefaultTemplates()                      │
│      ├── Gets start of current week                     │
│      └── applyTemplateToWeek()                          │
│          ├── getDefaultTemplates() - fetch all          │
│          ├── For each day (Sun-Sat):                    │
│          │   ├── Find template for dayOfWeek            │
│          │   ├── Delete existing blocks for date        │
│          │   ├── Create new blocks from template        │
│          │   └── Insert into time_blocks table          │
│          └── Reload current day's blocks                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    3. VIEW/EDIT TEMPLATES                │
│                                                          │
│  Templates Page                                          │
│  ├── getDefaultTemplates() - shows all                  │
│  ├── Click Edit → TemplateEditorModal                   │
│  │   ├── Add/Edit/Delete blocks                         │
│  │   ├── Drag to reorder                                │
│  │   └── updateTemplateBlock() / addTemplateBlock()     │
│  └── Click Copy → duplicateTemplate()                   │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

### default_templates table
```sql
- id (uuid)
- user_id (uuid) → auth.users
- name (text) e.g., "Monday Template"
- day_of_week (int) 0-6
- blocks (jsonb) Array of block templates
- created_at (timestamp)
```

### time_blocks table
```sql
- id (uuid)
- user_id (uuid) → auth.users
- title (text)
- description (text)
- date (text) YYYY-MM-DD
- start_time (text) HH:mm
- end_time (text) HH:mm
- category (text)
- color (text)
- completed (boolean)
- repeat_daily (boolean)
- repeat_days (jsonb) Array of day indices
- created_at (timestamp)
```

## Key Functions

### saveDefaultTemplate(template)
```typescript
// Saves/updates a default template
// Uses upsert (by id) so updating works correctly
```

### applyTemplateToWeek(userId, startDate)
```typescript
// For each day of week starting from startDate:
// 1. Find template for that dayOfWeek (0-6)
// 2. Delete existing blocks for that date
// 3. Create new blocks from template
// 4. Insert into time_blocks table
```

### getDefaultTemplates(userId)
```typescript
// Fetches all templates for user
// Returns array of templates with blocks
```

## Fixed Issues

### ❌ Before (BROKEN):
```typescript
// Wrong! This filtered OUT the target date
const filteredBlocks = existingBlocks.filter((b) => b.date !== dateStr)
// Then tried to insert filteredBlocks (wrong dates!)
```

### ✅ After (FIXED):
```typescript
// Correct! Delete specific date, insert new blocks
await supabase.from("time_blocks").delete().eq("date", dateStr)
const newBlocks = template.blocks.map(b => ({ ...b, date: dateStr }))
await supabase.from("time_blocks").insert(newBlocks)
```

## User Workflow Example

### Scenario: Weekly Work Schedule

**Step 1: Create Monday Template**
```
1. Go to Dashboard
2. Navigate to Monday (Dec 23, 2025)
3. Add blocks:
   - 09:00-10:00 Team Standup
   - 10:00-12:00 Deep Work
   - 13:00-17:00 Project Work
4. Click "Set as Default"
5. ✅ Monday template saved
```

**Step 2: Create Templates for Other Days**
```
1. Navigate to Tuesday
2. Add Tuesday-specific blocks
3. Click "Set as Default"
4. ✅ Tuesday template saved
5. Repeat for Wed-Fri
```

**Step 3: Apply to Current Week**
```
1. Go to Dashboard (any day)
2. Click "Apply Default Templates"
3. ✅ All templates applied to current week
4. Navigate between days to see populated schedule
```

**Step 4: Adjust Templates**
```
1. Go to Templates page
2. Click Edit on Monday template
3. Add/remove/reorder blocks
4. Changes saved automatically
5. Next week, apply templates again to use updated version
```

## Debugging

### Check if templates exist:
```sql
SELECT * FROM default_templates WHERE user_id = 'your-user-id';
```

### Check if blocks created:
```sql
SELECT * FROM time_blocks 
WHERE user_id = 'your-user-id' 
  AND date >= '2025-12-22' 
  AND date <= '2025-12-28'
ORDER BY date, start_time;
```

### Console logs (added for debugging):
```javascript
// When saving template:
"[Dashboard] Saving template for Monday with 4 blocks"

// When applying templates:
"[applyTemplateToWeek] Found 5 templates, applying to week..."
"[applyTemplateToWeek] Applying template for 1 (2025-12-23) with 4 blocks"
"[applyTemplateToWeek] Successfully created 4 blocks for 2025-12-23"
```

## Error Handling

All operations now include try-catch blocks:
```typescript
try {
  await saveDefaultTemplate(template)
  toast({ title: "Success" })
} catch (error) {
  console.error('[Dashboard] Error:', error)
  toast({ 
    title: "Error",
    description: error.message,
    variant: "destructive"
  })
}
```

## Summary

✅ Templates save correctly with all block data  
✅ Apply templates populates week correctly  
✅ Each day gets its own template blocks  
✅ Existing blocks are replaced (not duplicated)  
✅ Error handling and logging throughout  
✅ User feedback with toast notifications  

The timetable-template relationship is now **fully functional** and ready for production use!
