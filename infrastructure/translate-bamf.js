/**
 * BAMF Questions Translation Script
 * Translates German BAMF questions to English using Google Translate API
 * Creates bilingual JSON with safe keyed structure (Q/A/B/C/D)
 * 
 * Run: npm run translate          (translate all questions)
 * Run: npm run translate:resume   (resume from last translated question)
 * Run: npm run translate:test     (translate first 5 questions only)
 */

import https from 'https';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GERMAN_JSON_PATH = join(__dirname, 'bamf-questions.json');
const BILINGUAL_JSON_PATH = join(__dirname, '..', 'bamf-questions-merged.json');

/** Random delay ~2 seconds (1500–2500 ms) to respect rate limits */
function randomDelay() {
  const ms = 1500 + Math.random() * 1000;
  return new Promise((r) => setTimeout(r, ms));
}

function loadGermanQuestions() {
  try {
    const data = JSON.parse(readFileSync(GERMAN_JSON_PATH, 'utf8'));
    return Array.isArray(data.questions) ? data.questions : [];
  } catch {
    console.error(`Could not load German questions from ${GERMAN_JSON_PATH}`);
    process.exit(1);
  }
}

function loadBilingualQuestions() {
  try {
    const data = JSON.parse(readFileSync(BILINGUAL_JSON_PATH, 'utf8'));
    return Array.isArray(data.questions) ? data.questions : [];
  } catch {
    return [];
  }
}

