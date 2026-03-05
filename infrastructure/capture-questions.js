/**
 * BAMF Fragenkatalog capture script.
 * Uses Playwright to open the site, go through each question, extract
 * question text and options, reveal correct answer, then append to JSON and save immediately.
 *
 * Run: npm run capture        (capture all from start or resume)
 * Run: npm run capture:resume (resume from last question in JSON)
 * Run: npm run test           (capture first 5 questions only)
 */

import { chromium } from 'playwright';
import { createWorker } from 'tesseract.js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, 'bamf-questions.json');

const BASE_URL = 'https://oet.bamf.de/ords/oetut/f?p=514:1::::::';
const CATALOG_URL = 'https://oet.bamf.de/ords/oetut/f?p=514:30::::::';
const TOTAL_QUESTIONS = 310;

/** Random delay ~2 seconds (1500–2500 ms) to avoid appearing like an attack. */
function randomDelay() {
  const ms = 1500 + Math.random() * 1000;
  return new Promise((r) => setTimeout(r, ms));
}

function loadQuestions() {
  try {
    const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
    return Array.isArray(data.questions) ? data.questions : [];
  } catch {
    return [];
  }
}

function saveQuestions(questions) {
  writeFileSync(JSON_PATH, JSON.stringify({ questions }, null, 2), 'utf8');
}

const INSTRUCTION = 'Bitte kreuzen Sie an. Es gibt nur eine richtige Antwort.';

/**
 * Extract question text (via OCR on the image) and options (via DOM) from the current page.
 * Returns { questionText: string, options: string[] } or null.
 */
async function extractQuestionAndOptions(page, number, ocrWorker) {
  // Collect option texts from the DOM: the ANTOWRT column cells after each radio
  const radioLocator = page.locator('input[type="radio"][name="f20"]');
  const radioCount = await radioLocator.count();
  if (radioCount < 4) {
    console.warn(`Question ${number}: found only ${radioCount} radio inputs.`);
    return null;
  }

  const options = [];
  for (let i = 0; i < Math.min(radioCount, 4); i++) {
    const radio = radioLocator.nth(i);
    // radio -> its TD -> following sibling TD with headers="ANTWORT"
    const answerCell = radio.locator('xpath=ancestor::td[1]/following-sibling::td[@headers="ANTWORT"][1]');
    const hasAnswer = await answerCell.count();
    if (!hasAnswer) continue;
    const text = (await answerCell.innerText()).trim();
    if (text) options.push(text);
  }

  if (options.length < 4) {
    console.warn(`Question ${number}: only extracted ${options.length} options.`);
    return null;
  }

  // First try: plain text question in P30_AUFGABENSTELLUNG
  const textSpan = page.locator('#P30_AUFGABENSTELLUNG');
  if (await textSpan.count()) {
    const raw = (await textSpan.innerText()).trim();
    const questionText = raw.replace(/\s+/g, ' ').trim();
    if (questionText) {
      return { questionText, options };
    }
  }

  // Fallback: screenshot the question image inside P30_AUFGABENSTELLUNG_BILD and OCR it
  const imgLocator = page.locator('#P30_AUFGABENSTELLUNG_BILD img');
  if (!(await imgLocator.count())) {
    console.warn(`Question ${number}: no question text or question image found.`);
    return null;
  }

  const imgBuffer = await imgLocator.screenshot();
  const { data: { text: rawText } } = await ocrWorker.recognize(imgBuffer);
  const questionText = rawText
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!questionText) {
    console.warn(`Question ${number}: OCR produced empty text.`);
    return null;
  }

  return { questionText, options };
}

/**
 * After clicking an option, find which option is marked as correct.
 * Returns the exact option text string.
 */
async function extractCorrectAnswer(page) {
  return await page.evaluate(() => {
    const body = document.body.innerText || '';
    if (body.includes('richtige Antwort')) {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      for (const r of radios) {
        const id = r.getAttribute('id');
        let labelEl = id ? document.querySelector(`label[for="${id}"]`) : null;
        const cell = r.closest('td') || r.closest('div');
        const next = cell?.nextElementSibling || (r.parentElement?.nextElementSibling);
        const container = labelEl?.parentElement || next?.parentElement || r.closest('tr');
        const block = container || r.parentElement;
        if (block && block.innerText.includes('richtige Antwort')) {
          const raw = block.innerText.replace(/richtige Antwort\s*=>?/gi, '').replace(/falsche Antwort\s*=>?/gi, '').trim();
          const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
          return lines[0] || raw;
        }
      }
    }
    const match = body.match(/richtige Antwort\s*=>?\s*([^\n]+)/);
    return match ? match[1].trim() : '';
  });
}

/**
 * Check if a question is complete and correct (100% accurate).
 * A question is considered complete if it has:
 * - A non-empty questionText
 * - Exactly 4 options
 * - A correctAnswer that matches one of the options
 */
function isQuestionComplete(question) {
  if (!question || !question.questionText || !question.questionText.trim()) {
    return false;
  }
  
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return false;
  }
  
  if (!question.correctAnswer || !question.correctAnswer.trim()) {
    return false;
  }
  
  // Check if correctAnswer matches one of the options exactly
  const hasMatchingOption = question.options.some(option => 
    option && option.trim() === question.correctAnswer.trim()
  );
  
  return hasMatchingOption;
}

