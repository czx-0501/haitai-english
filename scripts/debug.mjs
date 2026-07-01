
import { readFileSync } from 'fs';
const content = readFileSync('src/data/vocabulary.ts', 'utf-8');
const lines = content.split('\n');

let inWords = false;
let wordCount = 0;
let dayCount = 0;

for (let i = 0; i < 200; i++) {
  const trimmed = lines[i].trim();
  if (trimmed.startsWith('"words":')) { inWords = true; console.log('Line ' + i + ': words start'); }
  if (inWords && trimmed === ']') { inWords = false; console.log('Line ' + i + ': words end'); }
  if (inWords) {
    const m = trimmed.match(/^\{\s*"w":\s*"([^"]+)"/);
    if (m) { wordCount++; if (wordCount <= 3) console.log('Line ' + i + ': word=' + m[1]); }
  }
}
console.log('Total words found in first 200 lines: ' + wordCount);
