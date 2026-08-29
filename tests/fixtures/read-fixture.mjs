#!/usr/bin/env node

/* global console, process */

import { readFileSync } from 'node:fs';

console.log(
  JSON.stringify({
    cwd: process.cwd(),
    content: readFileSync('nested/input.txt', 'utf8'),
  })
);