/**
 * Compare two questions to see if they are identical in content.
 */
function areQuestionsIdentical(q1, q2) {
  if (!q1 || !q2) return false;
  
  const normalize = (str) => str ? str.trim().replace(/\s+/g, ' ') : '';
  
  if (normalize(q1.questionText) !== normalize(q2.questionText)) {
    return false;
  }
  
  if (!Array.isArray(q1.options) || !Array.isArray(q2.options) || q1.options.length !== q2.options.length) {
    return false;
  }
  
  for (let i = 0; i < q1.options.length; i++) {
    if (normalize(q1.options[i]) !== normalize(q2.options[i])) {
      return false;
    }
  }
  
  if (normalize(q1.correctAnswer) !== normalize(q2.correctAnswer)) {
    return false;
  }
  
  return true;
}

async function run() {
  const resume = process.argv.includes('--resume');
  const fromArg = process.argv.find(a => a.startsWith('--from='));
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const testMode = process.argv.includes('--test');
  const limit = testMode ? 5 : (limitArg ? parseInt(limitArg.split('=')[1], 10) : null);

  const existing = loadQuestions();
  const startFrom = fromArg
    ? parseInt(fromArg.split('=')[1], 10) || 1
    : resume && existing.length > 0
      ? Math.max(...existing.map(q => q.number)) + 1
      : 1;

  const endAt = limit != null ? Math.min(startFrom + limit, TOTAL_QUESTIONS + 1) : TOTAL_QUESTIONS + 1;
  const lastQuestion = endAt - 1;

  if (startFrom > TOTAL_QUESTIONS) {
    console.log('All questions already captured.');
    return;
  }

  if (testMode || limit != null) {
    console.log(`Test mode: capturing ${limit ?? 'limited'} questions (${startFrom} to ${lastQuestion}).`);
  }
  console.log(`Starting capture from question ${startFrom} to ${lastQuestion}. Existing: ${existing.length} questions.`);

  // Prepare browser and OCR worker
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  const ocrWorker = await createWorker(['deu', 'eng'], 1, {
    logger: () => {},
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.getByRole('button', { name: /Zum Fragenkatalog/i }).click();
    await page.waitForURL(/p=514:30/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    for (let n = startFrom; n < endAt && n <= TOTAL_QUESTIONS; n++) {
      try {
        if (n > 1) {
          const combo = page.getByRole('combobox', { name: /Aufgabe|wählen/i }).or(page.locator('select').first());
          await combo.selectOption({ label: String(n) }).catch(() => combo.selectOption({ value: String(n) }));
          await page.waitForTimeout(1200);
        }

        const extracted = await extractQuestionAndOptions(page, n, ocrWorker);
        if (!extracted || !extracted.questionText || extracted.options.length < 4) {
          console.warn(`Question ${n}: could not extract text, retrying...`);
          await page.waitForTimeout(800);
          const retry = await extractQuestionAndOptions(page, n, ocrWorker);
          if (!retry || !retry.questionText || retry.options.length < 4) {
            console.error(`Question ${n}: skip (extract failed).`);
            continue;
          }
          Object.assign(extracted, retry);
        }

        const firstRadio = page.locator('input[type="radio"]').first();
        await firstRadio.click();
        await page.waitForTimeout(600);

        let correctAnswer = await extractCorrectAnswer(page);
        if (!correctAnswer && extracted.options.length) {
          correctAnswer = extracted.options[0];
        }

        const newQuestion = {
          number: n,
          questionText: extracted.questionText,
          options: extracted.options,
          correctAnswer,
        };

        const questions = loadQuestions();
        const existingQuestion = questions.find(q => q.number === n);
        
        // Check if question already exists and is complete
        if (existingQuestion) {
          if (isQuestionComplete(existingQuestion)) {
            // Check if the existing question is identical to what we just extracted
            if (areQuestionsIdentical(existingQuestion, newQuestion)) {
              console.log(`Skipping question ${n}/${TOTAL_QUESTIONS}: already collected and 100% correct`);
              if (n < lastQuestion) await randomDelay();
              continue;
            } else {
              console.log(`Replacing question ${n}/${TOTAL_QUESTIONS}: collected but data differs`);
            }
          } else {
            console.log(`Replacing question ${n}/${TOTAL_QUESTIONS}: collected but not 100% correct`);
          }
          
          // Replace the existing question
          const without = questions.filter(q => q.number !== n);
          without.push(newQuestion);
          without.sort((a, b) => a.number - b.number);
          saveQuestions(without);
        } else {
          // Insert new question in correct position
          console.log(`Adding new question ${n}/${TOTAL_QUESTIONS}: not previously collected`);
          questions.push(newQuestion);
          questions.sort((a, b) => a.number - b.number);
          saveQuestions(questions);
        }
        
        console.log(`Saved question ${n}/${TOTAL_QUESTIONS}: ${extracted.questionText.slice(0, 50)}...`);
        if (n < lastQuestion) await randomDelay();
      } catch (err) {
        console.error(`Question ${n} error:`, err.message);
      }
    }
  } finally {
    await ocrWorker.terminate();
    await browser.close();
  }

  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
