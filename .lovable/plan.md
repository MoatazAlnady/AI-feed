
# Plan: AI Category Intelligence, Chrome Extension, Background Consistency & About Page

## Overview
Three distinct changes:
1. Upgrade the `extract-tool-info` edge function to dynamically fetch categories/subcategories from the database and provide clear AI instructions for classification
2. Convert the bookmarklet into a proper Chrome Extension for easy installation
3. Fix pre-login page backgrounds to match post-login styling, and rewrite the About page with proper content (translations are missing)

---

## 1. Dynamic Category Intelligence for AI Extraction

### Problem
The `extract-tool-info` edge function currently has no knowledge of the platform's categories or subcategories. It cannot suggest a category or subcategory for the tool.

### Solution
Before calling the AI, query the database for all categories and their subcategories. Include the full category tree in the AI prompt with clear classification instructions. Add `category` and `subcategory` to the structured output.

**File: `supabase/functions/extract-tool-info/index.ts`**

Changes:
- Import and initialize a Supabase client inside the function
- Query `categories` and `sub_categories` tables to build the category tree
- Add detailed classification instructions to the system prompt, formatted as:
```text
Categories and their sub-categories:
- AI Libraries: AI Agents, AI Libraries, AI Tools, GPTs, Prompt Libraries
- Audio: AI Agent, Music Generation, Podcast, Voice Audition, Voice Over
- Business & Finance: AI GRC, Billing, Consulting, Documentation, E-commerce, ERP, News, Planning, Supply Chain
- Communication & Language: Content Transcribing, Culture, Learning, Translation
- Content Creation: AI Agent, AI Checker, AI Humanizer, AI Watermarking, ...
- Data & Analytics: Academic Research, Data Analytics, ...
- Development & Coding: AI Agents, API Management, Coding Assistant, ...
- HR: Assessment, ATS, Automation, Candidate Management, ...
- Image & Designing: AI Avatar, Designing, Graphic Designing, ...
- Marketing: Advertising, Branding, Content Marketing, ...
... (all fetched dynamically)
```

- Add clear dropdown field instructions to the prompt:
```text
Classification Rules:
- Select EXACTLY ONE category and EXACTLY ONE subcategory
- pricing_type: "free" (completely free), "freemium" (free tier + paid), "one_time_payment" (single purchase), "subscription" (recurring), "contact" (enterprise/custom pricing)
- free_plan: Only set for "one_time_payment" or "subscription". "Yes" if free tier/credits exist, "No" otherwise. Leave empty for other pricing types.
- tool_type: Select all that apply from [Web App, Desktop App, Mobile App, Chrome Extension, VS Code Extension, API, CLI Tool, Plugin]
```

- Add `suggested_category` and `suggested_subcategory` to the tool-calling schema
- Update the frontend (`SubmitTool.tsx`) to auto-select the category/subcategory if the AI suggestion matches

### Frontend Update (`SubmitTool.tsx`)
In `extractToolInfo`, after receiving data:
- If `data.suggested_category` matches a category name, set `formData.category`
- Filter subcategories for that category, and if `data.suggested_subcategory` matches, set `formData.subcategoryId`

---

## 2. Chrome Extension for One-Click Submission

### Problem
Bookmarklets are hard to install and not intuitive. Users want to install a proper Chrome extension.

### Solution
Create a minimal Chrome Extension (Manifest V3) that adds a browser action button. When clicked on any page, it opens the submit-tool page with the current URL.

**New files to create in `public/chrome-extension/`:**

**`manifest.json`**:
```json
{
  "manifest_version": 3,
  "name": "AI Feed - Submit Tool",
  "version": "1.0",
  "description": "One-click submit AI tools to AI Feed",
  "permissions": ["activeTab"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}
```

**`popup.html`**: A small popup with a "Submit This Tool" button and a brief description. When clicked, it gets the current tab URL and opens the submit-tool page.

**`popup.js`**: Gets current tab URL via `chrome.tabs.query`, opens `https://lovable-platform-boost.lovable.app/submit-tool?url=<encoded_url>`.

**Icons**: Reuse existing favicons (resize from `public/favicon.png` to 16, 48, 128px).

### Update Bookmarklet Section (`SubmitTool.tsx`)
Replace the bookmarklet-only UI with a section that has two options:
1. **Chrome Extension** (primary) - Download/install instructions + link to the extension folder
2. **Bookmarklet** (fallback) - Keep existing draggable bookmarklet

