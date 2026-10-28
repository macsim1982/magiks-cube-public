# Puzzles

## Principe

- Un puzzle = **un objet plain** (`PuzzleDefinition`) dans le registre
  [`src/puzzles/index.js`](../../src/puzzles/index.js).
- L’**état logique** est la source de vérité. Les matrices Three.js en
  dérivent (« rebake ») après chaque coup.
- Un seul runtime 3D, [`PuzzleView`](../../src/puzzles/render/PuzzleView.jsx),
  pour toutes les familles. **Il ne lit jamais `family` ni `id`** : tout
  passe par `turnAxis`, `movingIds`, `apply` et `capabilities`.

Familles actuelles :

| Famille | Fabrique | Puzzles | Angle | Placement |
| --- | --- | --- | --- | --- |
| cube | `createCube(n)` | `cube3`, `cube4`, `cube8` | `π/2` | `slot` |
| skewb | `skewb` | `skewb` | `2π/3` | `world` |

## État logique

```js
// src/puzzles/core/state.js
state = { byId: { [pieceId]: { slot: number[], quat: [x, y, z, w] } } }
```

- `apply(state, turn)` est **pur** : il retourne un nouvel état.
- `statesEqual` traite `q` et `-q` comme la même orientation.
- Aucun objet Three.js dans l’état. Les tests tournent sous Node.

## Trois représentations d’un coup

| Forme | Exemple | Qui la produit | Qui la consomme |
| --- | --- | --- | --- |
| **token** | `"R'"`, `"U2"` | clavier, leçons, solveur, historique | `toTurn` |
| **turn** | `{ axis, layer, angle, steps }` ou `{ tip, angle }` | `toTurn`, drag | `apply`, `movingIds`, runtime |
| **frame** | `{ R, U, F }` → axe + signe | `viewFrame(view)`, la vue tirée de la caméra par `cameraView` (`render/`) | `toTurn`, `turnToToken` |

Le **frame** traduit la notation relative (« R = la face à droite de la
vue ») en axe monde. Il est figé au moment du coup et stocké dans
l’historique : l’annulation reste juste même si la caméra a tourné.
La caméra se pose sur la diagonale du cube (45° + k·90°) : `viewFrame`
tourne la direction de vue de -45° avant de choisir F, sinon x et z sont
à égalité et R / F / L / B sont tirés au hasard. F est la face de gauche,
R celle de droite.
Leçons et tutoriel utilisent `DEFAULT_FRAME` (repère du cube).

## Contrat `PuzzleDefinition`

La référence est le JSDoc en tête de `src/puzzles/index.js`. Résumé :

| Champ | Rôle |
| --- | --- |
| `id`, `label`, `family` | identité, UI (`family` est descriptif) |
| `capabilities` | `{ lessons, solver, race }` : ce que l’écran propose. `App` lit ces drapeaux, jamais l’`id` |
| `angle` | unité d’un tour (durée d’animation proportionnelle) |
| `pieces` | pièces en pose résolue (`id`, `slot`, géométrie) |
| `Piece` | composant React d’une pièce |
| `authored` | `'slot'` → position via `slotWorld` ; `'world'` → géométrie déjà placée, seul le quat est rebaké |
| `createState`, `apply`, `movingIds` | mécanique pure |
| `isSolved` | résolu à l’orientation près (partagé : `core/solved.js`, par couleur) |
| `turnAxis` | axe unitaire du tour ; le pivot tourne de `angle` autour de lui |
| `toTurn`, `turnToToken`, `invert`, `invertAlg`, `parseAlg`, `scramble` | notation |
| `viewFrame`, `DEFAULT_FRAME` | repère |
| `keys` | `e.key` → token de base (Espace tenue = inverse) |
| `drag` | `{ angle, resolve, lockDistance?, commitRatio?, radius? }` pour le pointeur. `radius(start, axis)` : défaut = distance à l’axe |
| `mirror` | supporte le look miroir (3×3 seulement) |
| `createBodyTemplate?` | géométrie de corps partagée (cube arrondi) |

