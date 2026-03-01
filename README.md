# BAMF Fragenkatalog

Scrapes all 310 questions from BAMF "Leben in Deutschland" citizenship test. Saves to JSON with exact text/answers.

## How it works

- Opens BAMF website with Playwright
- Goes through each question 1-310
- Extracts question text (OCR for images, DOM for text)
- Extracts 4 multiple choice options
- Clicks answer to reveal correct one
- Saves immediately to JSON

## Smart handling

- **Skip**: Question exists + 100% correct → skip
- **Replace**: Question exists + incomplete/wrong → replace  
- **Add**: Question missing → insert in correct position

## Setup

```bash
npm install
```

## Run

```bash
# All questions (skip existing correct ones)
npm run capture

# Start fresh from question 1
npm run capture:from-start

# Resume from last captured
npm run capture:resume

# Test with first 5 questions
npm run test

# Custom range
node capture-questions.js --from=50 --limit=10
```

## Output

`bamf-questions.json` - array of questions:
```json
{
  "number": 1,
  "questionText": "In Deutschland dürfen Menschen...",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "option2"
}
```

Takes ~15min for all 310 questions (2sec delay between requests).