
# Plan: Tool Submission Form & Database Updates

## Overview
This plan addresses multiple changes to the tools system including field styling, database schema updates, form logic changes, and logo visibility simplification.

---

## Changes Summary

| Change | Description |
|--------|-------------|
| Field Colors | Update form inputs to match NewsFeed grey styling |
| Pricing Column | Rename `pricing` to `pricing_type` in database and all code |
| Pricing Options | Change "Paid" to "One Time Payment", add "Subscription", make mandatory |
| Logo Logic | Simplify to only use `is_light_logo`, remove `is_dark_logo` column |
| Tool Type | Add `tool_type` column to database (currently not saved) |
| Free Plan | Conditional display - only show for "One Time Payment" or "Subscription" |
| Category/Subcategory | Enforce single selection (already single select in SubmitTool) |

---

## 1. Form Field Styling

The NewsFeed page uses `bg-muted/50` for the page background and `bg-card` for cards. The input fields need to use the muted background color to match.

**File: src/pages/SubmitTool.tsx**

Update all input/select/textarea fields from:
```text
bg-white dark:bg-slate-800
```

To:
```text
bg-muted
```

This applies to approximately 15+ form fields including name, description, category, subcategory, pricing, website, tags, features, pros, cons, etc.

---

## 2. Database Migration

### 2.1 Rename Column and Add tool_type
```text
-- Rename pricing to pricing_type
ALTER TABLE public.tools RENAME COLUMN pricing TO pricing_type;

-- Add tool_type column to store platform types
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS tool_type TEXT[];

-- Drop the redundant is_dark_logo column
ALTER TABLE public.tools DROP COLUMN IF EXISTS is_dark_logo;
```

---

## 3. Code Updates for pricing to pricing_type

### Files requiring updates:

| File | Changes |
|------|---------|
| src/pages/SubmitTool.tsx | Form state `pricing` to `pricing_type`, submission data, fetch |
| src/components/CreateToolModal.tsx | Form state, submission, select field |
| src/components/EditToolModal.tsx | Form state, fetch, submission |
| src/pages/ToolDetails.tsx | Interface, display badge |
| src/components/ToolCard.tsx | Interface property, display |
| src/components/TrendingTools.tsx | Display |
| src/components/feed/FeedToolCard.tsx | Interface, display |
| src/components/feed/SharedToolCard.tsx | Interface, display |
| src/pages/ToolComparison.tsx | Interface, display |
| src/components/ToolComparisonModal.tsx | Display |
| src/pages/AdminToolRequests.tsx | Interface, display |
| src/pages/CreatorProfile.tsx | Interface |

---

## 4. Pricing Model Changes

### 4.1 Update Pricing Options

**SubmitTool.tsx** - Change select options:
```text
<option value="free">Free</option>
<option value="freemium">Freemium</option>
<option value="one_time_payment">One Time Payment</option>  (was "paid")
<option value="subscription">Subscription</option>
<option value="contact">Contact for Pricing</option>
```

**CreateToolModal.tsx** and **EditToolModal.tsx** - Same option changes

### 4.2 Make Pricing Mandatory

Add `required` attribute to the pricing select field in all forms.

---

## 5. Free Plan Conditional Display

### Logic:
- Show "Free Plan Available?" field only when `pricing_type` is `one_time_payment` or `subscription`
- When visible, make it required
- If hidden, set value to empty string (won't appear in preview/published page)

**SubmitTool.tsx** - Replace the current grid layout:
```text
{/* Pricing Model - Full Width */}
<div className="mb-6">
  <label>Pricing Model *</label>
  <select name="pricing" required ...>
    ...options...
  </select>
</div>

{/* Free Plan - Conditional, shown only for paid options */}
{(formData.pricing === 'one_time_payment' || formData.pricing === 'subscription') && (
  <div className="mb-6">
    <label>Free Plan / Free Credits Available? *</label>
    <select name="freePlan" required ...>
      <option value="Yes">Yes</option>
      <option value="No">No</option>
    </select>
  </div>
)}
```

When pricing changes to a non-paid option, reset `freePlan` to empty string.

---

## 6. Logo Visibility Simplification

### 6.1 Remove is_dark_logo

**SubmitTool.tsx** (lines 985-1022):
- Remove the `is_dark_logo` checkbox entirely
- Update the `is_light_logo` label to be clearer
- Remove `is_dark_logo` from form state and submission

### 6.2 Update Logo Inversion Logic

**New Logic** - The user specified:
- `is_light_logo = TRUE`: Logo is light, invert it in LIGHT mode (to make it dark/visible)
- `is_light_logo = FALSE`: Logo is dark, invert it in DARK mode (to make it light/visible)

**Files to update:**
- src/components/ToolCard.tsx
- src/components/feed/FeedToolCard.tsx
- src/components/feed/SharedToolCard.tsx

New `shouldInvertLogo` function:
```text
const shouldInvertLogo = () => {
  if (!tool.logo_url) return false;
  // TRUE = light logo, invert in light mode to make visible
  if (theme === 'light' && tool.is_light_logo) return true;
  // FALSE = dark logo, invert in dark mode to make visible
  if (theme === 'dark' && !tool.is_light_logo) return true;
  return false;
};
```

---

## 7. Add tool_type to Database Submission

**SubmitTool.tsx** - Add to submission data:
```text
const submissionData = {
  ...
  tool_type: formData.toolType,  // ADD THIS
  pricing_type: formData.pricing,
  ...
};
```

**CreateToolModal.tsx** - Add tool_type to form state and submission.

---

## 8. Category/Subcategory Single Selection

The current implementation in SubmitTool.tsx already uses single select dropdowns for both category and subcategory.

**CreateToolModal.tsx** currently allows multiple sub-categories with checkboxes. Change to:
1. Change `sub_category_id: []` to `sub_category_id: ''` (single string)
2. Replace checkbox list with a single Select dropdown

**EditToolModal.tsx** - Same changes to use single subcategory selection.

---

## Files to be Modified

1. **Database Migration** (new file)
2. **src/pages/SubmitTool.tsx** - Field colors, pricing options, free plan conditional, logo simplification, tool_type save
3. **src/components/CreateToolModal.tsx** - Pricing options, tool_type, single subcategory
4. **src/components/EditToolModal.tsx** - Pricing options, single subcategory
5. **src/pages/ToolDetails.tsx** - pricing_type reference
6. **src/components/ToolCard.tsx** - pricing_type, logo logic
7. **src/components/feed/FeedToolCard.tsx** - pricing_type, logo logic
8. **src/components/feed/SharedToolCard.tsx** - pricing_type, logo logic
9. **src/components/TrendingTools.tsx** - pricing_type
10. **src/pages/ToolComparison.tsx** - pricing_type
11. **src/components/ToolComparisonModal.tsx** - pricing_type
12. **src/pages/AdminToolRequests.tsx** - pricing_type

---

## Technical Details

### Form State Changes (SubmitTool.tsx)
```text
const [formData, setFormData] = useState({
  ...
  pricing: 'free',  // rename to pricing_type internally
  freePlan: '',     // default empty, not 'No'
  is_light_logo: false,
  // REMOVE: is_dark_logo: false,
  ...
});
```

### Conditional Free Plan Reset
When pricing changes, if new value is not 'one_time_payment' or 'subscription', reset freePlan to '':
```text
if (name === 'pricing') {
  if (value !== 'one_time_payment' && value !== 'subscription') {
    setFormData(prev => ({ ...prev, freePlan: '' }));
  }
}
```
