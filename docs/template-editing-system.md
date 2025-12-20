# Template Editing System - Complete Documentation

## Overview
The Template Editing System provides enterprise-level CRUD operations for default daily templates with comprehensive validation, error handling, and optimal user experience.

## Features

### 1. Core CRUD Operations

#### Create (Add Blocks)
- Add new time blocks to any template
- Inline form with all fields
- Real-time validation
- Duplicate existing blocks

#### Read (View Templates)
- Visual card display for each day
- Block count and category summary
- Interactive modal for detailed view
- Sorted by start time

#### Update (Edit Blocks)
- Inline editing without page navigation
- Drag-and-drop to reorder blocks
- Update any field (title, time, category, description)
- Real-time validation feedback

#### Delete (Remove Blocks)
- Delete individual blocks with confirmation
- Delete entire templates
- Safe removal with error handling

### 2. Advanced Features

#### Drag-and-Drop Reordering
- Visual grip handle for each block
- Smooth drag interactions
- Instant visual feedback
- Persist order to database
- Works on touch devices

#### Template Duplication
- Copy entire template to another day
- Day selector with validation
- Overwrites existing template for target day
- Useful for creating similar schedules

#### Validation System
- **Title Validation:**
  - Required field
  - 1-200 characters
  - Trimmed automatically
  
- **Time Validation:**
  - HH:mm format (24-hour)
  - End time must be after start time
  - Overlap detection across all blocks
  
- **Category Validation:**
  - Must be one of: work, personal, health, learning, social, other
  
- **Description Validation:**
  - Optional field
  - Maximum 500 characters
  - Trimmed automatically

#### Time Overlap Detection
```typescript
Example Error:
"Time overlap detected: 'Morning Workout' (06:00-07:00) 
overlaps with 'Breakfast' (06:30-07:30)"
```

### 3. User Interface

#### Template Editor Modal
- **Header:** Day name and block count
- **Block List:** Sorted by start time with drag handles
- **Add Button:** Create new blocks inline
- **Actions:** Edit, Duplicate, Delete for each block
- **Footer:** Close button

#### Block Display
- Title (bold)
- Time range with clock icon
- Category badge (color-coded)
- Description (if present)
- Repeat indicator (if daily)

#### Edit Form
- Title input (required)
- Start/End time pickers
- Category dropdown
- Description textarea
- Save/Cancel buttons
- Loading states

### 4. Storage Functions

#### `updateDefaultTemplate(template)`
Update entire template with validation.

```typescript
const updatedTemplate = await updateDefaultTemplate({
  id: template.id,
  userId: user.id,
  dayOfWeek: 1, // Monday
  blocks: [...blocks],
  name: "Monday",
  createdAt: template.createdAt
})
```

#### `addTemplateBlock(templateId, block)`
Add new block with overlap detection.

```typescript
const updated = await addTemplateBlock(templateId, {
  title: "Morning Workout",
  startTime: "06:00",
  endTime: "07:00",
  category: "health",
  description: "Cardio and strength training",
  color: "#10B981",
  repeatDaily: false
})
```

#### `updateTemplateBlock(templateId, blockIndex, updates)`
Update specific block by index.

```typescript
const updated = await updateTemplateBlock(templateId, 0, {
  title: "Updated Title",
  startTime: "06:30",
  endTime: "07:30"
})
```

#### `deleteTemplateBlock(templateId, blockIndex)`
Remove block from template.

```typescript
const updated = await deleteTemplateBlock(templateId, 0)
```

#### `reorderTemplateBlocks(templateId, fromIndex, toIndex)`
Change block order (drag-and-drop).

```typescript
const updated = await reorderTemplateBlocks(templateId, 2, 0)
// Moves block from index 2 to index 0
```

#### `duplicateTemplate(templateId, targetDayOfWeek, userId)`
Copy template to another day.

```typescript
const newTemplate = await duplicateTemplate(
  mondayTemplateId,
  2, // Tuesday
  user.id
)
```

### 5. Validation Functions

#### `validateSingleBlock(block)`
Validates one block and returns cleaned version.

**Checks:**
- Title required and length
- Time format (HH:mm)
- End after start
- Valid category
- Description length
- Trims strings

#### `validateTemplateBlocks(blocks)`
Validates array of blocks.

**Checks:**
- Each block individually
- Time overlaps between blocks
- Returns validated array

#### `checkTimeOverlaps(blocks)`
Detects scheduling conflicts.

**Algorithm:**
1. Sort blocks by start time
2. Compare each block's end with next block's start
3. Throw error if overlap found

### 6. Error Handling

#### Common Errors

```typescript
// Title errors
"Block title is required"
"Block title must be 200 characters or less"

// Time errors
"Invalid start time format. Use HH:mm (24-hour format)"
"End time must be after start time"

// Overlap errors
"Time overlap detected: 'Task A' (09:00-10:00) overlaps with 'Task B' (09:30-10:30)"

// Category errors
"Invalid category. Must be one of: work, personal, health, learning, social, other"

// Template errors
"Template not found"
"Invalid block index"
"Invalid indices"
```

#### Error Recovery

All operations include:
- Try-catch blocks
- Descriptive error messages
- Toast notifications
- Rollback on failure
- Console logging for debugging

### 7. Best Practices

#### For Developers

1. **Always validate before saving:**
   ```typescript
   const validated = validateSingleBlock(formData)
   await addTemplateBlock(templateId, validated)
   ```

