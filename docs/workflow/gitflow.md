# Gitflow

Gitflow strict : pas
d’exception, pas de commit direct sur les branches permanentes.

## Branches

| Branche | Vit | Part de | Fusionne dans | Contient |
| --- | --- | --- | --- | --- |
| `main` | toujours | — | — | uniquement des versions taguées |
| `develop` | toujours | `main` | — | la prochaine version, toujours vert |
| `feature/<sujet>` | le temps d’une tâche | `develop` | `develop` | une fonctionnalité, un refacto, une doc |
| `release/<x.y.z>` | quelques jours | `develop` | `main` **et** `develop` | bump de version, correctifs de stabilisation |
| `hotfix/<x.y.z>` | quelques heures | `main` | `main` **et** `develop` (ou la `release/` ouverte) | correctif urgent sur la prod |

Nommage : `feature/` en kebab-case court (`feature/race-hook`,
`feature/td-01-worker-build`). Versions en SemVer sans `v` dans la
branche ; avec `v` dans le tag (`v0.2.0`).

## Règles

1. **Aucun commit direct** sur `main` ou `develop`. Seuls les merges y
   entrent.
2. **Merges toujours en `--no-ff`** vers `main` et `develop` : l’historique
   garde la trace de chaque branche.
3. `main` n’accepte que `release/*` et `hotfix/*`.
   `develop` n’accepte que `feature/*`, `release/*`, `hotfix/*`.
4. **Une feature = un sujet.** Si la description de PR contient « et
   aussi », c’est deux branches.
5. Une feature se met à jour par `git rebase develop` tant qu’elle n’est
   pas partagée ; ensuite par merge de `develop`.
6. **Une release ne reçoit plus de fonctionnalité**, uniquement des fix.
7. Chaque merge dans `main` est **tagué** et la version de
   `package.json` correspond au tag.
8. On ne réécrit jamais `main`, `develop` ni un tag (pas de
   `push --force`, pas de suppression).
9. `git pull --ff-only` sur les branches permanentes (configuré par
   `npm install`).
10. Une branche fusionnée est supprimée.

## Recettes

### Feature

```sh
git switch develop && git pull
git switch -c feature/race-hook
# … commits …
npm test && npm run build
git switch develop
git merge --no-ff feature/race-hook
git branch -d feature/race-hook
```

Avec un remote : pousser la branche et ouvrir une PR vers `develop` au
lieu du merge local.

### Release

```sh
git switch develop && git pull
git switch -c release/0.2.0
npm version 0.2.0 --no-git-tag-version
git commit -am "chore(release): 0.2.0"
# stabilisation : seulement des fix:
git switch main    && git merge --no-ff release/0.2.0
git tag -a v0.2.0 -m "0.2.0"
git switch develop && git merge --no-ff release/0.2.0
git branch -d release/0.2.0
```

### Hotfix

```sh
git switch main
git switch -c hotfix/0.2.1
npm version 0.2.1 --no-git-tag-version
git commit -am "chore(release): 0.2.1"
# … fix: …
git switch main    && git merge --no-ff hotfix/0.2.1
git tag -a v0.2.1 -m "0.2.1"
git switch develop && git merge --no-ff hotfix/0.2.1
git branch -d hotfix/0.2.1
```

Si une `release/` est ouverte, le hotfix fusionne dans la release au lieu
de `develop`.

## Versions

SemVer, phase `0.x` : `0.MINOR.0` pour une release de fonctionnalités,
`0.x.PATCH` pour un hotfix. `1.0.0` quand la dette P1 est vide : contrat
puzzle, écran et couches sont posés.

## Hooks

Dans [`.githooks/`](../../.githooks), activés par `npm install`
(`scripts/setup-git.mjs` → `core.hooksPath`, `--no-ff` sur `main` et
`develop`, `pull.ff only`).

| Hook | Bloque |
| --- | --- |
| `pre-commit` | commit direct sur `main` / `develop` ; nom de branche hors convention |
| `pre-merge-commit` | merge interdit (ex. `feature/*` → `main`, `develop` → `main`) |
| `commit-msg` | message hors Conventional Commits |
| `pre-push` | lint en erreur ; tests rouges ; suppression de `main` / `develop` |

Les hooks se contournent avec `--no-verify` : **interdit** par ces règles.
Ils sont un filet local, pas une garantie.

## Avec un remote (à faire au premier push)

Sur GitHub / GitLab, protéger `main` et `develop` :

- PR obligatoire, 1 approbation, pas d’auto-approbation ;
- statut CI requis (job `check` de `.github/workflows/ci.yml` : lint, test, build) ;
- pas de force-push, pas de suppression ;
- merge en « merge commit » uniquement (ni squash ni rebase) ;
- branche par défaut : `develop`.
