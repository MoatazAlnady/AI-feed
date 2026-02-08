
# Plan: Fix CSV Import Modal

## Overview
Re-enable the CsvImportModal component in the SubmitTool page by connecting it with the correct props that match its interface.

---

## Current Issue

The CsvImportModal was commented out on line 1022 with the note "removed for now to fix build". The modal component expects specific props, and all the necessary state variables already exist in SubmitTool.tsx.

---

## Changes Required

### File: src/pages/SubmitTool.tsx

**1. Add handler for CSV file selection (around line 218)**

The modal needs an `onCsvSelect` callback that receives both the file and parsed data. Add this handler:

```tsx
const handleCsvSelect = (file: File, data: any[]) => {
  setCsvFile(file);
  setCsvData(data);
  if (data.length === 0) {
    setCsvError('No valid data found in CSV file.');
  } else {
    setCsvError('');
  }
};
```

**2. Re-add CsvImportModal component (replace line 1022)**

Replace the comment with the actual modal:

```tsx
<CsvImportModal
  isOpen={showCsvModal}
  onClose={() => setShowCsvModal(false)}
  onCsvSelect={handleCsvSelect}
  onSubmit={handleCsvSubmit}
  csvFile={csvFile}
  csvData={csvData}
  csvError={csvError}
  isProcessing={isProcessingCsv}
/>
```

---

## Props Mapping

| Modal Prop | SubmitTool Source |
|------------|-------------------|
| `isOpen` | `showCsvModal` state |
| `onClose` | `() => setShowCsvModal(false)` |
| `onCsvSelect` | New `handleCsvSelect` function |
| `onSubmit` | Existing `handleCsvSubmit` function |
| `csvFile` | `csvFile` state |
| `csvData` | `csvData` state |
| `csvError` | `csvError` state |
| `isProcessing` | `isProcessingCsv` state |

---

## Files Modified

1. **src/pages/SubmitTool.tsx** - Add handler and re-enable modal component
