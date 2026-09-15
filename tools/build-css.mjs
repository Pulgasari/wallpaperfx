#!/usr/bin/env node
// compiles each app's styles.ass (aufbau style sheets) to www/styles.css using
// the vendored @aufbau/ass compiler. build-time only: the .ass source lives at
// the app root (not in www/, so it never ships in the apk) and the generated
// css is committed and copied into the apk by `cap sync`.
//
// usage:
//   node tools/build-css.mjs [--check] [app ...]
//   (no app args -> every apps/<app> that has a styles.ass)
//   --check  compile and compare to the committed css, exit 1 on drift (for ci)

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compile } from './ass/index.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appsDir = join(root, 'apps');

const args = process.argv.slice(2);
const check = args.includes('--check');
const only = args.filter(a => a !== '--check');

// an app is buildable when apps/<app>/styles.ass exists; www/styles.css is output.
function targets () {
  const names = only.length ? only : readdirSync(appsDir, { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name);
  return names
    .map(name => ({ name, src: join(appsDir, name, 'styles.ass'), out: join(appsDir, name, 'www', 'styles.css') }))
    .filter(t => existsSync(t.src));
}

const list = targets();
if (!list.length) { console.log('no styles.ass sources found'); process.exit(0); }

let drift = 0;
for (const t of list) {
  const css = compile(readFileSync(t.src, 'utf8'));
  if (check) {
    const have = existsSync(t.out) ? readFileSync(t.out, 'utf8') : '';
    if (have !== css) { drift++; console.error(`drift: ${t.name}/www/styles.css is stale (run: node tools/build-css.mjs ${t.name})`); }
    else console.log(`ok: ${t.name}`);
  } else {
    writeFileSync(t.out, css);
    console.log(`built: ${t.name}/www/styles.css (${css.length} bytes)`);
  }
}
if (check && drift) process.exit(1);