Since Chrome extensions from outside the Chrome Web Store require developer mode, include clear instructions:
1. Download the extension folder (provide a zip or instructions)
2. Go to `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked" and select the folder

---

## 3. Pre-Login Background Consistency

### Problem
Pre-login pages (Index, About, etc.) use different backgrounds than post-login pages. The `body:not(.logged-in)` CSS rule applies a light gradient, while `AnimatedBackground` adds another gradient. The logged-in pages use a different dark blue scheme.

### Solution
Update the pre-login backgrounds to match the post-login aesthetic:

**File: `src/index.css`**

Update the `body:not(.logged-in)` rule to use `hsl(var(--background))` instead of the separate gradient:
```css
body:not(.logged-in) {
  background: hsl(var(--background));
}
```

**File: `src/components/AnimatedBackground.tsx`**

Update to match the logged-in dark mode background:
- Light mode: Use `hsl(var(--background))` (white)
- Dark mode: Use the same radial gradient as `body.logged-in.dark`

**File: `src/pages/Index.tsx`**

The Index page uses hardcoded colors like `dark:bg-[#091527]` on sections/cards. Update to use theme tokens (`bg-card`, `bg-background`) for consistency.

---

## 4. About Page Content Fix

### Problem
The About page uses translation keys (`t('about.title')`, etc.) but none of these keys exist in the translation files. The page renders with raw keys as text.

### Solution
Two changes:

**Option A (chosen): Hardcode content directly in the component** since About page content is specific to this platform and shouldn't change per locale frequently.

**File: `src/pages/About.tsx`**

Rewrite with actual platform content:
- **Hero**: "About AI Feed" / "The ultimate platform for discovering, comparing, and sharing AI tools..."
- **Mission**: Describe the platform's mission to democratize AI tool discovery
- **Values**: Innovation (Cutting-edge AI tools), Community (Connect with AI enthusiasts), Purpose (Help people find the right AI tools), Global (AI tools from around the world)
- **Team/Story section**: Add a "What We Offer" section with feature highlights (Tool Directory, Community, Jobs & Talent, Blog & Articles)
- **CTA**: "Join the AI Revolution" with proper links
- **Background**: Remove `bg-gray-50 dark:bg-gray-900` and use `bg-background` for consistency

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/extract-tool-info/index.ts` | Modify - Add dynamic category fetching and AI classification instructions |
| `src/pages/SubmitTool.tsx` | Modify - Auto-fill category/subcategory from AI, update bookmarklet section with Chrome extension option |
| `public/chrome-extension/manifest.json` | Create |
| `public/chrome-extension/popup.html` | Create |
| `public/chrome-extension/popup.js` | Create |
| `src/index.css` | Modify - Update pre-login background |
| `src/components/AnimatedBackground.tsx` | Modify - Match post-login backgrounds |
| `src/pages/Index.tsx` | Modify - Use theme tokens instead of hardcoded colors |
| `src/pages/About.tsx` | Rewrite - Add actual content, fix background |

---

## Technical Details

### Edge Function: Category Fetching
```text
// Inside the handler, before calling AI:
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const { data: cats } = await supabaseClient
  .from('categories')
  .select('name, sub_categories(name)')
  .order('name');

// Build category tree string for prompt
const categoryTree = cats.map(c =>
  `- ${c.name}: ${c.sub_categories.map(s => s.name).join(', ')}`
).join('\n');
```

### Chrome Extension Popup
```html
<button id="submit">Submit This Tool to AI Feed</button>
<script src="popup.js"></script>
```
```javascript
document.getElementById('submit').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const url = tabs[0].url;
    window.open(`https://lovable-platform-boost.lovable.app/submit-tool?url=${encodeURIComponent(url)}`);
  });
});
```

### Auto-fill Category in SubmitTool
```text
// After extraction, match category
if (data.suggested_category) {
  const matchedCat = categories.find(c =>
    c.name.toLowerCase() === data.suggested_category.toLowerCase()
  );
  if (matchedCat) {
    setFormData(prev => ({ ...prev, category: matchedCat.name }));
    // Then match subcategory
    if (data.suggested_subcategory) {
      const subs = subCategories.filter(s => s.category_id === matchedCat.id);
      const matchedSub = subs.find(s =>
        s.name.toLowerCase() === data.suggested_subcategory.toLowerCase()
      );
      if (matchedSub) {
        setFormData(prev => ({ ...prev, subcategoryId: matchedSub.id }));
      }
    }
  }
}
```
