# État et flux

L’état écran vit dans `src/app/` : [`App.jsx`](../../src/app/App.jsx)
compose des hooks, un par responsabilité.
Les composants enfants reçoivent données et callbacks.

## Hooks

| Hook | État | API (fonctions stables) |
| --- | --- | --- |
| [`useMoveHistory`](../../src/app/useMoveHistory.js) | `history` : `[{ token, frame }]` | `play`, `playInCubeFrame`, `record`, `undo`, `replace`, `clear` |
| [`useRace`](../../src/app/useRace.js) | `race` (machine pure : [`race.js`](../../src/app/race.js)) | `phase()`, `start`, `inspect`, `solve`, `finish`, `clear` |
| [`useScramble`](../../src/app/useScramble.js) | refs seulement | `start`, `finish`, `stop`, `isPlaying(alg)` |
| [`useLessonSearch`](../../src/app/useLessonSearch.js) | `guide`, `search`, `token` | `feed(moves)`, `clear` |
| [`useKeyboard`](../../src/app/useKeyboard.js) | — | `onMove`, `onUndo`, `onSpace` en entrée |
| [`usePractice`](../../src/app/usePractice.js) | refs seulement | `show`, `expect` (`quiet` : sans flèche, au défi), `accepts`, `begin`, `check`, `stop` (mode « À toi ») |
| [`usePanelReserve`](../../src/app/usePanelReserve.js) | `reserve` : `{ top, bottom, left }` (px) | — ; mesure le dock, passé à `Scene` pour le cadrage |
| [`useProgress`](../../src/app/useProgress.js) | `done` : `Set` de clés (logique pure : [`learn/progress.js`](../../src/learn/progress.js)) | `mark(key)` ; écrit dans `localStorage` |
| [`useIntro`](../../src/app/useIntro.js) | `phase`, `startedAt`, `skippedAt` (logique pure : [`intro.js`](../../src/app/intro.js)) | `begin`, `skip`, `replay(onCovered)` |
| [`useScan`](../../src/app/useScan.js) | `open` : écran du scan ouvert | `open`, `close` |
| [`useScreen`](../../src/app/useScreen.js) | `screen` (`home`, `play`, `learn`), `entry` (`resume`, `guide`) | `home`, `play`, `learn(entry)` |
| [`useResume`](../../src/app/useResume.js) | `at` : `{ lesson, step, alg }` où reprendre Apprendre, `null` avant la 1re visite (logique pure : [`learn/resume.js`](../../src/learn/resume.js)) | `place(at)` ; écrit dans `localStorage` |

Reste dans `App` : puzzle actif, `cubeKey` (incrémenté = remount de
`PuzzleView`), `look`, `show`, `ready`, et les callbacks qui croisent
plusieurs hooks (`play`, `shuffle`, `challenge`, `reset`, `learn`, tutoriel).

`cubeRef` porte l’API impérative de `PuzzleView` ; seuls `App` et les hooks
de `app/` y touchent.

**Lecture synchrone** : `onDone` / `onTurn` arrivent hors du cycle React.
On lit la phase par `raceApi.phase()`, jamais par la variable `race` du
rendu.

## Flux d’un coup

```
clavier ──► useKeyboard ──► App.play ──► moves.play(tokens) ──► cubeRef.play(tokens, { frame: getFrame() })
                                              │                        │
                                              └─► history += {token, frame}   (animation, apply, rebake)
                                                                       │
                                                                       └─► onDone ──► finishIfSolved()

souris ──► pointer (drag) ──► PuzzleView.endTurn ──► onTurn(token, frame) ──► moves.record
```

**Annuler** : `invert(last.token)` rejoué avec **son** frame d’origine.

**Seek** dans l’historique : coups inverses joués en `instant`.

## Machine de la course (`capabilities.race`, « Défi chrono » dans Jouer)

```
       Mélanger
null ───────────► cover ──(Espace / fin mélange forcée)──► inspect
                                                            │
                         premier coup ou Espace ◄───────────┘
                                   │
                                   ▼
                                  run ──(puzzle.isSolved après un coup)──► done
```

