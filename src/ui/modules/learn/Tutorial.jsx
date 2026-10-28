// @ts-check
import { useEffect, useMemo } from 'react';
import { LESSONS } from '../../../learn';
import { EMPTY_GUIDE } from '../../../learn/guide';
import { EMPTY_SEARCH } from '../../../learn/search';
import { hasChallenge } from '../../../learn/challenge';
import { caseFocus } from '../../../learn/focus';
import { caseMission, stepTip } from '../../../learn/mission';
import { parseAlg } from '../../../puzzles/cube/notation';
import { useMedia } from '../../hooks';
import LearnHead from './LearnHead';
import StepCard from './StepCard';
import { stepNav } from './stepNav';
import { useChallenge } from './useChallenge';
import { useLearnMode } from './useLearnMode';
import { useLessonPlace } from './useLessonPlace';
import { usePracticeRun } from './usePracticeRun';
import { useProgressMarks } from './useProgressMarks';
import { useReadPlayback } from './useReadPlayback';
import './learn.scss';

// Tactile sans clavier : la bulle dit de tourner tout le cube à deux doigts
const TOUCH = '(hover: none) and (pointer: coarse)';
const NO_SHOW = [];
const FIRST = { lesson: 0, step: 0, alg: 0 };

/** Où en est la démo, pour les lecteurs d’écran */
function readingPlace(frame, total) {
  if (!total) return '';
  if (frame === 0) return 'Départ';
  return frame >= total ? 'Formule terminée' : `Coup ${frame} sur ${total}`;
}

/** Ce que lit un lecteur d’écran : la leçon, l’étape, le cas (ou le défi), la démo */
function liveText({ place, learn, playback, tokens }) {
  const name = learn.challenging ? 'Défi' : place.alg?.label;
  return [place.lesson.title, place.step.title, name, readingPlace(playback.frame, tokens.length)].filter(Boolean).join(', ');
}

/** Où Apprendre s’ouvre : le guide du mélange, ou là où l’enfant s’était arrêté */
const opening = (entry, start) => (entry === 'guide' ? { lesson: LESSONS.length, step: 0, alg: 0 } : start ?? FIRST);

/** Le cas ouvert : sa pose de départ, ses pièces à suivre, ses coups */
function caseOf({ step, alg }) {
  return {
    pose: alg && Object.hasOwn(alg, 'setup') ? alg.setup : step.pose,
    show: alg?.show ?? step.show ?? NO_SHOW,
    tokens: alg ? parseAlg(alg.alg) : [],
  };
}

/**
 * Le défi sur le cube : un cas reconnu, on le fait sans flèche ;
 * réussi, l’étape est fêtée. `again` : un autre cas.
 */
function useChallengeRun({ challenge, learn, run, onPracticeChange }) {
  const { win } = challenge;
  const won = learn.challenging && challenge.stage === 'do' && run.solved;
  useEffect(() => {
    if (won) win();
  }, [won, win]);
  return {
    ...challenge,
    guess: (at) => {
      if (challenge.guess(at)) onPracticeChange?.(true);
    },
    again: () => {
      onPracticeChange?.(false);
      challenge.start();
    },
  };
}

/** Le cas sur le cube : celui qui est ouvert, ou au défi celui tiré au sort */
function useShownCase({ place, learn, challenge, stepId }) {
  const { step, algIndex } = place;
  const shown = learn.challenging ? { step, alg: step.algs[challenge.index] } : place;
  const { pose, show, tokens } = caseOf(shown);
  // Les pièces à suivre : celles qui ne sont pas chez elles au départ du cas
  const focus = useMemo(() => caseFocus({ setup: pose, show, focus: shown.alg?.focus }), [pose, show, shown.alg]);
  const algKey = learn.challenging ? `${stepId}:defi${challenge.index}` : `${stepId}:${algIndex}`;
  return { pose, show, tokens, focus, algKey };
}

/** ‹ › : les cas, le défi, l’étape voisine (`stepNav`) */
function navOf(lessons, place, learn) {
  return stepNav(lessons, { lesson: place.lessonIndex, step: place.stepIndex, alg: place.algIndex }, {
    challenge: hasChallenge(place.step),
    inChallenge: learn.challenging,
    toChallenge: () => learn.changeMode('challenge'),
    go: (target) => {
      if (!target) return;
      if (target.newStep) learn.pickChapter(target.lesson, target.step, target.alg);
      else learn.pickAlg(target.alg);
    },
  });
}

