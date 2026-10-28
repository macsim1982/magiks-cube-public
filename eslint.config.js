import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Sens des imports entre couches : docs/architecture/overview.md
const forbid = (layers, why) => ({
  regex: `(^|/)(${layers.join('|')})(/|$)`,
  message: `${why} (docs/architecture/overview.md#sens-des-imports)`,
});

const THREE_IN_UI = [
  { group: ['three', 'three/*', '@react-three/*', 'postprocessing'], message: 'ui ne touche pas Three.js : passer par des tokens et des callbacks.' },
];

// Le calcul pur ne connaît ni la 3D, ni React
const PURE = [
  { group: ['three', 'three/*', '@react-three/*', 'postprocessing', 'react', 'react-dom', 'react-dom/*'], message: 'Calcul pur : ni Three.js ni React, un adaptateur de puzzles/render ou de scene/ le fait.' },
];

const layerRules = [
  { files: ['src/scene/**'], patterns: [forbid(['app', 'ui', 'learn', 'scan', 'vendor'], 'scene compose la 3D, sans UI ni app')] },
  { files: ['src/puzzles/**'], patterns: [forbid(['app', 'ui', 'scene', 'learn', 'scan'], 'puzzles ne connaît pas l’écran ni les leçons')] },
  { files: ['src/puzzles/core/**'], patterns: [forbid(['app', 'ui', 'scene', 'learn', 'scan', 'render', 'vendor'], 'puzzles/core est le calcul pur, sans rendu'), ...PURE] },
  { files: ['src/learn/**'], patterns: [forbid(['app', 'ui', 'scene', 'look', 'scan', 'vendor'], 'learn = contenu et guides, sur puzzles seulement')] },
  { files: ['src/scan/**'], patterns: [forbid(['app', 'ui', 'scene', 'look', 'learn', 'vendor'], 'scan = lecture pure du cube, sur puzzles seulement')] },
  { files: ['src/look/**'], patterns: [forbid(['app', 'ui', 'scene', 'puzzles', 'learn', 'scan', 'vendor'], 'look n’importe que lib')] },
  { files: ['src/ui/**'], patterns: [forbid(['app', 'scene', 'vendor'], 'ui ne connaît ni la scène ni app'), ...THREE_IN_UI] },
  // Un composant, une icône, un hook d’UI sont génériques : ni domaine, ni module
  {
    files: ['src/ui/components/**', 'src/ui/icons/**', 'src/ui/hooks/**'],
    patterns: [forbid(['app', 'scene', 'vendor', 'learn', 'puzzles', 'look', 'scan', 'modules'], 'ui/components, icons et hooks sont génériques'), ...THREE_IN_UI],
  },
  { files: ['src/lib/**'], patterns: [forbid(['app', 'ui', 'scene', 'puzzles', 'look', 'learn', 'scan', 'vendor'], 'lib n’importe rien du projet')] },
  { files: ['src/lib/math/**'], patterns: [forbid(['app', 'ui', 'scene', 'puzzles', 'look', 'learn', 'scan', 'vendor', 'dom'], 'lib/math est pur, sans DOM'), ...PURE] },
].map(({ files, patterns }) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
}));

// Un module de l’UI n’importe pas un autre module : app/ les assemble
//. Le chemin est résolu : `../play` et `../../modules/play` sont pris tous les deux.
const SRC = fileURLToPath(new URL('./src', import.meta.url));
const MODULES = join(SRC, 'ui/modules');
const moduleOf = (file) => {
  const path = relative(MODULES, file);
  return path.startsWith('..') ? null : path.split('/')[0];
};
const moduleBoundaries = {
  meta: {
    type: 'problem',
    messages: {
      cross: 'Le module {{from}} n’importe pas le module {{to}} : app/ les assemble ; un morceau partagé va dans ui/components.',
    },
  },
  create(context) {
    const from = moduleOf(context.filename);
    const check = (node) => {
      const source = node.source?.value;
      if (!from || typeof source !== 'string') return;
      if (!source.startsWith('.') && !source.startsWith('@/')) return;
      const target = source.startsWith('@/') ? join(SRC, source.slice(2)) : resolve(dirname(context.filename), source);
      const to = moduleOf(target);
      if (to && to !== from) context.report({ node, messageId: 'cross', data: { from, to } });
    };
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};
const moduleRules = {
  files: ['src/ui/modules/**'],
  plugins: { local: { rules: { 'module-boundaries': moduleBoundaries } } },
  rules: { 'local/module-boundaries': 'error' },
};

// Forme des fonctions : 3 paramètres, 60 lignes, complexité 12,
// 3 niveaux. Partout en erreur depuis le lot E.
const shapeRules = {
  files: ['src/**/*.{js,jsx}'],
  ignores: ['src/**/*.test.js'],
  rules: {
    'max-params': ['error', 3],
    'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
    complexity: ['error', 12],
    'max-depth': ['error', 3],
  },
};

export default [
  { ignores: ['dist/', 'node_modules/', 'src/vendor/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.worker.js'],
    languageOptions: { globals: { ...globals.worker } },
  },
  {
    files: ['scripts/**', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  ...layerRules,
  moduleRules,
  shapeRules,
];
