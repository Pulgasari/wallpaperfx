#!/usr/bin/env node
// compiles each app's styles.aufbau.css (aufbau style sheets — a css superset)
// to www/styles.css using the vendored @aufbau/ass compiler. build-time only:
// the source lives at the app root (not in www/, so it never ships in the apk)
// and the generated www/styles.css is committed and copied into the apk by
// `cap sync`.
//
// usage: node tools/build-css.mjs [app ...]   (no args -> every app that has a
//        styles.aufbau.css). edit the source, rerun this, commit both.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compile } from './ass/index.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appsDir = join(root, 'apps');
const SRC = 'styles.aufbau.css';

const only = process.argv.slice(2);
const names = only.length ? only : readdirSync(appsDir, { withFileTypes: true })
  .filter(d => d.isDirectory()).map(d => d.name);

let built = 0;
for (const name of names) {
  const src = join(appsDir, name, SRC);
  if (!existsSync(src)) continue;
  const css = compile(readFileSync(src, 'utf8'));
  writeFileSync(join(appsDir, name, 'www', 'styles.css'), css);
  console.log(`built: ${name}/www/styles.css (${css.length} bytes)`);
  built++;
}
if (!built) console.log(`no ${SRC} sources found`);
