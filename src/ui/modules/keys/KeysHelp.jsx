// @ts-check
import { useEffect, useState } from 'react';
import { Button, Dialog, IconButton, Kbd } from '../../components';
import { useMedia } from '../../hooks';
import { Icon } from '../../icons';
import './KeysHelp.scss';

// Ordi : la souris d’abord, puis le clavier
const MOUSE = {
  title: 'À la souris',
  items: [
    { key: 'Glisse', name: 'Sur le cube', hint: 'Une rangée tourne, dans le sens où tu glisses' },
    { key: 'Glisse', name: 'À côté du cube', hint: 'Tu tournes autour du cube pour le voir de partout' },
    { key: 'Maj', name: 'Maj + glisse sur le cube', hint: 'Tout le cube tourne' },
    { key: 'Molette', name: 'Zoom', hint: 'Rapproche ou éloigne le cube' },
  ],
};

const KEYBOARD = [
  {
    title: 'Les faces au clavier',
    items: [
      { key: 'R', name: 'Droite', hint: 'La face à ta droite' },
      { key: 'L', name: 'Gauche', hint: 'La face à ta gauche' },
      { key: 'U', name: 'Haut', hint: 'La face au-dessus du cube' },
      { key: 'D', name: 'Bas', hint: 'La face en dessous du cube' },
      { key: 'F', name: 'Devant', hint: 'La face en face de toi' },
      { key: 'B', name: 'Derrière', hint: 'La face cachée derrière' },
    ],
  },
  {
    title: 'Les tranches du milieu',
    items: [
      { key: 'M', name: 'Milieu', hint: 'Entre la gauche et la droite' },
      { key: 'E', name: 'Équateur', hint: 'Entre le haut et le bas' },
      { key: 'S', name: 'Standing', hint: 'Entre le devant et le derrière' },
    ],
  },
  {
    title: 'Tourner tout le cube',
    items: [
      { key: 'X', name: 'Cube', hint: 'Comme R, mais tout le cube tourne' },
      { key: 'Y', name: 'Cube', hint: 'Comme U, mais tout le cube tourne' },
      { key: 'Z', name: 'Cube', hint: 'Comme F, mais tout le cube tourne' },
    ],
  },
  {
    title: 'Astuces',
    items: [
      { key: 'Espace', name: 'Sens inverse', hint: 'Garde Espace appuyée : le coup va dans l’autre sens (R’)' },
      { key: '⌫', name: 'Annuler', hint: 'La touche retour arrière défait le dernier coup' },
      { key: '?', name: 'Cette aide', hint: 'L’ouvre et la ferme' },
    ],
  },
];

// Tactile : un doigt, deux doigts, et le bouton Annuler
const TOUCH_GROUPS = [
  {
    title: 'Avec un doigt',
    items: [
      { key: '1 doigt', name: 'Sur le cube', hint: 'Une rangée tourne, dans le sens où tu glisses' },
      { key: '1 doigt', name: 'À côté du cube', hint: 'Tu tournes autour du cube pour le voir de partout' },
    ],
  },
  {
    title: 'Avec deux doigts',
    items: [
      { key: '2 doigts', name: 'N’importe où', hint: 'Glisse à deux doigts : tout le cube tourne' },
    ],
  },
  {
    title: 'Astuce',
    items: [
      { icon: 'undo', name: 'Annuler', hint: 'Ce bouton, en bas, défait le dernier coup' },
    ],
  },
];

const SHEETS = {
  desk: { kicker: 'Souris et clavier', icon: 'keyboard', groups: [MOUSE, ...KEYBOARD], other: 'touch', switchTo: 'Voir les gestes au doigt' },
  touch: { kicker: 'Au doigt', icon: 'hand', groups: TOUCH_GROUPS, other: 'desk', switchTo: 'Voir la souris et le clavier' },
};
// Tactile sans souris : la fiche des doigts s’ouvre d’abord
const TOUCH = '(hover: none) and (pointer: coarse)';

function Row({ item }) {
  return (
    <li className="keys-help__row">
      <Kbd className="keys-help__key">{item.icon ? <Icon name={item.icon} size={18} /> : item.key}</Kbd>
      <span className="keys-help__body">
        <span className="keys-help__name">{item.name}</span>
        <span className="keys-help__hint">{item.hint}</span>
      </span>
    </li>
  );
}

export default function KeysHelp() {
  const [open, setOpen] = useState(false);
  const own = useMedia(TOUCH) ? 'touch' : 'desk';
  const [shown, setShown] = useState(own);
  const sheet = SHEETS[shown];
  const show = () => {
    setShown(own);
    setOpen(true);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key !== '?' && !(e.key === '/' && e.shiftKey)) return;
      e.preventDefault();
      setShown('desk');
      setOpen((value) => !value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="keys-help">
      <IconButton icon={SHEETS[own].icon} label="Contrôles" aria-haspopup="dialog" aria-expanded={open} onClick={show} />
      <Dialog open={open} onClose={() => setOpen(false)} title="keys-help-title">
        <header className="keys-help__head">
          <p className="tutorial__kicker">{sheet.kicker}</p>
          <h2 id="keys-help-title">Comment tourner le cube</h2>
          <IconButton icon="close" label="Fermer" className="keys-help__close" onClick={() => setOpen(false)} />
        </header>
        {sheet.groups.map((group) => (
          <section key={group.title} className="keys-help__group">
            <h3>{group.title}</h3>
            <ul className="keys-help__list">
              {group.items.map((item) => (
                <Row key={(item.key ?? item.icon) + item.name} item={item} />
              ))}
            </ul>
          </section>
        ))}
        <Button variant="tonal" icon={SHEETS[sheet.other].icon} className="keys-help__switch" onClick={() => setShown(sheet.other)}>
          {sheet.switchTo}
        </Button>
      </Dialog>
    </div>
  );
}
