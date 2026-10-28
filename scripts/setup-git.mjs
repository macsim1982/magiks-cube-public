#!/usr/bin/env node
import { execSync } from 'node:child_process';

// Lancé par `npm install` (prepare). Hors dépôt git (archive, CI sans .git) : rien à faire.
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
} catch {
  process.exit(0);
}

const settings = [
  ['core.hooksPath', '.githooks'],
  ['branch.main.mergeoptions', '--no-ff'],
  ['branch.develop.mergeoptions', '--no-ff'],
  ['pull.ff', 'only'],
];

for (const [key, value] of settings) {
  execSync(`git config ${key} ${value}`);
}

console.log('git : hooks gitflow actifs (.githooks), merges --no-ff sur main/develop, pull --ff-only');
