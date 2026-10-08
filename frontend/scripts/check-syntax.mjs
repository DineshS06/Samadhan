#!/usr/bin/env node
/**
 * Parse every JSX/JS file with Babel to catch syntax errors before Vite does.
 * Exits non-zero when any file fails to parse.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src');

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jsx|js)$/.test(entry.name)) files.push(full);
  }
})(srcDir);

let failed = 0;
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  try {
    parse(code, { sourceType: 'module', plugins: ['jsx'] });
    console.log('ok   ' + path.relative(root, file));
  } catch (e) {
    failed++;
    console.log('FAIL ' + path.relative(root, file) + '\n     ' + e.message.split('\n')[0]);
  }
}
console.log('\n' + files.length + ' files checked, ' + failed + ' failed');
process.exit(failed ? 1 : 0);