function saveBilingualQuestions(questions) {
  const data = {
    questions,
    metadata: {
      totalQuestions: questions.length,
      lastUpdated: new Date().toISOString(),
      translationService: 'Google Translate',
      structure: 'BAMF Optimized (Q/A/B/C/D keys)'
    }
  };
  writeFileSync(BILINGUAL_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Translate text using Google Translate free API
 */
async function translateText(text, from = 'de', to = 'en') {
  return new Promise((resolve, reject) => {
    const cleanText = text.replace(/[""]/g, '"').trim();
    
    const params = new URLSearchParams({
      client: 'gtx',
      sl: from,
      tl: to,
      dt: 't',
      q: cleanText
    });

    const url = `https://translate.googleapis.com/translate_a/single?${params}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
            resolve(parsed[0][0][0]);
          } else {
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Find which option key (A/B/C/D) matches the correct answer text
 */
function findCorrectAnswerKey(options, correctAnswer) {
  for (let i = 0; i < options.length; i++) {
    if (options[i] === correctAnswer) {
      return String.fromCharCode(65 + i); // Convert 0,1,2,3 to A,B,C,D
    }
  }
  console.warn(`Could not match correct answer "${correctAnswer}" to any option`);
  return 'A'; // Default fallback
}

/**
 * Check if a bilingual question is complete and correct.
 * A question is considered complete if it has:
 * - German and English question text
 * - All 4 options (A,B,C,D) with German and English text
 * - A valid answer key
 */
function isTranslationComplete(question) {
  if (!question || !question.Q || !question.Q.de || !question.Q.en) {
    return false;
  }
  
  const optionKeys = ['A', 'B', 'C', 'D'];
  for (const key of optionKeys) {
    if (!question[key] || !question[key].de || !question[key].en) {
      return false;
    }
  }
  
  if (!question.answer || !optionKeys.includes(question.answer)) {
    return false;
  }
  
  return true;
}

/**
 * Compare two bilingual questions to see if they are identical in content.
 */
function areTranslationsIdentical(q1, q2) {
  if (!q1 || !q2) return false;
  
  const normalize = (str) => str ? str.trim().replace(/\\s+/g, ' ') : '';
  
  // Compare question text
  if (normalize(q1.Q?.de) !== normalize(q2.Q?.de) || 
      normalize(q1.Q?.en) !== normalize(q2.Q?.en)) {
    return false;
  }
  
  // Compare options
  const optionKeys = ['A', 'B', 'C', 'D'];
  for (const key of optionKeys) {
    if (normalize(q1[key]?.de) !== normalize(q2[key]?.de) ||
        normalize(q1[key]?.en) !== normalize(q2[key]?.en)) {
      return false;
    }
  }
  
  // Compare answer
  if (q1.answer !== q2.answer) {
    return false;
  }
  
  return true;
}

/**
 * Translate a single German question to the bilingual format
 */
async function translateQuestion(germanQuestion, questionIndex, totalQuestions) {
  const { number, questionText, options, correctAnswer } = germanQuestion;
  
  console.log(`\\nTranslating question ${number} (${questionIndex + 1}/${totalQuestions})...`);
  
  try {
    // Translate question text
    console.log(`Q: "${questionText.substring(0, 60)}..."`);
    const questionEn = await translateText(questionText);
    console.log(`✓ Question translated`);
    await randomDelay();

    // Translate each option
    const optionsEn = [];
    const optionKeys = ['A', 'B', 'C', 'D'];
    
    for (let i = 0; i < options.length; i++) {
      if (!options[i]) {
        console.warn(`Question ${number}: Option ${optionKeys[i]} is missing`);
        optionsEn.push('[MISSING OPTION]');
        continue;
      }
      
      console.log(`${optionKeys[i]}: "${options[i].substring(0, 40)}..."`);
      const optionEn = await translateText(options[i]);
      optionsEn.push(optionEn);
      console.log(`✓ Option ${optionKeys[i]} translated`);
      await randomDelay();
    }

    // Find correct answer key
    const correctAnswerKey = findCorrectAnswerKey(options, correctAnswer);
    console.log(`✓ Correct answer: ${correctAnswerKey}`);

    // Build the bilingual structure
    const bilingualQuestion = {
      number,
      Q: {
        de: questionText,
        en: questionEn
      },
      A: {
        de: options[0] || '[MISSING]',
        en: optionsEn[0] || '[MISSING]'
      },
      B: {
        de: options[1] || '[MISSING]',
        en: optionsEn[1] || '[MISSING]'
      },
      C: {
        de: options[2] || '[MISSING]',
        en: optionsEn[2] || '[MISSING]'
      },
      D: {
        de: options[3] || '[MISSING]',
        en: optionsEn[3] || '[MISSING]'
      },
      answer: correctAnswerKey
    };

    console.log(`✅ Question ${number} completed successfully`);
    return bilingualQuestion;

  } catch (error) {
    console.error(`❌ Translation failed for question ${number}:`, error.message);
    
    // Return with error markers but preserve structure
    return {
      number,
      Q: {
        de: questionText,
        en: `[TRANSLATION_ERROR: ${questionText.substring(0, 50)}...]`
      },
      A: {
        de: options[0] || '[MISSING]',
        en: `[TRANSLATION_ERROR: ${options[0]?.substring(0, 30) || 'MISSING'}...]`
      },
      B: {
        de: options[1] || '[MISSING]',
        en: `[TRANSLATION_ERROR: ${options[1]?.substring(0, 30) || 'MISSING'}...]`
      },
      C: {
        de: options[2] || '[MISSING]',
        en: `[TRANSLATION_ERROR: ${options[2]?.substring(0, 30) || 'MISSING'}...]`
      },
      D: {
        de: options[3] || '[MISSING]',
        en: `[TRANSLATION_ERROR: ${options[3]?.substring(0, 30) || 'MISSING'}...]`
      },
      answer: findCorrectAnswerKey(options, correctAnswer),
      translationError: true
    };
  }
}

async function run() {
  const resume = process.argv.includes('--resume');
  const fromArg = process.argv.find(a => a.startsWith('--from='));
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const testMode = process.argv.includes('--test');
  const limit = testMode ? 5 : (limitArg ? parseInt(limitArg.split('=')[1], 10) : null);

  const germanQuestions = loadGermanQuestions();
  const existingBilingual = loadBilingualQuestions();
  
  if (germanQuestions.length === 0) {
    console.error('No German questions found to translate.');
    return;
  }

  const totalQuestions = germanQuestions.length;
  const startFrom = fromArg
    ? parseInt(fromArg.split('=')[1], 10) || 1
    : resume && existingBilingual.length > 0
      ? Math.max(...existingBilingual.map(q => q.number)) + 1
      : 1;

  const questionsToTranslate = germanQuestions.filter(q => q.number >= startFrom);
  const endAt = limit != null ? 
    questionsToTranslate.slice(0, limit) : 
    questionsToTranslate;

  if (endAt.length === 0) {
    console.log('All questions already translated.');
    return;
  }

  if (testMode || limit != null) {
    console.log(`Test mode: translating ${endAt.length} questions.`);
  }
  
  console.log(`Starting translation from question ${startFrom}.`);
  console.log(`Questions to translate: ${endAt.length} of ${totalQuestions} total.`);
  console.log(`Existing translations: ${existingBilingual.length}`);
  
  const estimatedMinutes = Math.ceil(endAt.length * 6 * 2 / 1000 / 60);
  console.log(`Estimated time: ~${estimatedMinutes} minutes\\n`);

  let successCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < endAt.length; i++) {
    const germanQuestion = endAt[i];
    const { number } = germanQuestion;
    
    try {
      // Check if question already exists and is complete
      const existingQuestion = existingBilingual.find(q => q.number === number);
      
      if (existingQuestion && isTranslationComplete(existingQuestion)) {
        console.log(`Skipping question ${number}/${totalQuestions}: already translated and complete`);
        successCount++;
        continue;
      }
      
      const newTranslation = await translateQuestion(germanQuestion, i, endAt.length);
      
      // Load current state and update
      const currentBilingual = loadBilingualQuestions();
      const withoutExisting = currentBilingual.filter(q => q.number !== number);
      withoutExisting.push(newTranslation);
      withoutExisting.sort((a, b) => a.number - b.number);
      
      saveBilingualQuestions(withoutExisting);
      
      if (newTranslation.translationError) {
        errorCount++;
        console.log(`Saved question ${number}/${totalQuestions} with errors`);
      } else {
        successCount++;
        console.log(`Saved question ${number}/${totalQuestions}: ${germanQuestion.questionText.slice(0, 50)}...`);
      }
      
      // Progress update every 5 questions
      if ((i + 1) % 5 === 0) {
        const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
        console.log(`\\n📊 Progress: ${i + 1}/${endAt.length} | ✅ ${successCount} | ❌ ${errorCount} | ⏱️  ${elapsed}m\\n`);
      }
      
    } catch (err) {
      console.error(`Question ${number} error:`, err.message);
      errorCount++;
    }
  }

  const totalMinutes = Math.round((Date.now() - startTime) / 1000 / 60);
  
  console.log('\\n🎉 ===== Translation Complete! =====');
  console.log(`📝 Total questions processed: ${endAt.length}`);
  console.log(`✅ Successfully translated: ${successCount}`);
  console.log(`❌ Translation errors: ${errorCount}`);
  console.log(`📊 Success rate: ${((successCount/(successCount + errorCount))*100).toFixed(1)}%`);
  console.log(`⏱️  Total time: ${totalMinutes} minutes`);
  console.log(`💾 Saved to: ${BILINGUAL_JSON_PATH}`);
  
  console.log('\\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});