Toute action « Réinitialiser », changement de puzzle ou bascule tutoriel
remet `race` à `null`. En `cover`, les coups sont ignorés. Espace en
`cover` termine d’un coup la lecture du mélange (`scramble.finish()`).
Une action hors de sa phase ne fait rien (testé dans `race.test.js`).

## Leçons et solveur (`capabilities.lessons` / `solver`)

```
shuffle() ─► lessons.feed(mélange)
               ├─► guideLesson(moves)            learn/guide.js, synchrone (beginnerSolver)
               └─► requestSolution(facelets)     Web Worker, Kociemba
                      └─► searchLesson | failedLesson   learn/search.js
```

- Le worker (`puzzles/cube/kociemba.worker.js`, client `solverClient.js`)
  est créé à la première demande et réutilisé. Les tables se calculent une fois (~1–2 s).
- Une réponse obsolète est ignorée (`cancel` dans l’effet).
- Le tutoriel ne pilote le cube que via `onPose(setup, pieces, focus)`
  (`focus` : les pièces à suivre),
  `onPlay(tokens, setup?, { onStep, onDone })`, `onSeek(tokens, prefix)`
  et `onQuit` — jamais via la ref. `onStep` allume les lettres de la
  formule une à une ; `onDone` affiche « Bravo ! ».

## Écrans : accueil, Jouer, Apprendre

```
ACCUEIL ── 3 portes ──► Apprendre (où l’on s’était arrêté : useResume)
   │                ──► Mon cube (scan) ──► Apprendre sur le guide du cube lu
   │                ──► Jouer
   └── toucher le cube (doigt, clavier) ──► Jouer
JOUER ── « Mélanger » (sans course) ──► « Comment le résoudre ? » ──► Apprendre sur le guide
      ── « ⏱ Défi chrono » ──► mélange + course (cover → inspect → run → done)
      ── ‹ ──► accueil
APPRENDRE ── ✕ ──► accueil
```

## Mode Apprendre

Une carte par étape, un bouton qui avance : **▶ Montre-moi**,
puis **✋ À toi !**, puis **« Cas suivant › »**. Un nouveau cas ou une
nouvelle étape repart sur Regarder. Chaque bouton a son mot.

```
▶ REGARDER
carte : ‹ cas (points) › · formule · mission en une phrase (💡 Astuce : une phrase à la place)
« Montre-moi » ──► coups guidés : chaque tranche s’annonce puis tourne, cube pas touche
            ──► lettres allumées (onStep) ──► le bouton devient « À toi ! » (onDone)

✋ À TOI (coup par coup, caméra bloquée)
demo : tranche allumée + flèche néon sur la tranche, le cube ne bouge pas ;
       la flèche se dessine puis reste jusqu’au coup (continue,
       ou en pointillés avec ?fleche=pointilles) ;
       tout le cube (y, z2) aussi : l’enfant le fait, à deux doigts ou
       avec la touche, la bulle dit comment ;
       l’enfant peut déjà jouer ──► wait : « À toi ! »
wait ──coup de l’enfant fini──► usePractice.check ──► judgeMove(état avant, état après, coup)
   ok    ──► lettre ✓, coup suivant (demo) … ──► done : « Tu l’as fait ! »
   half  ──► « Encore un quart de tour ! » (demi-tour en deux quarts)
   wrong ──► le cube défait les coups de l’enfant ──► demo de nouveau
             (2 ratés : « Suis la flèche. »)
done ──► les pièces arrivées s’entourent de vert sur le cube ;
         « Cas suivant › » dans la bulle ; ▶ « Démo » ramène à la démo

★ DÉFI (l’étoile au bout des points, ou › depuis le dernier cas)
guess : un cas tiré au sort est posé, sans nom ni formule ;
        un bouton par cas ──► faux : il se grise ; juste ──► do
do    : À toi sans flèche (hidden) ; « Indice » montre la flèche du coup en cours
won   : « c’est fait ! » et les trois étoiles ; « Étape suivante › » ou « Un autre »
```

