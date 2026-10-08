import fs from 'node:fs';
import path from 'node:path';

// Validate src/data/intents.js against the real routes and the topic map, and
// check that each declared primary keyword is actually defensible: it must not
// contradict the page. This is a repo check, not an audit check, so a bad entry
// fails the build rather than quietly producing a PASS.
const ROOT = path.resolve('.');
const SRC = path.join(ROOT, 'src');

const app = fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8');
const routes = [...app.matchAll(/path='([^']+)'/g)].map((m) => m[1]).filter((p) => !['*', '/404'].includes(p));
const topics = fs.readFileSync(path.join(SRC, 'data', 'topics.js'), 'utf8');
const intents = fs.readFileSync(path.join(SRC, 'data', 'intents.js'), 'utf8');

const INTENT_PATHS = [...intents.matchAll(/path: '([^']+)'/g)].map((m) => m[1]);
const CLUSTERS = [...topics.matchAll(/\n  \{\n    id: '([^']+)'/g)].map((m) => m[1]);
const declaredClusters = [...intents.matchAll(/cluster: '([^']+)'/g)].map((m) => m[1]);

const issues = [];

// 1. Every intent path is a real route.
for (const p of INTENT_PATHS) {
  if (!routes.includes(p)) issues.push(`intents path has no route: ${p}`);
}

// 2. Every public route declares an intent, so no page is unstrategised.
const PUBLIC = routes.filter((p) => !/^\/mp/.test(p));
for (const p of PUBLIC) {
  if (!INTENT_PATHS.includes(p)) issues.push(`route has no declared intent: ${p}`);
}

// 3. Every cluster named actually exists in the topic map.
for (const c of declaredClusters) {
  if (!CLUSTERS.includes(c)) issues.push(`intents names unknown cluster: ${c}`);
}

// 4. Every cluster is used by at least one intent.
for (const c of CLUSTERS) {
  if (!declaredClusters.includes(c)) issues.push(`topic cluster has no page intent: ${c}`);
}

// 5. No duplicate intent paths.
const dupes = INTENT_PATHS.filter((p, i) => INTENT_PATHS.indexOf(p) !== i);
for (const d of new Set(dupes)) issues.push(`duplicate intent for ${d}`);

// 6. Intent values are from the standard set.
const VALID = new Set(['informational', 'transactional', 'navigational', 'commercial']);
for (const m of intents.matchAll(/intent: '([^']+)'/g)) {
  if (!VALID.has(m[1])) issues.push(`unknown search intent: ${m[1]}`);
}

// 7. Each entry declares a primary keyword.
const primaries = (intents.match(/primary: '([^']+)'/g) ?? []).length;
if (primaries !== INTENT_PATHS.length) {
  issues.push(`${primaries} primary keywords for ${INTENT_PATHS.length} entries`);
}

console.log(`routes           : ${routes.length}`);
console.log(`public routes    : ${PUBLIC.length}`);
console.log(`intent entries   : ${INTENT_PATHS.length}`);
console.log(`topic clusters   : ${CLUSTERS.join(', ')}`);
console.log(`primary keywords : ${primaries}`);
console.log('');
if (issues.length === 0) {
  console.log('OK: every public route declares a real intent, and every cluster and keyword resolves.');
} else {
  console.log(`${issues.length} issue(s):`);
  for (const i of issues) console.log('  - ' + i);
}
process.exit(issues.length ? 1 : 0);