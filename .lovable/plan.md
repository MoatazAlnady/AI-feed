

# Plan: Fix Chrome Extension Link, Show Sub-Categories in Pending Tools, Simplify Sub-Category Storage, Add OAuth to Sign-In

## Issues Identified

1. **Chrome extension link points to empty folder** — The link `href="/chrome-extension/"` serves a directory listing, not a downloadable file. Need to provide actual download instructions or a zip.

2. **Pending tools don't show sub-category names** — The list view (line 569 area) only shows `category_name` and `pricing` badges. Sub-category names are fetched but never displayed in the list or the review modal.

3. **Tools have `sub_category_id: uuid[]` (array) but should be single UUID** — Per requirements, a tool can only have ONE sub-category. The `sub_category_id` column is currently `uuid[]`, and there's a junction table `tool_sub_categories`. Need to:
   - Migrate `sub_category_id` from `uuid[]` to a single `uuid` (nullable, FK to `sub_categories`)
   - Drop the `tool_sub_categories` junction table
   - Remove the `sync_tool_sub_category_id` trigger
   - Update all frontend code that treats it as an array
   - Update DB functions (`create_tool_edit_request`, `approve_tool_edit_request`, `get_pending_edit_requests`)

4. **OAuth buttons only shown on signup form** — The condition `mode === 'signup' && accountType !== 'employer'` (line 612) excludes sign-in mode. Should show on both.

---

## Changes Required

### 1. Database Migration

**Migration SQL:**
- Add a new column `sub_category_id_single uuid` referencing `sub_categories(id)`
- Populate it from the first element of the existing `sub_category_id` array
- Drop the old `sub_category_id` array column
- Rename `sub_category_id_single` to `sub_category_id`
- Drop the `tool_sub_categories` table and its trigger `sync_tool_sub_category_id`
- Update the `check_subcategory_deletion` function to check `tools.sub_category_id` directly
- Update `create_tool_edit_request` to accept a single `uuid` instead of `uuid[]`
- Update `approve_tool_edit_request` to set `sub_category_id` directly instead of managing the junction table
- Update `get_pending_edit_requests` to return a single `sub_category_id` and join for the name

### 2. File: `src/components/AdminPendingToolsEnhanced.tsx`

- **List view (line 569 area):** Add a badge showing sub-category name after the category badge
- **Remove junction table fetch** (lines 107-127): Instead, join sub_categories directly via `sub_category_id`
- **Review modal (line 826-830):** Show sub-category name (it already shows `subcategory` string but should show the resolved name from the new single FK)
- Update the `PendingTool` interface to use `sub_category_id: string | null` (single) and `sub_category_name: string | null`

### 3. File: `src/pages/SubmitTool.tsx`

- Update `formData.subcategoryId` handling — it's already a single string, which is correct
- Update any code that builds `sub_category_id` as an array when submitting to Supabase — change to single value
- Find the tool submission code and ensure it sets `sub_category_id` as a single UUID string

### 4. File: `src/components/AuthModal.tsx`

- **Line 612:** Change condition from `mode === 'signup' && accountType !== 'employer'` to `accountType !== 'employer'` (or `(mode === 'signin' || mode === 'signup') && accountType !== 'employer'`)
- This will show Google, LinkedIn, Discord, and GitHub buttons on both sign-in and sign-up forms
- For sign-in mode, the `accountType` variable defaults to `'creator'`, so the employer check won't block it. Simplify to just show OAuth on sign-in always.

### 5. File: `src/pages/SubmitTool.tsx` — Chrome Extension Link

- **Line 716:** Replace the broken `/chrome-extension/` link with proper instructions
- Since Chrome extensions must be loaded as unpacked folders, provide a note saying "Download all files from the chrome-extension folder" or link to individual files
- Better approach: create a simple inline instruction that lists the files to save, or link to GitHub if available

### 6. File: `supabase/functions/extract-tool-info/index.ts`

- Update any reference to `sub_category_id` being an array — change to single value

### 7. File: `src/pages/AdminToolRequests.tsx`

- Update `EditRequest` interface: `sub_category_id` from `string[] | null` to `string | null`
- Update sub-category enrichment logic accordingly

### 8. Other files referencing `tool_sub_categories` or array `sub_category_id`

- Search and update all references across the codebase

---

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create — restructure `sub_category_id` column, drop junction table |
| `src/components/AdminPendingToolsEnhanced.tsx` | Modify — show sub-category in list, simplify fetch |
| `src/components/AuthModal.tsx` | Modify — show OAuth on sign-in mode |
| `src/pages/SubmitTool.tsx` | Modify — fix chrome extension link, update sub-category submission |
| `src/pages/AdminToolRequests.tsx` | Modify — update interface and enrichment |
| `supabase/functions/extract-tool-info/index.ts` | Modify — single sub-category |
| Other files with `tool_sub_categories` references | Modify as needed |

---

## Risk Notes

- The database migration changes the `sub_category_id` column type. Tools with multiple sub-categories (if any exist) will keep only the first one.
- The `tool_sub_categories` junction table will be dropped — any code referencing it must be updated before the migration.
- DB functions (`create_tool_edit_request`, `approve_tool_edit_request`, `get_pending_edit_requests`) must be updated in the same migration.

