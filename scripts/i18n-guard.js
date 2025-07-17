#!/usr/bin/env node

/**
 * i18n Build Guard - Prevents deployment with hard-coded English text
 * 
 * This script scans for literal English text in React/TypeScript components
 * and fails the build if any are found outside of translation functions.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to detect hard-coded English text
const LITERAL_TEXT_PATTERN = />([^<>{}]*[A-Za-z]{2}[^<>{}]*)</g;
const TRANSLATION_PATTERNS = [
  /t\(['"`][^'"`]+['"`]\)/g,        // t('key')
  /\{t\(['"`][^'"`]+['"`]\)\}/g,     // {t('key')}
  /\{\s*t\(['"`][^'"`]+['"`]\)\s*\}/g, // { t('key') }
];

// Files and directories to exclude from scanning
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.{ts,tsx,js,jsx}',
  '**/*.spec.{ts,tsx,js,jsx}',
  '**/public/**',
  '**/*.md',
  '**/README*',
  '**/CHANGELOG*',
  '**/*.config.{js,ts}',
  '**/vite.config.ts',
  '**/tailwind.config.ts',
  '**/postcss.config.js',
];

// Files to include in scanning
const INCLUDE_PATTERNS = [
  'src/**/*.{ts,tsx,js,jsx}',
];

function isTranslationFunction(line, index) {
  // Check if the text is already wrapped in a translation function
  return TRANSLATION_PATTERNS.some(pattern => {
    const matches = [...line.matchAll(pattern)];
    return matches.some(match => {
      const start = match.index;
      const end = start + match[0].length;
      return index >= start && index <= end;
    });
  });
}

function scanFileForLiterals(filePath) {
  const violations = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineNumber) => {
      const matches = [...line.matchAll(LITERAL_TEXT_PATTERN)];
      
      matches.forEach(match => {
        const text = match[1].trim();
        
        // Skip empty strings, single characters, numbers, or non-English text
        if (!text || text.length < 2 || /^\d+$/.test(text) || /^[^a-zA-Z]*$/.test(text)) {
          return;
        }
        
        // Skip if it's already in a translation function
        if (isTranslationFunction(line, match.index)) {
          return;
        }
        
        // Skip common technical terms and non-translatable content
        const skipPatterns = [
          /^(px|rem|em|vh|vw|%|\d+)$/,           // CSS units
          /^(true|false|null|undefined)$/,        // JS literals  
          /^[A-Z_]+$/,                           // Constants
          /^[a-z-]+$/,                           // CSS classes/IDs
          /^https?:\/\//,                        // URLs
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Emails
          /^className$|^onClick$|^onChange$/,     // React props
        ];
        
        if (skipPatterns.some(pattern => pattern.test(text))) {
          return;
        }
        
        violations.push({
          file: filePath,
          line: lineNumber + 1,
          column: match.index + 1,
          text: text,
          context: line.trim()
        });
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
  
  return violations;
}

function main() {
  console.log('🌐 Running i18n build guard...\n');
  
  const allViolations = [];
  
  // Get all files to scan
  const files = INCLUDE_PATTERNS.flatMap(pattern => 
    glob.sync(pattern, { ignore: EXCLUDE_PATTERNS })
  );
  
  console.log(`Scanning ${files.length} files for hard-coded English text...\n`);
  
  files.forEach(file => {
    const violations = scanFileForLiterals(file);
    allViolations.push(...violations);
  });
  
  if (allViolations.length === 0) {
    console.log('✅ No hard-coded English text found! Build can proceed.\n');
    process.exit(0);
  }
  
  console.log(`❌ Found ${allViolations.length} hard-coded English text violations:\n`);
  
  // Group violations by file
  const violationsByFile = allViolations.reduce((acc, violation) => {
    if (!acc[violation.file]) {
      acc[violation.file] = [];
    }
    acc[violation.file].push(violation);
    return acc;
  }, {});
  
  Object.entries(violationsByFile).forEach(([file, violations]) => {
    console.log(`📄 ${file}`);
    violations.forEach(violation => {
      console.log(`   Line ${violation.line}:${violation.column} - "${violation.text}"`);
      console.log(`   Context: ${violation.context}`);
      console.log(`   Solution: Wrap with t('auto.${violation.text.toLowerCase().replace(/\s+/g, '_')}')`);
      console.log('');
    });
  });
  
  console.log('💡 How to fix:');
  console.log('1. Replace hard-coded strings with translation keys using t()');
  console.log('2. Add new keys to src/i18n/locales/en/common.json under "auto" section');
  console.log('3. Add empty placeholder values for other languages');
  console.log('4. Run the build again\n');
  
  console.log('🚫 Build failed due to hard-coded text violations.');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { scanFileForLiterals, main };