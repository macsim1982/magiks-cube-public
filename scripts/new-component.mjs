#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `component` : un composant générique dans son dossier, style à côté ;
// `module/<nom>` : un morceau d’un module de l’UI, à plat dans le module
const LAYERS = {
  app: { dir: 'src/app', barrel: null },
  scene: { dir: 'src/scene', barrel: 'src/scene/index.js' },
  effects: { dir: 'src/scene/effects', barrel: null, hint: 'Composer dans src/scene/effects/PostFX.jsx' },
  look: { dir: 'src/look', barrel: 'src/look/index.js' },
  component: {
    dir: 'src/ui/components',
    barrel: 'src/ui/components/index.js',
    folder: true,
  },
  lib: { dir: 'src/lib', barrel: null },
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [layer, name] = process.argv.slice(2);
const uiModule = /^module\/([a-z]+)$/.exec(layer ?? '')?.[1];
const spec = uiModule
  ? { dir: `src/ui/modules/${uiModule}`, barrel: `src/ui/modules/${uiModule}/index.js`, layer: 'modules' }
  : LAYERS[layer];
if (!spec || !name || !/^[A-Z][A-Za-z0-9]+$/.test(name)) {
  console.error(`Usage: npm run new:component -- <${Object.keys(LAYERS).join('|')}|module/<nom>> <PascalCase>`);
  process.exit(1);
}

const write = (file, text) => {
  writeFileSync(file, text);
  console.log(file.replace(`${root}/`, ''));
};

const dir = spec.folder ? join(root, spec.dir, name) : join(root, spec.dir);
mkdirSync(dir, { recursive: true });
const file = join(dir, `${name}.jsx`);
if (existsSync(file)) {
  console.error(`${file.replace(`${root}/`, '')} existe déjà`);
  process.exit(1);
}

// Le style à côté, importé par le composant et rangé dans sa couche
const cssLayer = spec.folder ? 'components' : spec.layer;
const styled = cssLayer ? `import './${name}.scss';\n\n` : '';
write(file, `${styled}export default function ${name}(props) {\n  return null;\n}\n`);
if (cssLayer) {
  const block = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  write(join(dir, `${name}.scss`), `@use '../../../styles/variables' as *;\n\n@layer ${cssLayer} {\n  .${block} {\n  }\n}\n`);
}
if (spec.folder) write(join(dir, 'index.js'), `export { default } from './${name}';\n`);

if (spec.barrel) {
  const barrel = join(root, spec.barrel);
  const from = `./${name}`;
  const line = `export { default as ${name} } from '${from}';\n`;
  const current = existsSync(barrel) ? readFileSync(barrel, 'utf8') : '';
  if (!current.includes(`from '${from}'`)) {
    writeFileSync(barrel, current.endsWith('\n') || !current ? `${current}${line}` : `${current}\n${line}`);
    console.log(`export ajouté dans ${spec.barrel}`);
  }
}

if (spec.hint) console.log(spec.hint);
