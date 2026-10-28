// @ts-check
import { Button, IconButton, MoveList } from '../../components';
import './Hud.scss';

/**
 * Les blocs de la barre de Jouer.
 * @typedef {{ history: { token: string }[], onHome: () => void, onShuffle: () => void, onChallenge: () => void,
 *   onReset: () => void, onUndo: () => void, lookToggle?: import('react').ReactNode, keys?: import('react').ReactNode }} PlayProps
 */

/**
 * La barre de Jouer : mêmes blocs partout, rangés par le CSS
 * @param {PlayProps & { dockRef?: import('react').Ref<HTMLDivElement>, inert?: boolean }} props
 */
function PlayDock({ dockRef, inert, history, onHome, onShuffle, onChallenge, onReset, onUndo, lookToggle, keys }) {
  const moves = history.slice(-10).map((move) => move.token);
  return (
    <div className="dock dock--play" ref={dockRef} inert={inert}>
      <IconButton variant="tonal" icon="chevronLeft" label="Accueil" className="dock__back" onClick={onHome} />

      <div className="dock__actions">
        <Button variant="filled" icon="shuffle" onClick={onShuffle}>
          Mélanger
        </Button>
        <Button icon="restart" onClick={onReset}>
          Recommencer
        </Button>
        {/* Toujours là, grisé sans coup : la barre ne change pas de taille */}
        <IconButton
          icon="undo"
          label="Annuler le dernier coup"
          className="dock__undo"
          disabled={history.length === 0}
          onClick={onUndo}
        />
      </div>

      <div className="dock__moves" aria-label="Derniers coups">
        {moves.length > 0 && <MoveList tokens={moves} />}
      </div>

      <div className="dock__end">
        {/* La course chronométrée, pour qui le veut */}
        {onChallenge && (
          <Button icon="timer" className="dock__challenge" title="Défi chrono" onClick={onChallenge}>
            <span className="dock__challenge-label">Défi chrono</span>
          </Button>
        )}
        {lookToggle}
        {keys}
      </div>
    </div>
  );
}

/**
 * Commandes du bas, selon l’écran :
 * - accueil : les trois portes (`home`) ;
 * - Jouer : une seule barre, mêmes blocs partout, rangés par le CSS (deux
 *   lignes fixes sur téléphone, une ligne sur grand écran) ;
 * - Apprendre : le panneau `learn`.
 *
 * @param {{ ref?: import('react').Ref<HTMLDivElement>, inert?: boolean, screen: string, home?: import('react').ReactNode, learn?: import('react').ReactNode } & Partial<PlayProps>} props
 */
export default function Hud({ ref, inert = false, screen, home, learn, ...play }) {
  if (screen === 'learn') {
    return (
      <div className="dock dock--learn" ref={ref} inert={inert}>
        {learn}
      </div>
    );
  }
  if (screen === 'home') {
    return (
      <div className="dock dock--doors" ref={ref} inert={inert}>
        {home}
      </div>
    );
  }
  // Sur Jouer, App donne tous les blocs de la barre
  return <PlayDock dockRef={ref} inert={inert} {.../** @type {PlayProps} */ (play)} />;
}