**Suivant / Avant** ([`learn/navigation.js`](../../src/learn/navigation.js),
`neighbour` ; le défi en plus dans `stepNav`) : d’abord les cas de l’étape, puis son défi ; l’étape voisine seulement
depuis le dernier cas (ou le premier, en reculant — on arrive alors sur le
dernier cas de l’étape d’avant). Le bouton dit ce qu’il va faire :
« Cas suivant » ou « Étape suivante ». Changer de cas ou d’étape repasse
sur Regarder, avec la mission (l’astuce ne reste ouverte que pour son cas).

**Coches et étoiles** : « Tu l’as fait ! » valide le
cas ; une étape est validée quand tous ses cas le sont. Trois étoiles par
étape : regardé, fait seul, défi. ✓ sur l’onglet et dans l’en-tête, les
étoiles sur la carte du chantier (le bouton de l’étape en haut l’ouvre) ;
gardé dans `localStorage`.

La machine d’état (`nextPractice`) et le verdict (`judgeMove`) sont purs,
dans [`learn/practice.js`](../../src/learn/practice.js). Les passages d’un
mode à l’autre sont animés en FLIP ([`lib/dom/flip.js`](../../src/lib/dom/flip.js)).

À l’écran : **Étape** = une étape de leçon (`lesson.steps[i]`), **Cas** =
une formule de l’étape (`step.algs[j]`).

## Intro

Première visite seulement (`localStorage`), jamais avec « réduire les
animations ». `?intro` la force.

```
wait  : Mirror mélangé sous le loader, caméra au départ du trajet
  │  la scène a dessiné (FirstFrame) ──► App.onSceneReady ──► intro.begin
play  : loader en fondu ; mélange rejoué à l’envers (introPlan) ; IntroCamera
  │     fait le tour ; « Passer l’intro » / Échap ──► skip (cube résolu d’un coup)
outro : Mirror → couleurs ; les boutons apparaissent 0,5 s plus tard
  │     (la caméra finit son trajet, ou y glisse si on a passé)
off   : OrbitControls reprend la main
« Revoir l’intro » (menu ☰) ──► veil (rideau) ──► App.reset sous le rideau ──► wait ──► play …
```

Pendant `wait`, `play` et `outro` : `App.play` et `undo` refusent,
`OrbitControls` est coupé, `FitCamera` ne touche plus à la distance
(`hold`). Le dock reste monté mais caché (`inert`) : sa hauteur sert déjà
au cadrage.

## Scanner mon cube

```
📷 (barre d’accueil) ──► useScan.open ──► Scan (dialogue ; le canvas ne se dessine plus)
photo 1 : blanc en haut ── caméra : aperçu en direct ; cube en place et immobile 0,7 s
        ──► la photo se prend seule (scan.aimAt) ; ou « Prendre la photo »
photo 2 : basculé vers soi ── ou importer : glisser / zoomer, « Utiliser cette photo »
        ──► scan.classify : 54 lettres, doute par case
vérifier : toucher une case ──► 6 couleurs ; verifyFacelets dit la faute
« C’est mon cube ! » ──► requestSolution (Kociemba) ──► invertAlg = mélange
        ──► App.scanned : comme « Mélanger » (lessons.feed + scramble.start)
        ──► Apprendre s’ouvre sur le guide « Sur ce mélange »
```

## Règles

1. Un composant UI **n’appelle jamais** `cubeRef`. Il émet un callback ;
   `App` décide.
2. Toute séquence jouée passe par `play` avec un `frame` explicite.
3. Un nouveau mode d’écran (ex. défi chronométré) = un hook dans
   `src/app/`, pas de `useState` de plus dans `App`.
4. Un callback passé à un composant qui l’utilise dans un effet
   (`Tutorial.onPose`, `Race.onStart`) doit être stable.
