# Vue d’ensemble

Application 100 % client : Vite + React 19 + React Three Fiber. Pas de
backend, pas de router, pas de store global. Un seul écran.

## Couches

| Couche | Dossier | Rôle | Contient |
| --- | --- | --- | --- |
| app | `src/app/` | Compose l’écran ; un hook par responsabilité | `App.jsx`, `use*.js`, `race.js` |
| scene | `src/scene/` | Tout ce qui est dans le `<Canvas>` hors puzzle | lumières, environnement, caméra, `effects/` |
| puzzles | `src/puzzles/` | Mécanique : pièces, coups, état ; le calcul pur (`core/`) et le rendu 3D (`render/`) partagés | `cube/`, `skewb/`, `core/`, `render/` |
| look | `src/look/` | Look : couleurs, matériaux, textures | `look.js`, `useCubeLook.js` |
| learn | `src/learn/` | Leçons (contenu) et guides calculés depuis un mélange | `debutant.js`, `moyen.js`, `guide.js`, `search.js` |
| scan | `src/scan/` | Lire un vrai cube sur deux photos, fonctions pures | `layout.js`, `color.js` |
| ui | `src/ui/` | Chrome HTML par-dessus le canvas | `icons/`, `components/`, `hooks/` génériques ; `modules/` : une fonction de l’écran par dossier |
| lib | `src/lib/` | Utilitaires sans domaine | easing MD, FLIP, `format/` (durées) |
| styles | `src/styles/` | Design system SCSS | tokens, mixins, base, typographie, polices ; l’ordre des couches CSS |
| vendor | `src/vendor/` | Code tiers figé, non modifié | `cubejs/` (solveur, MIT) |

## Sens des imports

Une flèche = « peut importer ». Tout ce qui n’est pas listé est interdit.

```
app ──► scene ──► puzzles ──► look ──► lib
 │                ▲ ▲ ▲         ▲
 ├──► ui ──► learn ┘ │ │         │
 │     ├──► scan ────┘ │         │
 │     └───────────────┴─────────┘
 └──► learn, puzzles, look, lib
puzzles ──► vendor
```

Règles :

1. **Personne n’importe `app`.**
2. **`puzzles` n’importe ni `ui`, ni `scene`, ni `learn`.** Le domaine ne
   connaît ni l’écran ni les leçons.
3. **`look` n’importe que `lib`.** Le look ne connaît pas les puzzles.
4. **`ui` ne touche pas Three.js.** Il parle au puzzle par des tokens
   (`"R'"`) et des callbacks, jamais par des meshes.
5. **`lib` n’importe rien du projet.**
6. **`vendor` n’est importé que par `puzzles`**, derrière une façade
   (`puzzles/cube/solveFacelets.js`).
7. **`learn` n’importe que `puzzles` et `lib`.** Contenu et fonctions
   pures, pas de React.
8. **`scan` n’importe que `puzzles` et `lib`.** Géométrie et couleurs,
   pures ; la caméra et le canvas restent dans `ui`.
9. **`ui/components`, `ui/icons` et `ui/hooks` sont génériques** : ni
   domaine (`puzzles`, `learn`, `look`, `scan`), ni module de l’UI
  .
10. **Un module de l’UI n’importe pas un autre module** (`ui/modules/<nom>/`) :
    `app` les assemble. Ce que deux modules partagent devient un composant,
    comme `MoveList` pour Jouer et Apprendre.
11. **`puzzles/core` et `lib/math` sont du calcul pur** : ni Three.js, ni
    React, ni `puzzles/render`. Un adaptateur de `render/` ou de
    `scene/` passe la 3D en tableaux.

Les règles 2 à 11 sont **vérifiées par ESLint** (`npm run lint`,
[`eslint.config.js`](../../eslint.config.js)). Une nouvelle couche = une
entrée de plus dans ce fichier.

Importer via le barrel (`../puzzles`, `../ui/modules/play`,
`../../components`) quand il expose ce qu’il faut ; sinon le chemin direct
est accepté.

