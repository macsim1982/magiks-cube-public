# Contribuer

## Installation

```sh
nvm use          # Node 24
npm install      # installe aussi les hooks git
npm run dev
```

Vérifier les hooks : `git config core.hooksPath` doit afficher `.githooks`.

## Boucle quotidienne

1. Partir de `develop` à jour : `git switch develop && git pull`.
2. Créer une branche : `git switch -c feature/<sujet>`.
3. Lire la doc de la couche touchée dans [`docs/architecture/`](docs/architecture/).
4. Coder, tester (`npm run test:watch`), commits en
   [Conventional Commits](docs/workflow/conventions.md#commits--conventional-commits).
5. Avant la PR : `npm run lint && npm test && npm run build`, vérification visuelle.
6. PR vers `develop` (ou merge local `--no-ff`, voir
   [gitflow](docs/workflow/gitflow.md#feature)).

## Checklist de PR

- [ ] Une branche = un sujet
- [ ] `npm run lint` sans erreur ni nouveau warning
- [ ] `npm test` vert
- [ ] `npm run build` vert
- [ ] Vérifié dans le navigateur (3×3 + un autre puzzle si `puzzles/` ou `scene/` touché)
- [ ] Sens des imports respecté ([overview](docs/architecture/overview.md#sens-des-imports))
- [ ] Doc d’architecture à jour
- [ ] Dette résolue retirée / dette ajoutée listée dans [tech-debt](docs/architecture/tech-debt.md)

## Références

- [docs/README.md](docs/README.md) — index de toute la documentation
- [docs/workflow/gitflow.md](docs/workflow/gitflow.md) — branches et releases
- [docs/workflow/conventions.md](docs/workflow/conventions.md) — commits, code, définition de « fini »
