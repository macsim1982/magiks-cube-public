# Conventions

## Commits — Conventional Commits

```
<type>(<scope>)!: <résumé à l’impératif, ≤ 72 caractères>

<corps optionnel : pourquoi, pas quoi>
```

| Type | Usage |
| --- | --- |
| `feat` | fonctionnalité visible |
| `fix` | correction de bug |
| `refactor` | change la structure, pas le comportement |
| `perf` | performance |
| `test` | tests seuls |
| `docs` | documentation |
| `style` | SCSS / mise en forme sans effet fonctionnel |
| `build` | Vite, dépendances, scripts npm |
| `ci` | intégration continue |
| `chore` | maintenance, release |
| `revert` | annulation d’un commit |

Scope = la couche : `app`, `scene`, `puzzles`, `look`, `learn`, `scan`, `ui`,
`lib`, `styles`, `vendor`, `docs`, `git`, `release`. `!` = rupture du contrat
puzzle ou de l’API `PuzzleView`.

Exemples : `fix(puzzles): rebake skewb after cancel`,
`refactor(app)!: extract useRace reducer`.

Langue du résumé : anglais ou français, mais une seule langue par commit.

## Code

Reprendre l’idiome du fichier voisin. En plus :

- **Identifiants en anglais, textes UI et commentaires en français.**
- Objets plain et fonctions ; **pas de classes**, pas de store global.
- Un composant React par fichier, `PascalCase.jsx`. Modules non-React en
  `camelCase.js`.
- Exports nommés pour le domaine ; `export default` pour les composants.
- Commentaires : le *pourquoi*, rarement le *quoi*. JSDoc sur tout ce qui
  est exporté depuis `puzzles/`.
- Fichier de logique (`puzzles/`, `learn/`, `lib/`, `app/*.js`) et composant
  `.jsx` : `// @ts-check` en première ligne ; types partagés dans
  `puzzles/types.js`, props des composants en JSDoc.
- Pas de code commenté committé ; pas de `console.log` hors gestion
  d’erreur.
- **Forme des fonctions** : 3 paramètres au plus (au-delà, un
  objet nommé), 60 lignes au plus, complexité 12 au plus, 3 niveaux
  d’imbrication au plus. Au-delà, découper : sous-fonctions pures, hooks,
  adaptateurs, décorateurs. ESLint le refuse, partout dans `src/`.
- **Composants de base** : jamais de `className="btn …"`, de
  `<dialog>` ou de `<svg>` d’icône écrits à la main ; `<Button>`,
  `<IconButton>`, `<Dialog>`, `<Icon>` les portent ; un curseur ou un
  champ passe par `<Field type>`.
- **Pas de copier-coller** : une fonction répétée ou presque devient une
  fonction partagée, au niveau le plus bas qui convient (`lib/`, puis
  `puzzles/core/`, puis le module). `npm run dup` trouve les blocs copiés.
- SCSS : tokens et mixins de `src/styles/`, classes BEM
  `bloc__element--modif`. Un composant ou un module porte son `.scss` à
  côté de lui, l’importe (`import './Nom.scss'`) et range ses règles dans
  sa couche : `@layer components { … }` ou `@layer modules { … }`
 . Jamais de règle hors couche : elle passerait devant tout.
- Un module de l’UI (`ui/modules/<nom>/`) garde ses fichiers à plat et
  expose ce dont `app` a besoin par son `index.js`. Il n’importe pas un
  autre module (ESLint).
- Pas de nouvel alias que `@`.

## Tests

- Toute logique pure nouvelle ou modifiée dans `puzzles/`, `learn/` ou
  `app/*.js` a un test.
- Un bug corrigé dans du code pur arrive avec le test qui le reproduit.
- Pas de snapshot de rendu.

## Définition de « fini »

Une PR est mergeable quand :

1. `npm run lint` : 0 erreur, pas de nouveau warning ; `npm run typecheck` : 0 erreur ;
   `npm run dup` : aucun bloc copié dans un dossier nettoyé ;
2. `npm test` passe ;
3. `npm run build` passe ;
4. vérifié à la main dans `npm run dev` (3×3 **et** un autre puzzle si
   `puzzles/` ou `scene/` est touché) ;
5. aucune règle de [overview](../architecture/overview.md#sens-des-imports)
   violée ;
6. la doc d’architecture concernée est à jour ;
7. la ligne de [tech-debt](../architecture/tech-debt.md) résolue est
   retirée, une nouvelle dette assumée est ajoutée.
