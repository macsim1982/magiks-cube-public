import { useEffect, useMemo, useState } from 'react';
import { guideLesson } from '../learn/guide';
import { faceletsFromTokens, failedLesson, searchLesson, searchingLesson } from '../learn/search';
import { requestSolution } from '../puzzles/cube/solverClient';

/**
 * Leçons calculées depuis un mélange : guide débutant (synchrone) et
 * solution courte (worker Kociemba). Une réponse obsolète est ignorée.
 */
export function useLessonSearch(puzzle) {
  const [moves, setMoves] = useState(null);
  const [token, setToken] = useState(0);
  const [search, setSearch] = useState(null);
  const { lessons, solver } = puzzle.capabilities;

  const guide = useMemo(() => {
    if (!moves?.length || !lessons) return null;
    try {
      return guideLesson(moves);
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [moves, lessons]);

  useEffect(() => {
    if (!moves?.length || !solver) {
      setSearch(null);
      return undefined;
    }
    let cancel = false;
    setSearch(searchingLesson(moves));
    requestSolution(faceletsFromTokens(moves))
      .then((solution) => {
        if (!cancel) setSearch(searchLesson(moves, solution));
      })
      .catch((error) => {
        console.error(error);
        if (!cancel) setSearch(failedLesson(moves));
      });
    return () => {
      cancel = true;
    };
  }, [moves, solver]);

  const api = useMemo(() => ({
    /** Nouveau mélange : relance guide et recherche, ouvre le guide (token). */
    feed(next) {
      setMoves(next);
      setToken((t) => t + 1);
    },
    clear() {
      setMoves(null);
      setSearch(null);
    },
  }), []);

  return { guide, search, token, ...api };
}
