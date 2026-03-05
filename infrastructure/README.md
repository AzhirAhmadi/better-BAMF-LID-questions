# Infrastructure Files

This directory contains the development and maintenance tools for the BAMF quiz application.

## Files Overview

### Data Extraction & Processing
- **`capture-questions.js`** - Web scraping script to extract questions from official BAMF website
  - Uses Playwright for browser automation and Tesseract.js for OCR
  - Outputs: `bamf-questions.json` (German questions)
  - Run: `npm run capture` or `npm run capture:resume`

- **`translate-bamf.js`** - Translation script to convert German questions to bilingual format
  - Uses Google Translate API to create English translations
  - Input: `bamf-questions.json` (German)
  - Output: `../webapp/bamf-questions-merged.json` (bilingual)
  - Run: `npm run translate` or `npm run translate:resume`

### Development Tools
- **`debug-question.js`** - Utility to capture individual question pages as HTML for debugging
  - Usage: `node debug-question.js [question_number]`
  - Outputs: `debug-question-[N].html` files

### Configuration
- **`package.json`** - Node.js dependencies and npm scripts
- **`bamf-questions.json`** - German-only question data (source for translation)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd infrastructure
   npm install
   ```

2. **Capture questions from BAMF website:**
   ```bash
   npm run capture          # Start from beginning
   npm run capture:resume   # Resume from last captured question
   npm run test            # Capture first 5 questions only
   ```

3. **Translate questions to bilingual format:**
   ```bash
   npm run translate         # Translate all questions
   npm run translate:resume  # Resume from last translated question
   npm run translate:test    # Translate first 5 questions only
   ```

4. **Deploy updated data:**
   ```bash
   # After translation, the bilingual data is automatically saved to:
   # ../webapp/bamf-questions-merged.json
   # 
   # Simply deploy the ../webapp/ directory to your web server
   ```

## Important Notes

⚠️ **Legal Compliance**: Always respect the official BAMF website's terms of service and rate limits.

⚠️ **Rate Limiting**: The scripts include delays to avoid overwhelming the BAMF servers.

⚠️ **Verification Required**: Always verify translated content accuracy before deployment.

## Troubleshooting

- **OCR Errors**: Some questions use images that may require manual correction
- **Translation Errors**: Google Translate may produce inaccurate legal terminology
- **Network Issues**: Use resume flags to continue after interruptions