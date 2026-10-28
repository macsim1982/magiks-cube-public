// @ts-check
/**
 * Course chronométrée : null → cover → inspect → run → done.
 * Fonction pure, l’horloge est injectée. Une action hors de sa phase ne
 * change rien (même référence retournée).
 *
 * @typedef {{ phase: 'cover' | 'inspect' | 'run' | 'done', moves: string[], startedAt?: number, stoppedAt?: number | null }} Race
 * @param {Race | null} race
 * @param {{ type: 'start', moves: string[] } | { type: 'inspect' | 'solve' | 'finish' | 'clear' }} action
 * @param {number} now
 * @returns {Race | null}
 */
export function nextRace(race, action, now) {
  switch (action.type) {
    case 'start':
      return { phase: 'cover', moves: action.moves };
    case 'inspect':
      return race?.phase === 'cover' ? { ...race, phase: 'inspect', startedAt: now, stoppedAt: null } : race;
    case 'solve':
      return race?.phase === 'inspect' ? { ...race, phase: 'run', startedAt: now, stoppedAt: null } : race;
    case 'finish':
      return race?.phase === 'run' ? { ...race, phase: 'done', stoppedAt: now } : race;
    case 'clear':
      return null;
    default:
      return race;
  }
}
