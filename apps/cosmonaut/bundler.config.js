// bundler.config.js
// the capacitor webDir (build/www) for @aufbau/bundler: www/ as written, the
// packages its modules import by bare specifier copied in through
// ../../shared/importmap.json (only what the graph reaches), the map inlined
// into index.html, the graph checked to load offline, and whatever nothing
// reaches dropped. run from apps/cosmonaut:
//
//   node <aufbau>/bundler/cli.js bundler.config.js [source=<checkouts>]
//
// source holds one checkout per repo (aufbau, bunker, domina, htx, js-packages),
// by default the siblings of this repo. a missing repo is cloned into it.

import { relative, resolve } from 'node:path';

const root = 'www';

export default ({ source = '../../..' } = {}) => ({
  root,
  out  : '../build/www',
  copy : [{ from: 'index.html' }, { from: 'styles.css' }, { from: 'js' }],

  packages : {
    importmap : '../../../shared/importmap.json',
    clone     : 'https://github.com/Pulgasari/{repo}.git',
    source    : relative(resolve(root), resolve(source)),
    sources   : {
      '@aufbau/*'    : { repo: 'aufbau',      path: '*' },
      '@bunker/*'    : { repo: 'bunker',      path: '*' },
      '@domina/*'    : { repo: 'domina',      path: 'packages/*' },
      '@htx/*'       : { repo: 'htx',         path: 'packages/*' },
      '@pulgasari/*' : { repo: 'js-packages', path: '*' },
    },
    strict : true,
  },

  prune : {},
});
