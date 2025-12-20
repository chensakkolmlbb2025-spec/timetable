# Template Editing - Quick Reference Guide

## What Are Templates?

Templates are default schedules for each day of the week (Monday-Sunday). Instead of creating the same tasks every week, you create a template once and apply it automatically.

## Quick Start

### 1. Create Your First Template

```
Dashboard → Add time blocks for any day → Click "Set as Default"
```

### 2. View All Templates

```
Navigation → Templates Page
```

### 3. Edit a Template

```
Templates Page → Click Edit icon → Make changes → Auto-saves
```

### 4. Apply Templates

```
Templates Page → Click "Apply to This Week" → Done!
```

## Common Tasks

### Add a New Block to Template

1. Open Templates page
2. Click **Edit** icon on template card
3. Click **"Add New Time Block"** button
4. Fill in details:
   - Title (required)
   - Start time
   - End time
   - Category
   - Description (optional)
5. Click **"Add Block"**

### Edit Existing Block

1. Open template editor
2. Click **Pencil** icon on block
3. Modify fields
4. Click **"Save"**

### Reorder Blocks

1. Open template editor
2. Click and drag the **grip handle** (☰)
3. Drop at new position
4. Auto-saves

### Delete a Block

1. Open template editor
2. Click **Trash** icon on block
3. Confirm deletion

### Copy Template to Another Day

1. Click **Copy** icon on template card
2. Enter day number:
   - 0 = Sunday
   - 1 = Monday
   - 2 = Tuesday
   - 3 = Wednesday
   - 4 = Thursday
   - 5 = Friday
   - 6 = Saturday
3. Confirm

### Duplicate a Block

1. Open template editor
2. Click **Duplicate** icon on block
3. Edit the copy
4. Save

## Validation Rules

### ✅ Valid

- Title: 1-200 characters
- Time: HH:mm format (e.g., 09:00, 14:30)
- End time after start time
- No overlapping blocks
- Category: work, personal, health, learning, social, or other
- Description: Up to 500 characters

### ❌ Invalid

- Empty title
- End time before start time
- Time format like "9am" or "9:00 AM"
- Overlapping time blocks
- Title over 200 characters

## Tips & Tricks

### 💡 Tip 1: Start with Monday
Create a perfect Monday template, then copy it to other weekdays and adjust as needed.

### 💡 Tip 2: Use Categories
Color-code your blocks by category for quick visual scanning:
- **Work** (Blue)
- **Personal** (Purple)
- **Health** (Green)
- **Learning** (Amber)
- **Social** (Pink)
- **Other** (Gray)

### 💡 Tip 3: Avoid Overlaps
The system automatically detects overlapping times. If you see an overlap error, adjust the times so blocks don't conflict.

### 💡 Tip 4: Drag to Reorder
Don't manually change times to reorder—just drag blocks up or down in the editor!

### 💡 Tip 5: Apply to All Days
After editing a template, use "Apply to All [Day]days" on the dashboard to populate future weeks.

## Keyboard Shortcuts

- **Tab**: Move between form fields
- **Enter**: Save block (when in form)
- **Escape**: Cancel edit

## Common Workflows

### Workflow 1: Weekly Routine

```
1. Create Monday template (work schedule)
2. Duplicate to Tuesday-Friday
3. Create different Saturday template (personal time)
4. Create different Sunday template (rest/hobbies)
5. Apply to This Week
```

### Workflow 2: Semester Schedule

```
1. Create Monday template (classes + study)
2. Duplicate to other class days
3. Adjust for different class times each day
4. Apply templates weekly
```

### Workflow 3: Workout Schedule

```
1. Create template with workout blocks
2. Set different categories (cardio, strength, etc.)
3. Copy to workout days only
4. Leave rest days empty or with light activities
```

## Troubleshooting

### Problem: Template won't save

**Solutions:**
- Check all required fields filled
- Verify no time overlaps
- Check time format (HH:mm)
- Ensure end time > start time

### Problem: Changes disappeared

**Solutions:**
- Click "Save" before closing modal
- Check internet connection
- Refresh page and try again
- Check browser console for errors

### Problem: Can't drag blocks

**Solutions:**
- Click and hold the grip handle (☰)
- Try different browser if issue persists
- On mobile, use long-press then drag

### Problem: Overlap error but times look fine

**Solutions:**
- Check all blocks in template
- Sort by start time to see order
- Look for any same/overlapping times
- Remember: 09:00-10:00 overlaps with 09:30-10:30

## Best Practices

1. **Be Consistent**: Use similar naming for recurring tasks
2. **Use Descriptions**: Add details to remember context
3. **Review Weekly**: Update templates as routines change
4. **Backup Templates**: Duplicate before major changes
5. **Test First**: Apply to one week before bulk applying

## Visual Guide

### Template Card
```
┌─────────────────────────┐
│ Monday           [✏][📋][🗑] │
│ 5 time blocks           │
│ 🔵 work 🟣 personal     │
└─────────────────────────┘
```

### Editor Modal
```
┌───────────────────────────────────────┐
│ Edit Monday Template          [Close] │
│ 5 time blocks scheduled               │
├───────────────────────────────────────┤
│ ☰ Morning Workout      [📋][✏][🗑]    │
│   🕐 06:00 - 07:00    🟢 health       │
│                                       │
│ ☰ Breakfast           [📋][✏][🗑]    │
│   🕐 07:00 - 07:30    🟣 personal     │
│                                       │
│ [+ Add New Time Block]                │
└───────────────────────────────────────┘
```

## Icon Legend

- ✏️ **Edit**: Open block for editing
- 🗑️ **Delete**: Remove block/template
- 📋 **Duplicate**: Copy block or template
- ☰ **Grip**: Drag to reorder
- 💾 **Save**: Confirm changes
- ✖️ **Cancel**: Discard changes
- ➕ **Add**: Create new block

## Support

Need help? Check:
1. This quick reference
2. Full documentation: `/docs/template-editing-system.md`
3. In-app error messages (they're descriptive!)
4. Browser console for technical details

## Summary

Templates make scheduling easy! Create once, use weekly, adjust as needed. The editor provides all tools needed for perfect template management with validation to prevent mistakes.

**Remember:** Templates are your weekly blueprint. Perfect them once, save hours every week! 🚀
