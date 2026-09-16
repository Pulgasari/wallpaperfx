#!/usr/bin/env node
// compiles each app's styles.aufbau.css (aufbau style sheets — a css superset)
// to www/styles.css using the vendored @aufbau/ass compiler. build-time only:
// the source lives at the app root (not in www/, so it never ships in the apk)
// and the generated www/styles.css is committed and copied into the apk by
// `cap sync`.
//
// usage:
//   node tools/build-css.mjs [app ...]        compile once (default: every app
//                                             that has a styles.aufbau.css)
//   node tools/build-css.mjs --watch [app ...] recompile on every save; leave it
//                                             running while editing, then commit

import { readFileSync, writeFileSync, existsSync, readdirSync, watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compile } from './ass/index.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appsDir = join(root, 'apps');
const SRC = 'styles.aufbau.css';

const argv = process.argv.slice(2);
const isWatch = argv.includes('--watch') || argv.includes('-w');
const only = argv.filter(a => a !== '--watch' && a !== '-w');

const hasSource = name => existsSync(join(appsDir, name, SRC));
const apps = (only.length ? only : readdirSync(appsDir, { withFileTypes: true })
  .filter(d => d.isDirectory()).map(d => d.name)).filter(hasSource);

const stamp = () => new Date().toTimeString().slice(0, 8);

function buildOne (name) {
  try {
    const css = compile(readFileSync(join(appsDir, name, SRC), 'utf8'));
    writeFileSync(join(appsDir, name, 'www', 'styles.css'), css);
    console.log(`${stamp()}  built ${name}/www/styles.css (${css.length} bytes)`);
  } catch (e) {
    console.error(`${stamp()}  error ${name}: ${e.message}`);
  }
}

if (!apps.length) { console.log(`no ${SRC} sources found`); process.exit(0); }

for (const name of apps) buildOne(name);

if (isWatch) {
  // watch the app dir (not the file) so editor atomic saves (write temp + rename
  // over the source) keep firing; debounce the burst of events per app. writing
  // www/styles.css lives in a subdir, so it never retriggers this watch.
  for (const name of apps) {
    let timer;
    watch(join(appsDir, name), (_event, filename) => {
      if (filename && filename !== SRC) return;
      clearTimeout(timer);
      timer = setTimeout(() => buildOne(name), 80);
    });
  }
  console.log(`watching ${apps.join(', ')} — edit ${SRC}, ctrl-c to stop`);
}
