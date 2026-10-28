# Écrire une leçon

Public : **10–12 ans**, souvent sur téléphone.
Les leçons vivent dans [`src/learn/`](../../src/learn/). Une étape s’affiche
dans une carte par-dessus le cube : elle doit se lire en quelques secondes.

## Anatomie d’une étape

```js
{
  title: 'La croix blanche',                       // ≤ 48 caractères
  goal: 'Fais une croix blanche sur le dessus.',       // ce qu’on voit à la fin, ≤ 64
  text: ['…', '…'],                                 // ≤ 5 paragraphes
  tip: 'Les centres ne bougent jamais.',            // astuce : une phrase, facultatif
  algs: [{
    label: 'Arête en bas',                          // ≤ 40
    mission: 'Monte l’arête blanche sur le dessus.',  // ce qu’on fait, ≤ 8 mots, facultatif
    alg: "…",
    setup: pose("…"),
    focus: [pieceWith(WHITE, 'back')],              // pièces à suivre, facultatif
  }],
  show: SHOW_WHITE_CROSS,                           // pièces mises en avant
}
```

La carte montre la **mission** du cas (sinon le `goal` de l’étape) et, sur
« Astuce », la phrase `tip` (sinon la première phrase de `text`).
Le reste du `text` ne s’affiche plus.

Sur le cube, la pièce à suivre a un halo turquoise et sa maison est en
pointillés. Elle se calcule : les
pièces de `show` qui ne sont pas chez elles au départ (4 au plus). Si le
calcul en trouve trop, nomme-la avec `focus` et `pieceWith(…couleurs)`.

Les limites sont vérifiées par [`writing.test.js`](../../src/learn/writing.test.js) :
`npm test` échoue si une phrase dépasse **16 mots**.

## Règles

1. **Tu.** On parle à l’enfant : « Mets le coin en bas », pas « On place ».
2. **Une idée par phrase.** Deux idées = deux phrases.
3. **Le but d’abord.** `goal` décrit ce qu’on voit quand c’est réussi.
4. **Un mot technique s’explique la première fois** :
   - **centre** : la pièce à 1 couleur, elle ne bouge jamais ;
   - **arête** : une pièce à 2 couleurs ;
   - **coin** : une pièce à 3 couleurs ;
   - **tordu** : à sa place, mais mal tourné.
5. **Pas de formule dans le texte**, sauf pour la notation : les lettres
   s’affichent sous la carte et s’allument quand elles sont jouées.
6. **Garder les images** qui aident à retenir : le Belge, l’histoire de la
   chaise, le petit curieux, la chaise rebondissante.
7. **Les questions guident** : « Il doit aller à droite ? Il part d’abord à
   gauche ! »
8. **Noms de cas courts** : ce sont des onglets sur téléphone.

## Icônes

L’icône d’une étape vient d’un **mot du titre** (`chapterKind` dans
[`learn/marks.js`](../../src/learn/marks.js)) : *notation*, *croix* /
*blanche*, *coin*, *belge* / *étage*, *jaune*, *arête*, *chaise*,
*rebond*, *centre*. Garder l’un de ces mots dans le titre.
L’icône d’un cas vient des **couleurs** citées dans son nom (*blanc*,
*vert*…) ou de *belge*, *chaise*, *curieux*, *rebond*.

## Ne pas toucher sans vérifier

`alg`, `setup`, `pose` et `show` décrivent les mouvements. Changer le texte
ne doit jamais les modifier ; changer une formule = tester sur le cube.
