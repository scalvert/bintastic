import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* global process, URL */

const root = fileURLToPath(new URL('..', import.meta.url));
const workspace = mkdtempSync(path.join(tmpdir(), 'bintastic-package-'));
const consumer = path.join(workspace, 'consumer');

try {
  const npm = process.env.npm_execpath ?? 'npm';
  const npmOptions = ['--cache', path.join(workspace, 'npm-cache')];
  execFileSync(npm, [...npmOptions, 'pack', '--loglevel=error', '--pack-destination', workspace], {
    cwd: root,
    stdio: 'inherit',
  });
  const { name, version } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const tarball = path.join(workspace, `${name}-${version}.tgz`);

  execFileSync(
    npm,
    [...npmOptions, 'install', '--ignore-scripts', '--no-save', '--prefix', consumer, tarball],
    {
      cwd: root,
      stdio: 'inherit',
    }
  );

  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      'import { text } from "bintastic"; if (text`value=${42}` !== "value=42") process.exit(1);',
    ],
    { cwd: consumer, stdio: 'inherit' }
  );

  execFileSync(
    process.execPath,
    [
      '-e',
      'const { text } = require("bintastic"); if (text`value=${42}` !== "value=42") process.exit(1);',
    ],
    { cwd: consumer, stdio: 'inherit' }
  );

  writeFileSync(
    path.join(consumer, 'consumer.mts'),
    'import { text } from "bintastic"; const value: string = text`value=${42}`; void value;'
  );
  writeFileSync(
    path.join(consumer, 'consumer.cts'),
    'import { text } from "bintastic"; const value: string = text`value=${42}`; void value;'
  );
  execFileSync(
    path.join(root, 'node_modules/.bin/tsc'),
    [
      '--noEmit',
      '--ignoreConfig',
      '--skipLibCheck',
      '--typeRoots',
      path.join(root, 'node_modules/@types'),
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      path.join(consumer, 'consumer.mts'),
      path.join(consumer, 'consumer.cts'),
    ],
    { cwd: consumer, stdio: 'inherit' }
  );
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
