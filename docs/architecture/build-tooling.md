# Build et outillage

## Prérequis

- **Node 24** (`.nvmrc`). Toujours `nvm use` avant `npm`. `engines` +
  `engine-strict` (`.npmrc`) font échouer `npm install` sur un Node plus
  ancien ; sans ça, Vitest échoue plus loin sur `Unexpected string`.
- Hooks git installés par `npm install` (script `prepare`, voir
  [gitflow](../workflow/gitflow.md#hooks)).

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur Vite (exposé sur le réseau local) |
| `npm run build` | build de prod dans `dist/` |
| `npm run preview` | sert `dist/` en HTTPS sur le réseau local |
| `npm run lint` | ESLint : erreurs bloquantes, warnings tolérés |
| `npm run typecheck` | TypeScript sur les fichiers `// @ts-check` (aucun build) |
| `npm test` | Vitest, une passe |
| `npm run test:watch` | Vitest en continu |
| `npm run new:component -- <couche> <Nom>` | squelette de composant |

## Vite

[`vite.config.js`](../../vite.config.js) :

- plugin React ;
- alias `@` → `src/` (seul alias autorisé) ;
- plugin local `cubejs-bundle` : le solveur vendored est en CommonJS ; le
  plugin le re-bundle en ESM via esbuild (déclaré en devDependency) pour le
  navigateur et pour le worker ;
- `test` : Vitest en environnement `node`, fichiers `src/**/*.test.js`.

### Découpage du bundle

`manualChunks` isole les bibliothèques (`three`, `r3f`, `postfx`, `react`,
`vendor`) du code de l’app (`App`, ~110 kB) : une mise à jour de l’app ne
fait pas retélécharger three (~690 kB, 177 kB gzip — seuil d’alerte relevé
à 700 kB pour lui).

### Premier affichage

- `index.html` contient l’écran de chargement en dur (copie de
  `ui/modules/site/Loader.jsx`, pastille du nom comprise : `SiteName.jsx`
  rendu en HTML) : la première image ne demande que le HTML et le CSS.
- **L’entrée ne dépend que de `react`.** L’aide de préchargement de Vite
  est rangée avec lui dans `manualChunks` : laissée libre, elle suivrait
  drei dans `r3f`, et l’entrée chargerait three avant le premier rendu.
  Vérifier après un changement de `manualChunks` : `dist/index.html` ne
  précharge que `react`.
- `main.jsx` importe l’App (et avec elle three, r3f, postfx) une fois le
  nom du site peint : Element Timing (`elementtiming="site-name"`), ou sa
  police plus deux images hors Chromium, au plus tard après 1 s.
- Pas d’autre découpage, décision mesurée : leçons + tutoriel = 20 kB
  gzip, post-FX = 20 kB gzip. Les effets « apparaîtraient » après les
  premières images et le guide deviendrait asynchrone.

### Police

Nunito variable, sous-ensembles latin et latin-ext seulement
([`_fonts.scss`](../../src/styles/_fonts.scss)), en `font-display: swap`.

Le nom du site a sa propre police, `Nunito Title`
([`styles/fonts/nunito-title.woff2`](../../src/styles/fonts/nunito-title.woff2)) :
Nunito 900 réduite aux lettres de `SITE_NAME` (1,8 ko). Sous 4 ko, Vite
l’intègre au CSS : pas de requête, le nom est peint avec la première image.
**Si le nom change, la régénérer** (fontTools, licence OFL de Nunito) :

```sh
pip install fonttools brotli
SRC=node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2
fonttools varLib.instancer "$SRC" wght=900 -o /tmp/nunito-900.woff2
pyftsubset /tmp/nunito-900.woff2 --text="Magik’s Cube" --flavor=woff2 \
  --output-file=src/styles/fonts/nunito-title.woff2
```

### Environnement 3D

[`scene/assets/warehouse-1k.jpg`](../../src/scene/assets/warehouse-1k.jpg) :
« Empty Warehouse 01 » (Poly Haven, CC0), l’HDR 1k du preset `warehouse` de
drei, réencodé en JPEG à gain map (`@monogrid/gainmap-js`, déjà livré avec
drei ; qualité 0,9, gain map pleine taille). 160 ko au lieu de 1,7 Mo, et
plus de CDN tiers. Ne pas revenir aux presets de drei : ils téléchargent
depuis raw.githack.com.

### Web Worker

Le solveur tourne dans `src/puzzles/cube/kociemba.worker.js`, chargé par
`new Worker(new URL(...), { type: 'module' })`. Vite construit les workers
avec **leur propre pipeline de plugins** : tout plugin nécessaire au code
du worker doit aussi être déclaré dans `worker.plugins` (c’est le cas de
`cubejsBundle()`). Sans lui, le build échoue sur
`"default" is not exported by src/vendor/cubejs/index.js`.

## Vendor

`src/vendor/<lib>/` : code tiers copié, avec sa `LICENSE`, **jamais
modifié à la main**. Une mise à jour = remplacement complet + note dans la
PR. Accès uniquement via une façade dans `puzzles/`.

## Dépendances

| Catégorie | Où | Exemples |
| --- | --- | --- |
| Livré au navigateur | `dependencies` | react, three, R3F, drei, postprocessing |
| Outil de build / test | `devDependencies` | vite, vitest, sass, plugin-react |

Ajouter une dépendance runtime se justifie dans la PR (poids, alternative
maison). Les versions sont figées par `package-lock.json`, toujours
committé.

## Lint

[`eslint.config.js`](../../eslint.config.js) : `@eslint/js` recommandé,
`react-hooks` (`rules-of-hooks` et `exhaustive-deps` en erreur),
et **les frontières de couches** de
[overview](overview.md#sens-des-imports) via `no-restricted-imports` — un
import interdit casse le lint, donc le push et la CI.

La forme des fonctions (3 paramètres, 60 lignes, complexité
12, 3 niveaux) est aussi une erreur, partout dans `src/` ; `npm run dup`
(jscpd) ne trouve aucun bloc copié.

`jsconfig.json` sert l’éditeur (alias `@`, JSX).

## Types

JavaScript vérifié par TypeScript 5.9 (`checkJs` par fichier), sans
réécriture en TS :

- un fichier entre dans la vérification avec `// @ts-check` en tête ;
  aujourd’hui toute la logique (`puzzles/`, `learn/`, `lib/`, `app/*.js`)
  et tous les composants `.jsx` ([`tsconfig.check.json`](../../tsconfig.check.json)) ;
- les props d’un composant partagé sont écrites en JSDoc (`@param {{ … }} props`) :
  une prop optionnelle porte `?`, sinon TypeScript la croit obligatoire ;
- [`src/vite-env.d.ts`](../../src/vite-env.d.ts) fait connaître à TypeScript
  les imports d’images de Vite ;
- le contrat est écrit en JSDoc dans
  [`puzzles/types.js`](../../src/puzzles/types.js) : `PuzzleDefinition`,
  `Turn`, `Frame`… Un puzzle à qui il manque un champ ne passe pas ;
- `vendor/` n’est pas vérifié.

Nouveau fichier de logique ou composant = `// @ts-check` en première ligne.

## Tests

- Vitest, **sans canvas, sans DOM** : uniquement la logique pure
  (`apply`, notation, inspect, solveur, guides).
- Fichier `*.test.js` à côté du module testé.
- [`src/puzzles/contract.test.js`](../../src/puzzles/contract.test.js)
  vérifie le contrat sur **chaque** puzzle de `PUZZLE_LIST`.
- Un test lent (> 1 s) le dit dans son nom ou se justifie (tables du
  solveur).
- Pas de tests E2E (hors scope). La vérification visuelle se fait
  à la main avant la PR.

## Contrôles attendus avant merge

| Contrôle | Hook `pre-push` | CI ([`ci.yml`](../../.github/workflows/ci.yml)) |
| --- | --- | --- |
| `npm run lint` | oui | oui |
| `npm run typecheck` | oui | oui |
| `npm test` | oui | oui |
| `npm run build` | non (trop lent) | oui |

La CI tourne sur chaque PR vers `main` / `develop` et chaque push sur ces
branches, dès qu’un remote GitHub existe.
