# Magik’s Cube

Vite + React + React Three Fiber. Puzzles : 3×3, 4×4, 8×8, Skewb.

```
nvm use        # Node 24, voir .nvmrc
npm install
npm run dev
npm test
```

La caméra du scan exige HTTPS : pour l’essayer sur un téléphone du réseau
local, lancer `npm run dev:https` et accepter une fois le certificat de dev
.

## Où mettre du code

| Besoin | Dossier |
| --- | --- |
| État écran, clavier, Canvas | `src/app/` |
| Lumières, env, post-process | `src/scene/` (+ `effects/`) |
| Look, matériaux, textures | `src/look/` |
| Leçons, guides calculés | `src/learn/` |
| Mécanique puzzle (NxN, Skewb…) | `src/puzzles/` |
| HUD, tutoriel, look | `src/ui/` |
| Utilitaire sans domaine | `src/lib/` |

```
npm run new:component -- ui MonPanneau
```

## Ajouter un puzzle

1. Créer `src/puzzles/<nom>/` avec un objet qui respecte le contrat
   documenté en tête de [`src/puzzles/index.js`](src/puzzles/index.js)
   (`pieces`, `toTurn`, `apply`, `movingIds`, `drag`, …).
2. L’exporter à `PUZZLES` / `PUZZLE_LIST` dans ce même fichier.
3. Couvrir `apply` + notation avec un test Vitest (sans canvas).

Deux familles : **cube** (`createCube(n)`) et **skewb** (tours sur
diagonales).

## Documentation et workflow

- [docs/README.md](docs/README.md) — architecture et workflow
- [CONTRIBUTING.md](CONTRIBUTING.md) — installation, boucle quotidienne, checklist de PR
- Gitflow strict : on travaille sur `feature/*` depuis `develop`, jamais sur
  `main` / `develop` directement ([gitflow](docs/workflow/gitflow.md)).

`App` tient l’état (puzzle actif, look, historique, scramble).
`Scene` compose lumières, `PuzzleView` et post-FX. Les leçons 3×3 et le
miroir ne s’affichent que pour `cube3`.

## Licence

[MIT](LICENSE)
