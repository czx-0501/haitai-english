// generate_simple.mjs — 极简版：逐词处理
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const API_KEY = 'sk-510a28e63e0048dbb0d1a9d5741a0f36';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MAX_RETRIES = 3;

const FILES = [
  { path: 'src/data/vocabulary.ts', name: 'CEFR' },
  { path: 'src/data/toefl.ts', name: 'TOEFL' },
  { path: 'src/data/ielts.ts', name: 'IELTS' },
];

// Find template words by checking ex content
function findTemplates(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const words = [];
  const rx = /"w":\s*"([^"]+)"/g;
  let m;
  while ((m = rx.exec(content)) !== null) {
    const name = m[1];
    // Skip if inside sentence context
    const pre = content.substring(Math.max(0, m.index - 200), m.index);
    const lastOpen = pre.lastIndexOf('{');
    const lastClose = pre.lastIndexOf('}');
    if (lastClose > lastOpen) continue;
    
    const after = content.substring(m.index + m[0].length, m.index + m[0].length + 500);
    const exMatch = after.match(/"ex":\s*\[([\s\S]*?)\]/);
    if (!exMatch) continue;
    if (exMatch[1].includes('I want to learn') || exMatch[1].includes('Study ') || exMatch[1].includes('\u5b66\u4e60')) {
      words.push(name);
    }
  }
  return words;
}

// Replace ex block for a word (text-based, no line tracking)
function replaceEx(content, wordName, sentences) {
  // Find the word entry (skip "w": inside sentences)
  let wordIdx = content.indexOf('"w": "' + wordName + '"');
  while (wordIdx >= 0) {
    // Check that this is a word entry (has { closer than })
    const pre = content.substring(Math.max(0, wordIdx - 200), wordIdx);
    const lastOpen = pre.lastIndexOf('{');
    const lastClose = pre.lastIndexOf('}');
    if (lastOpen > lastClose) break; // this IS a word entry
    wordIdx = content.indexOf('"w": "' + wordName + '"', wordIdx + 1);
  }
  if (wordIdx < 0) return content; // word entry not found
  
  // Find "ex": [ after this word
  const after = content.substring(wordIdx);
  const exMatch = after.match(/"ex":\s*\[/);
  if (!exMatch) return content; // no ex, skip
  
  const exStart = wordIdx + exMatch.index;
  
  // Find the matching ] of ex array
  let depth = 1;
  let inStr = false;
  let escaped = false;
  let exEnd = exStart + exMatch[0].length - 1;
  for (let k = exEnd + 1; k < content.length; k++) {
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
  
  // Build replacement
  const indent = '      ';
  const newEx = sentences.map((s, i) => {
    const comma = i < sentences.length - 1 ? ',' : '';
    return indent + '  { "e": ' + JSON.stringify(s.e) + ', "c": ' + JSON.stringify(s.c) + ' }' + comma;
  }).join('\n');
  const newBlock = indent + '"ex": [\n' + newEx + '\n' + indent + ']';
  
  return content.substring(0, exStart) + newBlock + content.substring(exEnd + 1);
}

async function generateOne(wordNames) {
  const prompt = 'Generate 2 natural example sentences with Chinese translations for each word.\n'
    + 'Return ONLY valid JSON: [{"word":"...","sentences":[{"e":"...","c":"..."},{"e":"...","c":"..."}]}]\n\n'
    + 'Words: ' + JSON.stringify(wordNames);
  
  for (let a = 0; a < MAX_RETRIES; a++) {
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || '';
      // Extract JSON array
      const jsonMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (!jsonMatch) throw new Error('No JSON');
      return JSON.parse(jsonMatch[0]);
    } catch(e) {
      if (a === MAX_RETRIES - 1) throw e;
      await new Promise(r => setTimeout(r, 5000 * (a + 1)));
    }
  }
}

async function main() {
  console.log('=== 极简版 DeepSeek 生句器 ===\n');
  
  for (const file of FILES) {
    const fullPath = resolve(ROOT, file.path);
    const tpl = findTemplates(fullPath);
    console.log(file.name + ': ' + tpl.length + ' words need AI');
    
    // Process in batches of 20
    for (let i = 0; i < tpl.length; i += 20) {
      const batch = tpl.slice(i, i + 20);
      try {
        const results = await generateOne(batch);
        if (!Array.isArray(results)) continue;
        
        let content = readFileSync(fullPath, 'utf-8');
        let count = 0;
        for (const item of results) {
          if (!item.sentences || item.sentences.length < 2) continue;
          const newContent = replaceEx(content, item.word, item.sentences.slice(0, 2));
          if (newContent !== content) {
            content = newContent;
            count++;
          }
        }
        if (count > 0) {
          writeFileSync(fullPath, content, 'utf-8');
        }
        process.stdout.write(count > 0 ? '.' : 'x');
      } catch(e) {
        process.stdout.write('F');
      }
      
      if ((i + 20) % 200 === 0) {
        const pct = Math.round(Math.min(i + 20, tpl.length) / tpl.length * 100);
        console.log(' [' + pct + '%]');
      }
    }
    console.log('\n');
  }
  
  console.log('\n=== 完成 ===');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
