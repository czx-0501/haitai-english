/**
 * generate_turbo.mjs — 高速例句生成
 *
 * 对比旧脚本的核心改进：
 *   - batch 30, 并发 6（旧版：batch 5-20, 并发 1-3）
 *   - 管道符格式，避免 JSON 解析问题
 *   - 自动跳过坏词（≤2 字符、全大写缩写等），不浪费 API
 *   - 失败只重试 1 次，不再 3 次死磕
 *   - 每 300 词才写一次文件，减少磁盘 I/O
 *   - 记录 skip.json 持久化跳过名单
 *   - 6 个 worker 流水线式拉取，不互相等待
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SKIP_FILE = resolve(__dirname, 'skip.json');

const API_KEY = 'sk-510a28e63e0048dbb0d1a9d5741a0f36';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BATCH = 15;
const CONCURRENCY = 6;
const WRITE_INTERVAL = 150;

const FILES = [
  { path: 'src/data/vocabulary.ts', name: 'CEFR' },
  { path: 'src/data/toefl.ts', name: 'TOEFL' },
  { path: 'src/data/ielts.ts', name: 'IELTS' },
];

// ---------------------------------------------------------------
// 坏词过滤 — 这些词 DeepSeek 要么不认识要么生成垃圾，跳过
// ---------------------------------------------------------------
const HARD_SKIP = new Set([
  // 3 字母以内（缩写、单字母）
  'lua','rmd','hwy','arb','cvb','myr','jpn','tin','any','ibi',
  'hsb','wuc','mvs','sen','all','kwa','via','puy','gdc','mys',
  'tyc','srr','vep','weu','fiv','swf','dbq','ihm','sde','omi',
  'wlp','clp','caz','cgs','kolm','lask','gcb','rcl','dirk','pam',
  'lvm','nsa','lpg','ctv','gmt','nmd','ltd','diy','aim','dna',
  'rna','usb','cpu','gpu','ram','rom','iso','pdf','exe','app',
  'adp','amp','bam','fps','mph','rpm','doj','fcc','fda','epa',
  'cia','fbi','irs','nba','nfl','mlb','nhl','ncaa','fifa','unesco',
  // 全大写缩写
  'mtbs','fnac','lsat','fmla','nopa','gamc','pvdc','btx','nwtf',
  'ppis','otb','odbs','cga','rwm','dnc','gpe','wraf','escs','disp',
  'caira','pawa','sebba','biber','peig','rold','menc','fari','nonet',
  'vigy','isec','distr','nsec','schiz','bootp','foth','furth',
  'pikas','vep','weu','srr','tyc','mvs','rwm','ngb','rwb','fiv',
  'dbq','guze','wraf','ihm','escs','sde','wlp','klamm','snub',
  'whate','kwok','boito','monos','pocks','stahl','gabba','kopec',
  // 人名 / 品牌 / 地区名
  'helen','edgar','oprah','mabel','dirk','irma','tomek','vader',
  'mauer','poppy','ellis','arieh','hyde','baoji','torry','peel',
  'mayo','mazur','zante','raffe','hyden','matha','rymer','reo',
  'loel','dogra','porac','pekka','burts','tano','menc','sfeir',
  'iraqi','bubu','nedo','thoro','gippo','oplan','mys','sethe',
  'hijaz','irmo','peig','shera','doula','suter','mabel','loel',
  'mazur','zante','raffe','hyden','matha','rymer','reo','phyo',
  'wales','reno','ellis','obie','boito','molas','owlet','coppr',
  'leers','gumby','ceils','coion','zorra','ivry','loman','veau',
  'nyit','hawed','caver','ritts','padri','jei','duit','puy',
  'poing','oplan',
  // 有歧义的普通词
  'doing','mile','spawn','kink','erect','rope','deals',
  'wilt','torry','all','any',
]);

// ---------------------------------------------------------------
// Skip list 持久化
// ---------------------------------------------------------------
let _skipCache = new Set();
if (existsSync(SKIP_FILE)) {
  try {
    _skipCache = new Set(JSON.parse(readFileSync(SKIP_FILE, 'utf-8')));
    console.log(`Loaded ${_skipCache.size} previously skipped words`);
  } catch {}
}

function saveSkip(word) {
  _skipCache.add(word);
  try {
    writeFileSync(SKIP_FILE, JSON.stringify([..._skipCache]), 'utf-8');
  } catch {}
}

function shouldSkip(word) {
  if (HARD_SKIP.has(word)) return true;
  if (_skipCache.has(word)) return true;
  if (word.length <= 2) return true;
  if (word.length <= 5 && /^[A-Z]+$/.test(word)) return true;
  return false;
}

// ---------------------------------------------------------------
// 扫描模板词
// ---------------------------------------------------------------
function findTemplates(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const words = [];
  const rx = /"w":\s*"([^"]+)"/g;
  let m;
  while ((m = rx.exec(content)) !== null) {
    const name = m[1];
    if (shouldSkip(name)) continue;

    // Make sure this is a word entry (has { closer than } before it)
    const pre = content.substring(Math.max(0, m.index - 200), m.index);
    if (pre.lastIndexOf('}') > pre.lastIndexOf('{')) continue;

    const after = content.substring(m.index + m[0].length, m.index + m[0].length + 500);
    const exMatch = after.match(/"ex":\s*\[([\s\S]*?)\]/);
    if (!exMatch) continue;

    const exContent = exMatch[1];
    if (/(?:I want to learn about|We need to (?:focus|check|aggregate|aggrege)|Study )/.test(exContent)) {
      words.push(name);
    }
  }
  return words;
}

// ---------------------------------------------------------------
// 替换例句
// ---------------------------------------------------------------
function replaceEx(content, wordName, sentences) {
  let wordIdx = content.indexOf('"w": "' + wordName + '"');
  while (wordIdx >= 0) {
    const pre = content.substring(Math.max(0, wordIdx - 200), wordIdx);
    if (pre.lastIndexOf('{') > pre.lastIndexOf('}')) break;
    wordIdx = content.indexOf('"w": "' + wordName + '"', wordIdx + 1);
  }
  if (wordIdx < 0) return null;

  const after = content.substring(wordIdx);
  const exMatch = after.match(/"ex":\s*\[/);
  if (!exMatch) return null;

  const exStart = wordIdx + exMatch.index;
  let depth = 0, inStr = false, escaped = false;
  let exEnd = exStart + exMatch[0].length - 1;
  for (let k = exEnd; k < content.length; k++) {
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
    const esc = t => t.replace(/["""]/g, '').trim();
    return indent + '  { "e": "' + esc(s.e) + '", "c": "' + esc(s.c) + '" }' + comma;
  }).join('\n');
  const newBlock = indent + '"ex": [\n' + newEx + '\n' + indent + ']';

  return content.substring(0, exStart) + newBlock + content.substring(exEnd + 1);
}

// ---------------------------------------------------------------
// API 调用 (管道符格式)
// ---------------------------------------------------------------
async function callAPI(words) {
  const prompt = 'Give 2 short natural example sentences with Chinese translations.\n'
    + 'For very rare words, use definitions or context (they are real words).\n'
    + 'Use exactly this format, one word per line:\n'
    + 'word||en_sentence_1||zh_translation_1||en_sentence_2||zh_translation_2\n\n'
    + 'Words: ' + JSON.stringify(words);

  for (let attempt = 0; attempt < 2; attempt++) {
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
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
     let text = data.choices?.[0]?.message?.content || '';
     text = text.replace(/```[\s\S]*?```/g, '').replace(/\r/g, '');
      // Normalize |||| separator to newlines (DeepSeek uses this in large batches)
      text = text.replace(/\|\|\|\|/g, '\n');

      const results = [];
      for (const line of text.split('\n')) {
        const parts = line.split('||').map(s => s.trim());
        if (parts.length >= 5 && parts[0] && parts[1] && parts[2]) {
          results.push({
            word: parts[0],
            sentences: [
              { e: parts[1], c: parts[2] },
              { e: parts[3] || parts[1], c: parts[4] || parts[2] },
            ],
          });
        }
      }
      if (results.length > 0) return results;
    } catch (e) {
      if (attempt === 1) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return [];
}

// ---------------------------------------------------------------
// 处理一个文件
// ---------------------------------------------------------------
async function processFile(fileData) {
  const fullPath = resolve(ROOT, fileData.path);
  console.log(`\n——— ${fileData.name} ———`);

  const tpl = findTemplates(fullPath);
  console.log(`  ${tpl.length} words need AI sentences`);
  if (tpl.length === 0) return;

  // Split into batches
  const batches = [];
  for (let i = 0; i < tpl.length; i += BATCH) batches.push(tpl.slice(i, i + BATCH));

  let index = 0;
  const total = batches.length;
  let pending = [];
  let wrote = 0;
  let failed = 0;
  let failedWords = [];

  async function flush() {
    if (pending.length === 0) return;
    const batch = pending.splice(0, pending.length);
    let content = readFileSync(fullPath, 'utf-8');
    batch.sort((a, b) => {
      return content.indexOf('"w": "' + b.word + '"') - content.indexOf('"w": "' + a.word + '"');
    });
    let n = 0;
    for (const item of batch) {
      const nc = replaceEx(content, item.word, item.sentences);
      if (nc) { content = nc; n++; }
    }
    writeFileSync(fullPath, content, 'utf-8');
    wrote += n;
    const pct = Math.round(wrote / tpl.length * 100);
    console.log(`    [${pct}%] wrote ${n}, total ${wrote}/${tpl.length}, failed ${failed}`);
  }

  async function worker() {
    while (index < total) {
      const batchIdx = index++;
      const batch = batches[batchIdx];
      try {
        const results = await callAPI(batch);
        if (results && results.length > 0) {
          pending.push(...results);
          failed += batch.length - results.length;
        } else {
          failed += batch.length;
        }
      } catch (e) {
        failed += batch.length;
        failedWords.push(...batch);
        batch.forEach(w => saveSkip(w));
        process.stdout.write('F');
      }
      if (pending.length >= WRITE_INTERVAL) flush();
    }
  }

  const poolSize = Math.min(CONCURRENCY, total);
  const workers = Array.from({ length: poolSize }, () => worker());
  await Promise.all(workers);

  await flush();

  console.log(`  ${fileData.name} done: ${wrote} written, ${failed} failed`);
  if (failedWords.length > 0) {
    console.log(`  Failed words (${failedWords.length}): ${failedWords.slice(0, 10).join(', ')}${failedWords.length > 10 ? '...' : ''}`);
  }
}

// ---------------------------------------------------------------
// 入口
// ---------------------------------------------------------------
async function main() {
  console.log('=== Turbo 例句生成器 ===');
  console.log(`Batch=${BATCH}  Concurrency=${CONCURRENCY}  WriteInterval=${WRITE_INTERVAL}\n`);

  const start = Date.now();
  for (const file of FILES) {
    await processFile(file);
  }
  const sec = Math.round((Date.now() - start) / 1000);
  console.log(`\n=== Done in ${Math.floor(sec / 60)}m ${sec % 60}s ===`);
}

main().catch(e => { console.error('\nFATAL:', e); process.exit(1); });
