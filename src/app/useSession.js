/** Le cube repart de zéro : rien en cours, plus d’historique ni de course, toutes les pièces visibles */
function clearSession(app) {
  app.scramble.stop();
  app.moves.clear();
  app.lessons.clear();
  app.raceApi.clear();
  app.setShow([]);
}

/** « Mélanger » mélange seulement ; « Défi chrono » lance aussi la course */
function mix(app, timed) {
  const { puzzle, cubeRef, moves, raceApi, lessons, scramble } = app;
  const tokens = puzzle.scramble();
  const cube = cubeRef.current;
  const frame = cube?.getFrame() ?? puzzle.DEFAULT_FRAME;
  cube?.reset();
  moves.clear();
  raceApi.clear();
  app.setShow([]);
  const { lessons: guided, solver } = puzzle.capabilities;
  if (timed) raceApi.start(tokens);
  if (guided || solver) lessons.feed(tokens);
  // La couverture de course et les poses du tutoriel suivent la lecture
  scramble.start(tokens, frame, timed || guided);
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}

/**
 * Le cube 3D prend la position scannée comme un mélange, puis le guide
 * débutant « Sur ce mélange » s’ouvre dessus.
 */
function scanned(app, tokens) {
  app.scan.close();
  app.cubeRef.current?.reset();
  app.moves.clear();
  app.raceApi.clear();
  app.setShow([]);
  app.setPracticing(false);
  app.practice.stop();
  app.lessons.feed(tokens);
  app.scramble.start(tokens, app.puzzle.DEFAULT_FRAME, true);
  app.screens.learn('guide');
}

/** Remise à zéro, mélange, défi chrono, changement de puzzle, scan */
export function useSession(app) {
  const reset = () => {
    clearSession(app);
    app.setCubeKey((k) => k + 1);
  };
  return {
    reset,
    selectPuzzle: (id) => {
      if (id === app.puzzleId) return;
      clearSession(app);
      app.setPuzzleId(id);
      app.setCubeKey((k) => k + 1);
    },
    shuffle: () => mix(app, false),
    challenge: () => mix(app, true),
    scanned: (tokens) => scanned(app, tokens),
  };
}
