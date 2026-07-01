// generate_sentences.mjs v3 — Text-based replacement (no line shift bugs)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROGRESS_FILE = resolve(ROOT, 'scripts/progress.json');

const API_KEY = 'sk-510a28e63e0048dbb0d1a9d5741a0f36';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BATCH_SIZE = 50;
const MAX_RETRIES = 3;
const CONCURRENCY = 3;

const FILES = [
  { path: 'src/data/vocabulary.ts', name: 'CEFR' },
  { path: 'src/data/toefl.ts', name: 'TOEFL' },
  { path: 'src/data/ielts.ts', name: 'IELTS' },
];

// Scan for all template words in a file
function findTemplateWords(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const words = [];
  const regex = /\{ "w": "([^"]+)"([\s\S]*?)"ex":\s*\[([\s\S]*?)\]\s*\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const word = { name: match[1], matchStart: match.index, matchEnd: match.index + match[0].length };
    word.template = match[3].includes('I want to learn about');
    words.push(word);
  }
  return words;
}

// Find and replace ex block for a specific word in the content
function replaceExForWord(content, wordName, sentences) {
  // Find "w": "wordName" in content (works regardless of { placement)
  const searchStr = '"w": "' + wordName + '"';
  const wordIdx = content.indexOf(searchStr);
  if (wordIdx < 0) throw new Error('Word "' + wordName + '" not found in file');
  
  // From word position, scan forward to find "ex": [
  const fromWord = content.substring(wordIdx);
  const exMatch = fromWord.match(/"ex"\s*:\s*\[/);
  if (!exMatch) throw new Error('Word "' + wordName + '" has no ex array');
  
  const exStart = wordIdx + exMatch.index;
  
  // Count brackets to find ex end (corrected: depth=0, only check on ])
  let depth = 0;
  let inStr = false;
  let escaped = false;
  let exEnd = exStart + exMatch[0].length - 1;
  for (let k = exStart + exMatch[0].length - 1; k < content.length; k++) {
    const c = content[k];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inStr) { escaped = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '[') depth++;
    if (c === ']') {
      depth--;
      if (depth === 0) { exEnd = k; break; }
    }
  }
  
  // Build new ex content
  const newEx = sentences.map((s, i) => {
    const comma = i < sentences.length - 1 ? ',' : '';
    return '      { "e": ' + JSON.stringify(s.e) + ', "c": ' + JSON.stringify(s.c) + ' }' + comma;
  }).join('\\n');
  
  const newBlock = '"ex": [\\n' + newEx + '\\n      ]';
  return content.substring(0, exStart) + newBlock + content.substring(exEnd + 1);
}
async function extractJSON(text) {
  let s = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let match = s.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (match) { try { return JSON.parse(match[0]); } catch(e) {} }
  match = s.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) { try { return JSON.parse(match[0]); } catch(e) {} }
  try { return JSON.parse(s); } catch(e) {}
  return null;
}

async function generateBatch(words) {
  const wordList = words.map(w => w.name);
  const prompt = 'Generate 2 natural example sentences with Chinese translations for each word.\n'
    + 'Return ONLY a valid JSON array, no other text.\n'
    + 'Format: [{"word":"...","sentences":[{"e":"...","c":"..."},{"e":"...","c":"..."}]}]\n\n'
    + 'Words: ' + JSON.stringify(wordList);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 8192,
        }),
        signal: AbortSignal.timeout(90000),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status + ': ' + (await resp.text()));
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      const result = await extractJSON(text);
      if (!result) throw new Error('Failed to parse JSON. Response: ' + text.substring(0, 150));
      return result;
    } catch (e) {
      if (attempt === MAX_RETRIES - 1) throw e;
      console.log('  R' + (attempt + 1) + ': ' + e.message.substring(0, 60));
      await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
    }
  }
}

async function processFile(resultItems, filePath) {
  if (resultItems.length === 0) return;
  console.log('  Writing ' + resultItems.length + ' words to ' + filePath.split('/').pop());
  let content = readFileSync(filePath, 'utf-8');
  // Sort bottom-up to preserve positions
  const sorted = [...resultItems].sort((a, b) => {
    const aPos = content.indexOf('"w": "' + a.word + '"');
    const bPos = content.indexOf('"w": "' + b.word + '"');
    return bPos - aPos;
  });
  for (const item of sorted) {
    try {
      const newContent = replaceExForWord(content, item.word, item.sentences);
      if (newContent !== content) content = newContent;
    } catch(e) {
      console.log('    Skipped ' + item.word + ': ' + e.message.substring(0, 40));
    }
  }
  writeFileSync(filePath, content, 'utf-8');
}

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { generated: [], failed: [], currentFile: 0, currentWord: 0 };
}

function saveProgress(p) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2), 'utf-8');
}

async function main() {
  console.log('=== DeepSeek 例句生成器 v3 ===\n');
  
  const progress = loadProgress();
  const allWords = [];

  for (const file of FILES) {
    const fullPath = resolve(ROOT, file.path);
    const words = findTemplateWords(fullPath);
    const templateWords = words.filter(w => w.template);
    console.log(file.name + ': ' + words.length + ' words, ' + templateWords.length + ' need AI');
    allWords.push({ file: fullPath, name: file.name, words: templateWords, index: 0 });
  }

  let totalNeeded = allWords.reduce((s, f) => s + f.words.length, 0);
  console.log('\nTotal: ' + totalNeeded + ' words need generation\n');

  if (totalNeeded === 0) { console.log('Nothing to do!'); return; }

  // Process file by file
  for (const fileData of allWords) {
    if (fileData.words.length === 0) continue;
    console.log('\n--- Processing ' + fileData.name + ' (' + fileData.words.length + ' words) ---');
    
    const words = fileData.words;
    let generated = (progress.currentFile === fileData.name) ? progress.generated?.length || 0 : 0;
    
    for (let i = 0; i < words.length; i += BATCH_SIZE * CONCURRENCY) {
      const batchPromises = [];
      const batchResults = [];

      for (let j = 0; j < CONCURRENCY && i + j * BATCH_SIZE < words.length; j++) {
        const start = i + j * BATCH_SIZE;
        const batch = words.slice(start, start + BATCH_SIZE);
        
        batchPromises.push(
          generateBatch(batch).then(async results => {
            if (!Array.isArray(results)) { process.stdout.write('E'); return; }
            for (const item of results) {
              if (item.sentences && item.sentences.length >= 2) {
                batchResults.push({
                  word: item.word,
                  sentences: item.sentences.slice(0, 2),
                });
              }
            }
            process.stdout.write('.');
          }).catch(e => {
            process.stdout.write('F');
            console.log('\n  Batch failed: ' + e.message.substring(0, 80));
          })
        );
      }

      if (batchPromises.length === 0) continue;
      await Promise.allSettled(batchPromises);

      if (batchResults.length > 0) {
        await processFile(batchResults, fileData.file);
        console.log(' (' + batchResults.length + ' written)');
      }

      // Progress and ETA
      const done = i + BATCH_SIZE * CONCURRENCY;
      const pct = Math.round(done / words.length * 100);
      const elapsed = process.uptime();
      const rate = done / elapsed;
      const eta = rate > 0 ? Math.round((words.length - done) / rate / 60) : '?';
      console.log('  [' + pct + '%] ' + Math.min(done, words.length) + '/' + words.length + ' done, ~' + eta + 'min remaining');
      
      saveProgress({ currentFile: fileData.name, generated: null });
    }
  }

  const totalTime = Math.round(process.uptime() / 60);
  console.log('\n=== Done in ' + totalTime + 'min ===');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
