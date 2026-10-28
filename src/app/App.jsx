// @ts-check
import { useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { CAMERA_HOME, Scene } from '../scene';
import { Scan } from '../ui/modules/scan';
import { createLook } from '../look';
import { DEFAULT_PUZZLE_ID, getPuzzle } from '../puzzles';
import AppDock from './AppDock';
import AppOverlays from './AppOverlays';
import { readArrowStyle } from './arrowStyle';
import { useCubeInput } from './useCubeInput';
import { useIntro } from './useIntro';
import { useLessonSearch } from './useLessonSearch';
import { useMoveHistory } from './useMoveHistory';
import { usePanelReserve } from './usePanelReserve';
import { usePractice } from './usePractice';
import { useProgress } from './useProgress';
import { useRace } from './useRace';
import { useRaceFlow } from './useRaceFlow';
import { useResume } from './useResume';
import { useScan } from './useScan';
import { useScramble } from './useScramble';
import { useScreen } from './useScreen';
import { useSession } from './useSession';
import { useTutorialBridge } from './useTutorialBridge';
import './App.scss';

// Le canvas couvre toute la scène et ne change jamais de taille avec le
// panneau : le cadrage tient compte du panneau à la place
/** @type {import('react').CSSProperties} */
const CANVAS_STYLE = { position: 'absolute', inset: 0 };

/**
 * En mode Apprendre le cube est toujours en couleurs ; l’intro
 * commence en Mirror. `show` : les pièces à suivre, les autres en gris.
 */
function useCubeLookFor({ look, show, puzzle, showTutorial, intro }) {
  return useMemo(() => {
    const { ui: _ui, ...rest } = look;
    return {
      ...rest,
      show,
      mirror: intro.mirror || (puzzle.mirror && !showTutorial && !show.length ? look.mirror : false),
    };
  }, [look, show, puzzle.mirror, showTutorial, intro.mirror]);
}

/** L’état de l’app : le puzzle, le look, les écrans, et les hooks qui en ont la charge */
function useAppState() {
  const cubeRef = useRef(null);
  const [dock, setDock] = useState(null);
  const [cubeKey, setCubeKey] = useState(0);
  const [puzzleId, setPuzzleId] = useState(DEFAULT_PUZZLE_ID);
  const puzzle = useMemo(() => getPuzzle(puzzleId), [puzzleId]);
  const [ready, setReady] = useState(false);
  // Le loader devient un rideau vide dès qu’il a servi à rejouer l’intro
  const [replayed, setReplayed] = useState(false);
  const [look, setLook] = useState(createLook);
  const [show, setShow] = useState([]);
  const [practicing, setPracticing] = useState(false);
  const [history, moves] = useMoveHistory(cubeRef, puzzle);
  const [race, raceApi] = useRace();
  const scramble = useScramble(cubeRef);
  // Flèche d’À toi : continue, ou en pointillés pour comparer
  const [arrowStyle] = useState(readArrowStyle);
  const [progress, progressApi] = useProgress();
  const [scanning, scan] = useScan();
  const [{ screen, entry }, screens] = useScreen();
  const [resumeAt, place] = useResume();
  return {
    cubeRef, dock, setDock, cubeKey, setCubeKey, puzzleId, setPuzzleId, puzzle, ready, setReady,
    replayed, setReplayed, look, setLook, show, setShow, practicing, setPracticing, history, moves,
    race, raceApi, scramble, progress, progressApi, scanning, scan, screen, entry, screens, resumeAt, place,
    lessons: useLessonSearch(puzzle),
    practice: usePractice(cubeRef, { puzzle, moves, arrow: arrowStyle }),
    intro: useIntro(cubeRef, puzzle),
  };
}

/** Les écrans et l’intro : sortir d’un écran remet le cube au propre */
function useNavigation(app, session) {
  const leave = () => {
    app.setShow([]);
    app.cubeRef.current?.follow([]);
    app.setPracticing(false);
    app.practice.stop();
    app.raceApi.clear();
  };
  const goHome = () => {
    leave();
    app.screens.home();
  };
  return {
    goHome,
    // Apprendre s’ouvre où l’enfant s’était arrêté, ou sur le guide du mélange
    learn: (where) => {
      leave();
      app.screens.learn(where);
    },
    // La scène a dessiné : le loader s’efface, sur l’intro si c’est la première visite
    onSceneReady: () => {
      app.setReady(true);
      if (app.intro.phase === 'wait') app.intro.begin();
    },
    replayIntro: () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      app.setReplayed(true);
      // Le menu est partout : l’intro repart de l’accueil
      app.intro.replay(() => {
        goHome();
        session.reset();
      });
    },
  };
}

export default function App() {
  const state = useAppState();
  const { puzzle, intro, screen } = state;
  const showTutorial = screen === 'learn' && puzzle.capabilities.lessons;
  // Un puzzle sans leçons reste dans Jouer
  const view = screen === 'learn' && !showTutorial ? 'play' : screen;
  const reserve = usePanelReserve(state.dock, view);
  const cubeLook = useCubeLookFor({ look: state.look, show: state.show, puzzle, showTutorial, intro });
  const raceFlow = useRaceFlow(state);
  const bridge = useTutorialBridge(state);
  const app = { ...state, showTutorial, view, cubeLook, bridge, raceFlow };
  const input = useCubeInput(app);
  const session = useSession(app);
  const nav = useNavigation(app, session);
  const actions = { ...session, ...nav, undo: input.undo, beginInspection: raceFlow.beginInspection };

  return (
    <div className={`app${showTutorial ? ' is-learning' : ''}${intro.hidden ? ' is-intro' : ''}${intro.phase === 'outro' ? ' is-outro' : ''}`}>
      <main className="stage">
        {/* Le scan couvre la scène : pas la peine de la dessiner */}
        <Canvas
          style={CANVAS_STYLE}
          frameloop={state.scanning ? 'never' : 'always'}
          shadows
          camera={{ position: CAMERA_HOME, fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: false }}
        >
          <Scene
            cubeRef={state.cubeRef}
            cubeKey={state.cubeKey}
            puzzle={puzzle}
            look={cubeLook}
            onTurn={input.onTurn}
            canTurn={input.canTurn}
            cameraLocked={state.practicing && showTutorial}
            reserve={reserve}
            intro={intro}
            onReady={nav.onSceneReady}
          />
        </Canvas>
        <AppOverlays app={app} actions={actions} />
        {state.ready && <AppDock app={app} actions={actions} />}
        {state.scanning && <Scan onClose={state.scan.close} onScanned={session.scanned} />}
      </main>
    </div>
  );
}
