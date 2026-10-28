// Pages éditoriales du menu ☰. Du texte seulement : une page,
// c’est un titre et des sections de paragraphes, avec des liens éventuels.

export const SITE_NAME = 'Magik’s Cube';

export const SITE_PAGES = [
  {
    id: 'credits',
    title: 'Crédits',
    sections: [
      {
        title: 'Les méthodes',
        text: [
          'La méthode pour débuter et la méthode intermédiaire suivent les pages de Francocube.',
        ],
        links: [
          { label: 'Francocube — méthode pour débuter', href: 'https://www.francocube.com/cyril/rubiks-cube' },
          { label: 'Francocube — méthode intermédiaire', href: 'https://www.francocube.com/deadalnix/moyen' },
        ],
      },
      {
        title: 'Le solveur',
        text: [
          'Le cube se résout avec cube.js (licence MIT), de Petri Lehtinen et Ludovic Fernandez.',
        ],
      },
      {
        title: 'Les outils',
        text: [
          'Le cube en 3D est dessiné avec three.js, React Three Fiber et drei. L’écran est fait avec React.',
          'Le texte est écrit avec la police Nunito.',
        ],
      },
    ],
  },
  {
    id: 'thanks',
    title: 'Remerciements',
    sections: [
      {
        text: [
          'Merci à la communauté Francocube, qui explique depuis des années comment résoudre le cube, en français et gratuitement.',
          'Merci à celles et ceux qui ont testé l’app et dit ce qui n’allait pas.',
        ],
      },
    ],
  },
  {
    id: 'terms',
    title: 'Conditions d’utilisation',
    sections: [
      {
        title: 'Ce que fait le site',
        text: [
          'Magik’s Cube est gratuit. Il n’y a ni compte, ni publicité.',
        ],
      },
      {
        title: 'Tes données',
        text: [
          'Le site garde sur ton appareil seulement : les étapes que tu as réussies, l’étape où reprendre, et si tu as déjà vu l’intro. Rien n’est envoyé ailleurs.',
          'Pour « Mon cube », la caméra sert à lire les couleurs de ton cube. Les photos restent sur ton appareil et ne sont pas gardées.',
        ],
      },
      {
        title: 'Éditeur et hébergeur',
        text: [
          'Le site est édité par Maxime Lerouge. Pour le joindre : macsim1982@gmail.com.',
          'Il est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.',
        ],
        links: [
          { label: 'Écrire à l’éditeur', href: 'mailto:macsim1982@gmail.com' },
          { label: 'vercel.com', href: 'https://vercel.com' },
        ],
      },
    ],
  },
];