/** Où reprendre la prochaine fois ; un nouveau cas (ou une nouvelle pose) repart du début */
function useCaseReset({ place, shown, playback, run, onPose, onPlace }) {
  const { lessonIndex, stepIndex, algIndex } = place;
  // Une vraie leçon, pas le guide
  useEffect(() => {
    if (lessonIndex < LESSONS.length) onPlace?.({ lesson: lessonIndex, step: stepIndex, alg: algIndex });
  }, [lessonIndex, stepIndex, algIndex, onPlace]);

  const { restart } = playback;
  const resetRun = run.reset;
  const { pose, show, focus, algKey } = shown;
  useEffect(() => {
    restart();
    resetRun();
    onPose?.(pose, show, focus);
  }, [lessonIndex, place.index, place.selected, pose, show, focus, onPose, algKey, restart, resetRun]);
}

/**
 * Apprendre. S’ouvre là où l’enfant s’était
 * arrêté (`start`), ou sur le guide du mélange (`entry` = `guide`) ;
 * `onPlace` reçoit chaque étape ouverte d’une vraie leçon. L’état vit dans
 * les hooks : la place, la démo, À toi, le défi, les coches, le mode.
 */
export default function Tutorial(props) {
  const { guide, entry = 'resume', start = FIRST, search, onPose, practice: practiceApi, onPracticeChange } = props;
  const lessons = useMemo(() => [...LESSONS, guide ?? EMPTY_GUIDE, search ?? EMPTY_SEARCH], [guide, search]);
  const place = useLessonPlace(lessons, opening(entry, start));
  const { lessonIndex, stepIndex, step, alg } = place;
  const touch = useMedia(TOUCH);
  const stepId = `${lessonIndex}:${stepIndex}`;
  const challenge = useChallenge({ step, stepId });
  const learn = useLearnMode({
    place, practiceApi, onPracticeChange, canPractice: caseOf(place).tokens.length > 0, canChallenge: hasChallenge(step),
    onEnter: (next) => enter(next),
  });
  const shown = useShownCase({ place, learn, challenge, stepId });
  const { pose, show, tokens, focus, algKey } = shown;
  const playback = useReadPlayback({ caseId: algKey, tokens, pose, onPlay: props.onPlay, onSeek: props.onSeek });
  const doing = learn.practicing || (learn.challenging && challenge.stage === 'do');
  const run = usePracticeRun({ active: doing, api: practiceApi, tokens, algKey, show, hidden: learn.challenging });
  const flow = useChallengeRun({ challenge, learn, run, onPracticeChange });
  // Entrer dans un mode : la démo et À toi repartent de la position du cas ; le défi tire un cas
  const enter = (next) => {
    playback.restart();
    run.reset();
    onPracticeChange?.(next === 'practice');
    if (next === 'challenge') challenge.start();
    else onPose?.(pose, show, focus);
  };
  const marks = useProgressMarks({
    progress: props.progress, lessons, place, solved: run.solved && !learn.challenging, watched: playback.done && !learn.challenging,
    challengeWon: challenge.stage === 'won', length: tokens.length, onValidate: props.onValidate,
  });
  useCaseReset({ place, shown, playback, run, onPose, onPlace: props.onPlace });

  return (
    <>
      <LearnHead lessons={lessons} place={place} marks={marks} learn={learn} lessonsPicker={props.lessonsPicker} onQuit={props.onQuit} />
      <StepCard
        caseId={algKey} step={step} selected={place.algIndex} tokens={tokens} playback={playback} run={run}
        nav={navOf(lessons, place, learn)} learn={learn} challenge={flow} stars={marks.stars(lessonIndex, stepIndex)}
        touch={touch} caseDone={marks.caseDone} mission={caseMission(step, alg)} tip={stepTip(step)}
        onReload={() => {
          playback.restart();
          onPose?.(pose, show, focus);
        }}
      />
      <p className="learn__live" aria-live="polite">{liveText({ place, learn, playback, tokens })}</p>
    </>
  );
}
