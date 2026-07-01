// generate_pipe.mjs — 管道符格式，不用 JSON
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const API_KEY = 'sk-510a28e63e0048dbb0d1a9d5741a0f36';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

const FILES = [
  { path: 'src/data/vocabulary.ts', name: 'CEFR', batch: 20 },
  { path: 'src/data/toefl.ts', name: 'TOEFL', batch: 20 },
  { path: 'src/data/ielts.ts', name: 'IELTS', batch: 20 },
];

function findTemplates(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const words = [];
  const rx = /"w":\s*"([^"]+)"/g;
  let m;
  while ((m = rx.exec(content)) !== null) {
    const pre = content.substring(Math.max(0, m.index - 200), m.index);
    if (pre.lastIndexOf('}') > pre.lastIndexOf('{')) continue;
    
    const after = content.substring(m.index + m[0].length, m.index + m[0].length + 500);
    const exMatch = after.match(/"ex":\s*\[([\s\S]*?)\]/);
    if (exMatch && (exMatch[1].includes('I want to learn') || exMatch[1].includes('Study '))) {
      words.push(m[1]);
    }
  }
  return words;
}

function replaceEx(content, wordName, sentences) {
  let wordIdx = content.indexOf('"w": "' + wordName + '"');
  while (wordIdx >= 0) {
    // Verify it's a word entry: followed by "p":
    const afterCheck = content.substring(wordIdx, wordIdx + 50);
    if (afterCheck.match(/"w":\s*"[^"]+",\s*"p":/)) break;
    wordIdx = content.indexOf('"w": "' + wordName + '"', wordIdx + 1);
  }
  if (wordIdx < 0) return content;
  
  const after = content.substring(wordIdx);
  const exMatch = after.match(/"ex":\s*\[/);
  if (!exMatch) return content;
  const exStart = wordIdx + exMatch.index;
  
  let depth = 0, inStr = false, escaped = false;
  let exEnd = exStart + exMatch[0].length - 1;
  // Safety limit: ex arrays shouldn't be > 500 chars
  const maxScan = Math.min(exStart + 500, content.length);
  for (let k = exEnd; k < maxScan; k++) {
    const c = content[k];
    if (escaped) { escaped = false; continue; }
    if (c === '\\' && inStr) { escaped = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '[') depth++;
    if (c === ']') { depth--; if (depth === 0) { exEnd = k; break; } }
  }
  
  const indent = '      ';
  const newEx = sentences.map((s, i) => {
    const comma = i < sentences.length - 1 ? ',' : '';
    // Strip all quotes from translations to prevent parser errors
    const e = s.e.replace(/["“”‘’]/g, '').trim();
    const c = s.c.replace(/["“”‘’]/g, '').trim();
    return indent + '  { "e": "' + e + '", "c": "' + c + '" }' + comma;
  }).join('\n');
  const newBlock = indent + '"ex": [\n' + newEx + '\n' + indent + ']';
  
  return content.substring(0, exStart) + newBlock + content.substring(exEnd + 1);
}

async function callAPI(words) {
  const prompt = 'For each word, give 2 short example sentences with Chinese translations.\n'
    + 'Use this EXACT format:\n'
    + 'word||sentence1_en||sentence1_zh||sentence2_en||sentence2_zh\n\n'
    + 'Words: ' + JSON.stringify(words);
  
  for (let a = 0; a < 3; a++) {
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      // Parse pipe format: word||en1||zh1||en2||zh2||word2||...
      // Split and trim each field, handling potential newlines
      const textClean = text.replace(/\n/g, ' ').replace(/\r/g, '');
      const parts = textClean.split('||').map(s => s.trim());
      const results = [];
      for (let i = 0; i + 4 < parts.length; i += 5) {
        if (parts[i] && parts[i+1] && parts[i+2]) {
          results.push({
            word: parts[i],
            sentences: [
              { e: parts[i+1], c: parts[i+2] },
              { e: parts[i+3] && parts[i+4] ? parts[i+3] : parts[i+1], 
                c: parts[i+3] && parts[i+4] ? parts[i+4] : parts[i+2] },
            ]
          });
        }
      }
      if (results.length > 0) return results;
      throw new Error('No parseable results. Text: ' + text.slice(0, 100));
    } catch(e) {
      if (a === 2) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function main() {
  console.log('=== 海苔英语 例句生成器 (管道符版) ===\n');
  
  for (const file of FILES) {
    const fullPath = resolve(ROOT, file.path);
    console.log('Scanning ' + file.name + '...');
    const tpl = findTemplates(fullPath);
    console.log(file.name + ': ' + tpl.length + ' words need AI\n');
    
    let success = 0, fail = 0;
    
    for (let i = 0; i < tpl.length; i += file.batch) {
      const batch = tpl.slice(i, i + file.batch);
      
      try {
        const results = await callAPI(batch);
        if (!Array.isArray(results) || results.length === 0) {
          fail += batch.length;
          process.stdout.write('E');
          continue;
        }
        
        let content = readFileSync(fullPath, 'utf-8');
        let written = 0;
        
        for (const item of results) {
          if (!item.sentences || item.sentences.length < 2) continue;
          const newContent = replaceEx(content, item.word, item.sentences.slice(0, 2));
          if (newContent !== content) {
            content = newContent;
            written++;
          }
        }
        
        if (written > 0) {
          writeFileSync(fullPath, content, 'utf-8');
          success += written;
          process.stdout.write('.');
        } else {
          fail += batch.length;
          process.stdout.write('-');
        }
      } catch(e) {
        fail += batch.length;
        process.stdout.write('F');
        console.log('\nBatch ' + Math.floor(i / file.batch) + ' failed:', e.message.slice(0, 80));
      }
      
      if ((i + file.batch) % 200 === 0 || i + file.batch >= tpl.length) {
        const pct = Math.round(Math.min(i + file.batch, tpl.length) / tpl.length * 100);
        console.log(' ' + pct + '% (' + Math.min(i + file.batch, tpl.length) + '/' + tpl.length + ')');
      }
    }
    
    console.log('\n' + file.name + ' done: ' + success + ' ok, ' + fail + ' failed\n');
  }
  
  console.log('=== 全部完成 ===');
}

main().catch(e => { console.error('\nFATAL:', e); });