Changer ce contrat se décide et se documente ici.

## API impérative de `PuzzleView`

C’est le seul canal entre `App` et la 3D. `App` la reçoit via `cubeRef`.

| Méthode | Effet |
| --- | --- |
| `play(tokens, opts)` | met les coups en file. `opts` : `frame`, `speed`, `instant`, `hints`, `guide` (la tranche s’annonce avant de tourner), `onStep` (après chaque coup), `onDone` (fin de file) |
| `reset()` | vide la file, revient à l’état résolu |
| `cancel()` | vide la file, lâche le coup en cours sans l’appliquer |
| `getState()` | état logique courant (lecture seule) |
| `getFrame()` | repère de la vue courante |
| `hint(token, { sweeps, stay, dashed, onDone })` | tranche allumée en jaune de l’intérieur + flèche néon sur la tranche que `token` ferait tourner, sans la tourner ; `sweeps` : la flèche se dessine n fois puis s’éteint ; `stay` : elle se dessine, `onDone`, puis reste ; `dashed` : en pointillés ; `null` éteint |
| `celebrate(ids)` | pièces `ids` allumées en vert jusqu’au prochain coup ; `null` éteint |
| `follow(ids)` | pièces à suivre : allumées en turquoise, en vert une fois arrivées, à chaque nouvel état ; à chaque appel, une annonce de 3 s montre leur maison en fantômes opaques qui pulsent, en fondu (`ghostFade`, `core/announce.js`), visibles même sur une face cachée ; `[]` éteint, `reset()` aussi |

Callback sortant : `onTurn(token, frame)` — un coup **joué à la souris** a
été validé. Les coups lancés par `play` ne le déclenchent pas.
Maj tenue au début d’un glissé à la souris : tout le cube tourne autour de
l’axe de la couche choisie (x, y, z ; `wholeTurn` dans `pointer.js`). Le
Skewb garde sa couche.
Prop `canTurn()` : appelée quand un doigt se pose ; `false` = pas de glissé
(démonstration en cours).

Animation : file FIFO consommée dans `useFrame`. Les pièces bougent sous un
`pivot` temporaire tourné par `setFromAxisAngle(turnAxis(turn), angle)`,
puis sont rattachées au groupe et rebakées depuis l’état. Le test de
contrat vérifie que cette rotation tombe exactement là où `apply` place
les pièces.
Le glissé va jusqu’à deux pas (R2) quand deux pas font au plus un
demi-tour (les cubes, pas le Skewb), et se cale au pas le plus proche
(`core/dragSnap.js`).

Deux tours désignent la même couche s’ils ont le même `turnAxis` et le
même `layer` (`null` hors NxN) — c’est ainsi que `FaceHints` nomme le coup
en cours. Un `remount` (changement de `key`) réinitialise tout.

## Ajouter un puzzle — checklist

1. `src/puzzles/<nom>/definition.js` qui exporte l’objet.
2. Une pièce dans `render/` si aucune existante ne convient ; son calcul
   (géométrie, coups) reste pur, dans le dossier du puzzle ou `core/`.
3. Ajouter à `PUZZLES` et `PUZZLE_LIST`.
4. `npm test` : [`contract.test.js`](../../src/puzzles/contract.test.js)
   couvre automatiquement le nouveau puzzle (forme du contrat, inverses,
   tour complet = identité, pureté d’`apply`, mélange + `invertAlg`,
   aller-retour `turnToToken`). Ajouter un `definition.test.js` pour ce qui
   est propre au puzzle (nombre de pièces, alias de notation…).
5. Choisir `capabilities`. `race: true` suffit pour le chrono (il
   s’appuie sur `isSolved`). `lessons` / `solver` supposent du contenu et
   un solveur propres au puzzle : aujourd’hui 3×3 seulement.
