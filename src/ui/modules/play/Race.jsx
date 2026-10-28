// @ts-check
import { useEffect, useRef, useState } from 'react';
import { formatDuration } from '../../../lib/format/duration';
import { MoveList } from '../../components';
import { playBeeps, unlockAudio } from './beep';
import { crossedLevels, INSPECT_MS, INSPECTION_BEEPS, inspectionLevel, secondsLeft } from './inspection';
import './Race.scss';

const TONES = { calm: '', warn: 'is-warn', critical: 'is-critical' };

/** Le mélange à faire sur son vrai cube ; un clic lance l’inspection */
function RaceCover({ moves, onInspect }) {
  return (
    <button type="button" className="race-cover" onClick={() => { unlockAudio(); onInspect(); }}>
      <span className="race-cover__kicker">Mélange</span>
      <MoveList tokens={moves} />
      <span className="race-cover__hint">Espace ou un clic pour l’inspection</span>
    </button>
  );
}

/** Le compte à rebours, puis le chrono, en grand en haut */
function Readout({ tone, kicker, value }) {
  return (
    <p className={['race-readout', tone].filter(Boolean).join(' ')} aria-live="polite">
      <span className="race-readout__kicker">{kicker}</span>
      <span className="race-readout__value">{value}</span>
    </p>
  );
}

/**
 * L’horloge du défi : `now` toutes les 50 ms pendant l’inspection et la
 * résolution ; un bip par seuil franchi ; au bout des 15 s d’inspection, le
 * chrono part tout seul (`onStart`).
 */
function useRaceClock(race, onStart) {
  const [now, setNow] = useState(() => performance.now());
  const heard = useRef(/** @type {import('./inspection').InspectionLevel} */ ('calm'));
  const phase = race?.phase;
  const startedAt = race?.startedAt;
  const elapsed = phase === 'inspect' ? Math.max(0, now - startedAt) : 0;
  const level = phase === 'inspect' ? inspectionLevel(elapsed) : 'calm';

  useEffect(() => {
    if (phase !== 'inspect' && phase !== 'run') return undefined;
    const id = setInterval(() => setNow(performance.now()), 50);
    return () => clearInterval(id);
  }, [phase, startedAt]);

  // Un bip par seuil franchi ; une nouvelle inspection repart au calme
  useEffect(() => {
    crossedLevels(heard.current, level).forEach((crossed) => playBeeps(INSPECTION_BEEPS[crossed]));
    heard.current = level;
  }, [level]);

  useEffect(() => {
    if (phase !== 'inspect') return undefined;
    const left = INSPECT_MS - (performance.now() - startedAt);
    if (left <= 0) {
      onStart();
      return undefined;
    }
    const id = setTimeout(onStart, left);
    return () => clearTimeout(id);
  }, [phase, startedAt, onStart]);

  return { now, elapsed, level };
}

/**
 * Le défi chrono : la couverture du mélange, l’inspection, puis
 * le temps de la résolution.
 */
export default function Race({ race, onInspect, onStart }) {
  const { now, elapsed, level } = useRaceClock(race, onStart);

  if (!race) return null;
  if (race.phase === 'cover') return <RaceCover moves={race.moves} onInspect={onInspect} />;
  if (race.phase === 'inspect') return <Readout tone={TONES[level]} kicker="Inspection" value={secondsLeft(elapsed)} />;
  const end = race.stoppedAt ?? now;
  const finished = race.phase === 'done';
  return <Readout tone={finished ? 'is-done' : ''} kicker={finished ? 'Résolu' : 'Résolution'} value={formatDuration(end - race.startedAt)} />;
}