## Arborescence

```
index.html            écran de chargement en dur → src/main.jsx (Loader, puis App une fois le nom peint)
src/
  main.jsx            entrée, StrictMode, styles globaux
  app/                App.jsx compose ; useRace, useMoveHistory, useScramble,
                      useLessonSearch, useKeyboard ; race.js (pur)
  scene/              Scene.jsx compose ; effects/ = un effet par fichier ;
                      assets/ = environnement (JPEG à gain map)
  puzzles/
    index.js          registre + contrat PuzzleDefinition
    core/             calcul pur : state, frame (repère de vue), gesture, dragSnap,
                      solved, timing, turnToken ; ni Three.js ni React
    render/           bout de chaîne : PuzzleView (runtime 3D), pièces, guide, indices,
                      pointer, deux doigts, cameraView (adaptateur caméra → repère)
    cube/             createCube(n), notation, geometry, inspect, facelets,
                      verifyFacelets, beginnerSolver, worker Kociemba + solverClient
    skewb/            définition + géométrie
  look/               look, matériaux, textures (worker), useCubeLook
  learn/              leçons (debutant, moyen), guide et search calculés
  scan/               lecture du vrai cube : géométrie des 2 photos, couleurs
  ui/                 l’écran HTML
    icons/            registre des icônes : un nom, un tracé ; <Icon name>
    components/       génériques : Button, IconButton, Dialog, Progress, Kbd, Field,
                      MoveList, RubikIcon
    hooks/            génériques : useDismiss, useFlip, useMedia
    modules/          une fonction de l’écran par dossier, assemblés par app/ :
                      home, play, learn, scan, look, site, keys
  lib/                sans domaine : math/ (quat, vec, bezier, angle, pur),
                      dom/ (flip, motion), format/ (durées)
  styles/             tokens, mixins, base ; main.scss fixe les couches CSS
  vendor/cubejs/      solveur Kociemba (CommonJS)
docs/                 architecture, workflow
scripts/              générateurs (composant), setup git
.githooks/            hooks gitflow
```

## Points d’entrée pour lire le code

1. [`src/app/App.jsx`](../../src/app/App.jsx) — le flux complet.
2. [`src/puzzles/index.js`](../../src/puzzles/index.js) — le contrat.
3. [`src/puzzles/render/PuzzleView.jsx`](../../src/puzzles/render/PuzzleView.jsx) — l’animation.
4. [`src/scene/Scene.jsx`](../../src/scene/Scene.jsx) — la composition 3D.

## Où mettre un nouveau code

| Besoin | Où |
| --- | --- |
| Un nouveau puzzle | `src/puzzles/<nom>/` + une ligne dans le registre |
| Un effet post-process | `src/scene/effects/<Nom>.jsx`, composé dans `PostFX.jsx` |
| Un panneau, une barre, un morceau d’écran | dans son module, `src/ui/modules/<module>/<Nom>.jsx` (`npm run new:component -- module/<module> <Nom>`) ; son `.scss` à côté, dans `@layer modules` |
| Une icône | une entrée dans `src/ui/icons/icons.js`, affichée par `<Icon name>` ; jamais de `<svg>` recopié |
| Un bouton, un champ, une fenêtre, une barre | un composant de `src/ui/components/` (`<Button variant icon>`, `<IconButton icon label>`, `<Dialog>`, `<Field type>`…) ; un nouveau : `npm run new:component -- component <Nom>` |
| Un hook d’UI sans domaine | `src/ui/hooks/` |
| Un réglage visuel du cube | `src/look/look.js` (donnée) + `useCubeLook.js` (application) |
| Une leçon, un texte de tutoriel | `src/learn/` ([règles d’écriture](../workflow/ecrire-une-lecon.md)) |
| Une fonction pure sans domaine | `src/lib/` |
| Une nouvelle couche, un store, un router | à décider et documenter d’abord |

Générer le squelette : `npm run new:component -- <couche> <Nom>`.
