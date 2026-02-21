
# Plan: One-Click Tool Submission Bookmarklet

## Overview
Create a bookmarklet (a browser bookmark button) that users can click while on any AI tool's website. It will grab the URL and redirect to the AI Feed tool submission form, where an AI-powered edge function will automatically scrape the website and pre-fill all form fields.

## How It Works

```text
User visits any AI tool website
        |
        v
Clicks bookmarklet in browser toolbar
        |
        v
Redirects to AI Feed: /submit-tool?url=https://example.com
        |
        v
SubmitTool page detects ?url= parameter
        |
        v
Calls edge function "extract-tool-info" with the URL
        |
        v
Edge function scrapes website + uses Lovable AI to extract:
  - Tool name, description, pricing, features, pros, cons, tags
        |
        v
Form auto-fills with extracted data
        |
        v
User reviews, adjusts, and submits
```

---

## Components

### 1. New Edge Function: `extract-tool-info`

**File**: `supabase/functions/extract-tool-info/index.ts`

- Accepts a URL in the request body
- Fetches the HTML of the target website (like fetch-link-metadata does)
- Sends the HTML content to Lovable AI (google/gemini-2.5-flash) with a structured prompt asking it to extract:
  - `name`: Tool name
  - `description`: A clear description (200-500 chars)
  - `pricing_type`: one of free, freemium, one_time_payment, subscription, contact
  - `free_plan`: "Yes" or "No" (if applicable)
  - `features`: Array of key features
  - `pros`: Array of pros
  - `cons`: Array of cons
  - `tags`: Relevant tags
  - `tool_type`: Array from [Web App, Desktop App, Mobile App, Chrome Extension, VS Code Extension, API, CLI Tool, Plugin]
- Uses tool-calling / structured output to get clean JSON back
- Returns the extracted data to the frontend

### 2. Update SubmitTool Page

**File**: `src/pages/SubmitTool.tsx`

- On mount, check for `?url=` query parameter
- If present, show a loading state ("Extracting tool information from website...")
- Call the `extract-tool-info` edge function via `supabase.functions.invoke`
- Auto-fill the form with the returned data
- Pre-fill the `website` field with the URL
- Show a toast: "Tool details extracted! Please review and adjust before submitting."

### 3. Bookmarklet Generator in Settings/Profile

**File**: `src/pages/SubmitTool.tsx` (add a section above the form)

- Display a draggable bookmarklet button with instructions
- The bookmarklet code:
  ```javascript
  javascript:void(window.open('https://lovable-platform-boost.lovable.app/submit-tool?url='+encodeURIComponent(location.href)))
  ```
- Instructions:
  1. Drag the button to your bookmarks bar
  2. Visit any AI tool website
  3. Click the bookmarklet
  4. Review the auto-filled form and submit

---

## Technical Details

### Edge Function: extract-tool-info

```text
POST /extract-tool-info
Body: { url: "https://example.com" }

Steps:
1. Fetch HTML from the URL (with User-Agent header)
2. Extract text content (strip scripts/styles, limit to ~8000 chars)
3. Also extract meta tags (og:title, og:description, og:image)
4. Call Lovable AI with tool-calling to extract structured data
5. Return JSON with extracted fields + logo_url from og:image
```

The AI prompt will instruct the model to analyze the website content and return structured tool information. It uses tool-calling (not raw JSON) for reliable structured output.

### Form Auto-Fill Logic

When `?url=` is detected:
1. Set `website` field immediately
2. Show loading overlay on the form
3. Call edge function
4. Map response fields to formData state
5. If `og:image` is found, set it as `logoUrl`
6. Remove loading overlay
7. User can then select category/subcategory manually (AI can suggest but categories must match DB)

### Bookmarklet UI

A small info card above the form with:
- A styled draggable link (the bookmarklet)
- Brief instructions (3 steps)
- Works on Chrome, Firefox, Safari, Edge

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/extract-tool-info/index.ts` | **Create** - New edge function |
| `supabase/config.toml` | **Modify** - Add function config |
| `src/pages/SubmitTool.tsx` | **Modify** - Add URL detection, auto-fill logic, bookmarklet UI |

---

## Edge Cases

- If the website blocks scraping, show a toast asking the user to fill manually
- If AI extraction fails, pre-fill only the website URL and let the user fill the rest
- Rate limit handling for the AI gateway (429/402 errors surfaced to user)
- URL validation before sending to the edge function
