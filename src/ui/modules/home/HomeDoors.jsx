// @ts-check
import { Progress } from '../../components';
import { Icon } from '../../icons';
import './HomeDoors.scss';

/**
 * Accueil : trois portes. « Apprendre » en grand, avec l’étape où
 * reprendre et l’avancée de la leçon ; puis « Mon cube » (le scan) et
 * « Jouer ». `door` vient de `learn/resume.js` (`resumeDoor`).
 */
export default function HomeDoors({ door, canLearn = true, canScan = false, onLearn, onScan, onPlay }) {
  return (
    <nav className="doors" aria-label="Que veux-tu faire ?">
      {canLearn && (
        <button type="button" className="door door--learn" onClick={onLearn}>
          <span className="door__icon"><Icon name="learn" /></span>
          <span className="door__text">
            <span className="door__title">Apprendre</span>
            <span className="door__sub">
              {door.started ? `${door.label} · ${door.title}` : 'Résoudre le cube, pas à pas'}
            </span>
            <Progress value={door.progress} className="door__progress" />
          </span>
          <span className="door__go">
            {door.started ? 'Continuer' : 'Commencer'}
            <Icon name="chevronRight" />
          </span>
        </button>
      )}
      {canScan && (
        <button type="button" className="door door--small" onClick={onScan}>
          <span className="door__icon"><Icon name="camera" /></span>
          <span className="door__title">Mon cube</span>
        </button>
      )}
      <button type="button" className="door door--small" onClick={onPlay}>
        <span className="door__icon"><Icon name="dice" /></span>
        <span className="door__title">Jouer</span>
      </button>
    </nav>
  );
}