2. **Handle errors gracefully:**
   ```typescript
   try {
     await updateTemplateBlock(templateId, index, updates)
     toast({ title: "Success" })
   } catch (error) {
     toast({ 
       title: "Error",
       description: error.message,
       variant: "destructive"
     })
   }
   ```

3. **Use optimistic UI:**
   ```typescript
   // Update UI immediately
   setBlocks([...blocks, newBlock])
   // Then save to database
   await addTemplateBlock(templateId, newBlock)
   ```

4. **Reload after updates:**
   ```typescript
   await updateTemplateBlock(...)
   await loadTemplates() // Refresh from database
   ```

#### For Users

1. **Creating Templates:**
   - Go to dashboard for any day
   - Add time blocks
   - Click "Set as Default"

2. **Editing Templates:**
   - Go to Templates page
   - Click edit icon on template card
   - Edit blocks inline
   - Drag to reorder
   - Changes save automatically

3. **Duplicating Templates:**
   - Click duplicate icon
   - Enter target day (0-6)
   - Confirm to copy

4. **Avoiding Overlaps:**
   - Check existing blocks before adding
   - System will warn if overlap detected
   - Adjust times to fix conflicts

### 8. Component Architecture

```
TemplatesPage (app/templates/page.tsx)
├── Template Cards (grid layout)
│   ├── Edit Button → Opens TemplateEditorModal
│   ├── Duplicate Button → Calls duplicateTemplate()
│   └── Delete Button → Calls deleteDefaultTemplate()
└── TemplateEditorModal (components/template-editor-modal.tsx)
    ├── Block List (drag-and-drop)
    │   ├── View Mode → Shows block with actions
    │   └── Edit Mode → Shows inline form
    ├── Add Block Form
    └── Storage Integration
        ├── addTemplateBlock()
        ├── updateTemplateBlock()
        ├── deleteTemplateBlock()
        └── reorderTemplateBlocks()
```

### 9. Data Flow

```
User Action → Component State → Validation → Storage Function → Database
                    ↓                                              ↓
                Toast Notification ← UI Update ← Success Response ←
```

### 10. Performance Optimizations

1. **Optimistic UI Updates:**
   - Update state immediately
   - Revert if save fails

2. **Batch Operations:**
   - Use upsert for multiple blocks
   - Single database transaction

3. **Efficient Reordering:**
   - Client-side drag preview
   - Server persist on drop

4. **Minimal Re-renders:**
   - Local state for editing
   - Only reload after save

### 11. Accessibility

- **Keyboard Navigation:**
  - Tab through form fields
  - Enter to save
  - Escape to cancel

- **Screen Readers:**
  - ARIA labels on buttons
  - Descriptive error messages
  - Form field labels

- **Visual Feedback:**
  - Loading states
  - Error highlighting
  - Success confirmations

### 12. Mobile Responsiveness

- Touch-friendly drag handles
- Responsive grid layout
- Full-screen modal on mobile
- Large touch targets (44px minimum)
- Scrollable content areas

### 13. Testing Guide

#### Manual Testing Checklist

- [ ] Add new block to template
- [ ] Edit existing block
- [ ] Delete block with confirmation
- [ ] Drag to reorder blocks
- [ ] Duplicate block
- [ ] Duplicate template to another day
- [ ] Test time overlap detection
- [ ] Test invalid time format
- [ ] Test empty title validation
- [ ] Test description character limit
- [ ] Test on mobile device
- [ ] Test keyboard navigation
- [ ] Test error recovery

#### Test Scenarios

**Scenario 1: Add Overlapping Block**
1. Open template with block at 09:00-10:00
2. Try to add block at 09:30-10:30
3. Should show error: "Time overlap detected..."

**Scenario 2: Reorder Blocks**
1. Open template with 3+ blocks
2. Drag last block to first position
3. Should reorder and persist

**Scenario 3: Duplicate Template**
1. Click duplicate on Monday template
2. Enter "2" for Tuesday
3. Should copy all blocks to Tuesday

### 14. Future Enhancements

Potential improvements:
- [ ] Bulk edit multiple blocks
- [ ] Template import/export (JSON)
- [ ] Template sharing between users
- [ ] Template versioning/history
- [ ] Undo/redo functionality
- [ ] Template suggestions (AI)
- [ ] Time block templates (common activities)
- [ ] Conflict resolution wizard
- [ ] Visual timeline preview
- [ ] Batch time adjustments

### 15. Troubleshooting

#### Issue: Changes not saving
- Check browser console for errors
- Verify Supabase connection
- Check user authentication
- Try localStorage fallback

#### Issue: Overlaps not detected
- Verify time format (HH:mm)
- Check validation function
- Sort blocks by start time
- Review checkTimeOverlaps logic

#### Issue: Drag-and-drop not working
- Check draggable attribute
- Verify event handlers
- Test on different browser
- Try touch events on mobile

#### Issue: Modal not opening
- Check selectedTemplate state
- Verify editorOpen state
- Check Dialog component
- Review console for errors

## Summary

The Template Editing System provides a complete, enterprise-grade solution for managing daily templates with:
- ✅ Full CRUD operations
- ✅ Comprehensive validation
- ✅ Drag-and-drop reordering
- ✅ Template duplication
- ✅ Error-free operation
- ✅ Optimal user experience
- ✅ Mobile responsive
- ✅ Accessible design
- ✅ Best practices throughout

This system ensures seamless integration, flawless operations, and maximum productivity for users managing their daily schedules.
