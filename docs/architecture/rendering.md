# Rendu 3D

## Canvas

Déclaré dans `App` : `shadows`, caméra `CAMERA_HOME` (diagonale du cube, hauteur 4, recul de l’ancienne vue `[4, 4, 6]`) fov 45, `dpr [1, 2]`,
`antialias: false` (l’AA est laissé au post-process).
[`ShaderWarmup`](../../src/scene/ShaderWarmup.jsx) compile d’abord les
shaders de la scène en parallèle (`compileAsync`, KHR_parallel_shader_compile)
en gardant le puzzle caché : la première image ne bloque plus le fil
principal sur la compilation. Ensuite seulement,
[`FirstFrame`](../../src/scene/FirstFrame.jsx) passe `ready` à `true` quand
la scène a dessiné deux images, et le `Loader` s’efface en fondu.

La scène attend en Suspense l’environnement (JPEG à gain map servi par le
site) et les textures du plastique (calculées dans un worker,
[`look/plastic.worker.js`](../../src/look/plastic.worker.js)).

Le Canvas couvre toute la `.stage` et **ne change jamais de taille avec
le panneau**. Le dock se pose par-dessus ; `App` passe à la
scène `reserve` = `{ top, bottom, left }` : panneau du bas (hauteur max du
mode) et barre du haut flottante
([`usePanelReserve`](../../src/app/usePanelReserve.js)). Plus de
colonne de gauche : `left` reste à 0.

[`FitCamera`](../../src/scene/FitCamera.jsx) cadre le puzzle dans la zone
libre hors de `reserve`, sur la silhouette du cube classique (rayon 2,5)
ou la sphère du Mirror (2,9) :

- recul : `fitDistance` ([`scene/framing.js`](../../src/scene/framing.js)),
  jamais plus près que la distance de repos ;
- décalage d’objectif : `camera.setViewOffset` de `lensShift(reserve)`,
  la caméra vise toujours le centre du cube ;
- nouvel écran : appliqué tout de suite ; nouvelle réserve : glissé de 0,5 s.

## Composition

[`Scene.jsx`](../../src/scene/Scene.jsx) **compose**, n’implémente pas :

```
Scene
├── <color background>   BACKDROP (look/look.js), un ton sous --bg
├── StudioEnvironment    HDR de l’entrepôt, servi par le site
├── KeyLight
├── ShaderWarmup         puzzle caché le temps de compiler les shaders
│   └── PuzzleView       (key = puzzle.id + cubeKey)
├── FitCamera            recul + décalage d’objectif au-dessus du panneau ;
│                        `hold` : la distance appartient à l’intro
├── IntroCamera          trajet de l’intro (`introPose`), inactive hors intro
├── OrbitSnap            OrbitControls, azimut aimanté au quart de tour ;
│                        `locked` : vue de départ, plus de rotation (mode « À toi ») ;
│                        `disabled` : coupé pendant l’intro ; un doigt hors du cube
│                        tourne la caméra, deux doigts tournent tout le
│                        cube, x, y ou z selon le sens
├── FirstFrame           `onReady` deux images après la compilation
└── PostFX               SSR → Bloom → ToneMapping AgX → Noise
```

Un effet = un fichier dans `scene/effects/`. L’ordre dans `PostFX.jsx` est
l’ordre de la chaîne. Désactiver un effet = le retirer, pas le commenter
(voir [TD-12](tech-debt.md#td-12)).

## Look

Objet plain créé par `createLook()` ([`look/look.js`](../../src/look/look.js)) :

```js
{ mirror, offset: [x, y, z], colors: { right, left, top, bottom, front, back, body },
  body: { metalness, roughness, … }, sticker: { … }, ui: { panel, puzzles, lessons } }
```

- `App` retire `ui` et ajoute `show` (pièces mises en avant) avant de le
  passer à la scène.
- [`useCubeLook`](../../src/look/useCubeLook.js) crée les matériaux **une
  fois**, puis anime couleurs et offset (courbes MD de `lib/dom/motion`).
  Il expose `materials`, `offsetView`, `setStickerGlow`.
- **Par défaut, cube classique en couleurs** ; le Mirror Cube est une
  option (bouton « Mirror »), jamais active en mode Apprendre.
- **Miroir** : 3×3 seulement (`puzzle.mirror`). Les couches n’ont pas la
  même épaisseur, le bloc glisse donc de `offset` : `PuzzleView` le
  recentre (position `-offsetView`), le cube ne bouge pas quand on passe de
  Classique à Mirror. L’offset étire les cubies
  pour un Mirror Cube ; il est coupé quand des pièces sont mises en avant
  et **toujours en mode Apprendre**.
- La couleur d’accent UI n’est jamais une couleur de sticker.

## Règles de performance

1. **Pas d’allocation dans `useFrame`** : vecteurs, quaternions, matrices
   en scratch au niveau module ou en `useMemo`.
2. **Pas de `setState` par frame.** L’animation passe par des refs ;
   React ne voit que les fins de coups.
3. **Tout ce qui est créé est disposé** : géométries, matériaux, textures
   dans le cleanup de l’effet qui les a créés. Exceptions, gardées toute la
   session : les textures du plastique et les matériaux témoins de
   `look/materials.js`, qui gardent les shaders compilés.
4. Partager les géométries plutôt que d’en créer une par pièce — le 8×8 a
   296 pièces : gabarit des corps (`createBodyTemplate`, sa base est
   calculée une fois), stickers partagés par taille (`CubePiece`).
5. **Pas de compilation de shader pendant une animation.** Un nouvel état
   de matériau (comme le sticker Mirror ↔ couleurs) a son témoin dans
   `shaderWitnesses`, compilé avec la scène par `ShaderWarmup`.
6. Shaders : GLSL colocalisé dans le composant d’effet ; extraire en
   `.glsl` au-delà de ~150 lignes ou au 2ᵉ usage.
7. Avant d’ajouter un effet, mesurer sur le 8×8 avec `dpr 2`.
