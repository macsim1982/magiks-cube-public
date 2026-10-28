// @ts-check
import { GuideChip, PuzzlePicker, Race } from '../ui/modules/play';
import { LookPanel } from '../ui/modules/look';
import { IntroSkip, Loader, SiteMenu, SiteTitle } from '../ui/modules/site';

/** Le chargement et l’intro : au premier chargement, le nom, la roue et le texte s’effacent avec le fond */
function IntroLayers({ app }) {
  const { ready, intro } = app;
  return (
    <>
      <Loader hidden={ready && !intro.veiled} quiet={app.replayed} />
      {intro.phase === 'play' && <IntroSkip onSkip={intro.skip} />}
    </>
  );
}

/** Le nom et le menu ☰, sur tous les écrans, sauf sous le scan ou les réglages */
function SiteLayers({ app, actions }) {
  const covered = app.scanning || app.look.ui.panel;
  return (
    <>
      <SiteTitle hidden={covered} />
      {!covered && <SiteMenu onReplay={app.intro.canReplay ? actions.replayIntro : undefined} />}
    </>
  );
}

/** Jouer : la course, ou la puce du guide d’un mélange */
function PlayLayers({ app, actions }) {
  return (
    <>
      <Race race={app.race} onInspect={actions.beginInspection} onStart={app.raceApi.solve} />
      {app.lessons.guide && !app.race && <GuideChip onOpen={() => actions.learn('guide')} />}
    </>
  );
}

/**
 * Ce qui se pose sur la scène, hors du dock : le chargement et l’intro, le
 * nom et le menu, la course ou la puce du guide, et les réglages du look
 * quand ils sont ouverts.
 */
export default function AppOverlays({ app, actions }) {
  const { ready, look } = app;
  return (
    <>
      <IntroLayers app={app} />
      {ready && <SiteLayers app={app} actions={actions} />}
      {ready && app.view === 'play' && <PlayLayers app={app} actions={actions} />}
      {ready && look.ui.puzzles && <PuzzlePicker value={app.puzzleId} onChange={actions.selectPuzzle} />}
      {ready && look.ui.panel && <LookPanel look={look} onChange={app.setLook} mirror={app.puzzle.mirror} />}
    </>
  );
}
