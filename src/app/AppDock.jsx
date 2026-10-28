// @ts-check
import { HomeDoors } from '../ui/modules/home';
import { KeysHelp } from '../ui/modules/keys';
import { Tutorial } from '../ui/modules/learn';
import { LookSwitch } from '../ui/modules/look';
import { Hud } from '../ui/modules/play';
import { LESSONS } from '../learn';
import { resumeDoor } from '../learn/resume';

/** Accueil : les trois portes */
function Doors({ app, actions }) {
  const { capabilities } = app.puzzle;
  return (
    <HomeDoors
      door={resumeDoor(app.resumeAt, LESSONS, app.progress)}
      canLearn={capabilities.lessons}
      canScan={capabilities.solver}
      onLearn={() => actions.learn('resume')}
      onScan={app.scan.open}
      onPlay={app.screens.play}
    />
  );
}

/** Apprendre : le tutoriel, branché sur le cube (`bridge`) et la progression */
function Learn({ app, actions }) {
  const { lessons, bridge } = app;
  return (
    <Tutorial
      guide={lessons.guide}
      entry={app.entry}
      start={app.resumeAt}
      onPlace={app.place}
      search={lessons.search}
      lessonsPicker={app.look.ui.lessons}
      onPose={bridge.onPose}
      onPlay={bridge.onPlay}
      onSeek={bridge.onSeek}
      onQuit={actions.goHome}
      practice={app.practice}
      onPracticeChange={app.setPracticing}
      progress={app.progress}
      onValidate={app.progressApi.mark}
    />
  );
}

/** Le dock du bas, selon l’écran */
export default function AppDock({ app, actions }) {
  const { look, view, puzzle } = app;
  return (
    <Hud
      ref={app.setDock}
      inert={app.intro.hidden}
      screen={view}
      history={app.history}
      home={<Doors app={app} actions={actions} />}
      onHome={actions.goHome}
      onShuffle={actions.shuffle}
      onChallenge={puzzle.capabilities.race ? actions.challenge : undefined}
      onReset={actions.reset}
      onUndo={actions.undo}
      lookToggle={!look.ui.panel && puzzle.mirror && view === 'play' ? (
        <LookSwitch
          mirror={app.cubeLook.mirror}
          disabled={app.show.length > 0}
          onChange={(mirror) => app.setLook((current) => ({ ...current, mirror }))}
        />
      ) : null}
      keys={<KeysHelp />}
      learn={app.showTutorial ? <Learn app={app} actions={actions} /> : null}
    />
  );
}
