import { useKeyboard } from './useKeyboard';

/**
 * Les coups de l’enfant : clavier, glissé, annuler.
 * Pendant l’intro, la couverture de course, une démo ou en attendant un
 * verdict d’À toi, le cube ne répond pas (`canTurn`). Toucher le cube depuis
 * l’accueil, c’est jouer.
 */
export function useCubeInput(app) {
  const { puzzle, raceApi, moves, practice, intro, screens, bridge, raceFlow } = app;
  const practiceOn = app.practicing && app.showTutorial;
  // Mode « À toi » : seuls les coups attendus comptent, rien pendant la démo
  const practiceBlocks = () => practiceOn && !practice.accepts();
  const blocked = () => intro.active
    || raceApi.phase() === 'cover'
    || practiceBlocks()
    || (app.showTutorial && bridge.demoing.current);

  const startPlaying = () => {
    if (app.screen === 'home') screens.play();
    if (raceApi.phase() === 'inspect') raceApi.solve();
  };
  const afterMove = () => {
    raceFlow.finishIfSolved();
    practice.check();
  };

  const play = (tokens) => {
    if (blocked()) return;
    startPlaying();
    if (practiceOn) practice.begin();
    moves.play(tokens, { onDone: afterMove });
  };

  const undo = () => {
    if (blocked() || practiceOn) return;
    moves.undo({ onDone: raceFlow.finishIfSolved });
  };

  const onTurn = (token, frame) => {
    startPlaying();
    moves.record(token, frame);
    // Un glissé pendant la démo est défait tout de suite
    if (practiceBlocks()) {
      moves.undo();
      return;
    }
    afterMove();
  };

  useKeyboard(puzzle, {
    onMove: (token) => play([token]),
    onUndo: undo,
    onSpace: () => {
      if (raceApi.phase() === 'cover') raceFlow.beginInspection();
      else if (raceApi.phase() === 'inspect') raceApi.solve();
    },
  });

  return { canTurn: () => !blocked(), undo, onTurn };
}
