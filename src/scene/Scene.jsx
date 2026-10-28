// @ts-check
import { useState } from 'react';
import { BACKDROP } from '../look';
import { PuzzleView } from '../puzzles';
import FirstFrame from './FirstFrame';
import FitCamera from './FitCamera';
import { CAMERA_HOME, CLASSIC_RADIUS, NO_RESERVE, SUBJECT_RADIUS } from './framing';
import IntroCamera from './IntroCamera';
import KeyLight from './KeyLight';
import OrbitSnap from './OrbitSnap';
import ShaderWarmup from './ShaderWarmup';
import StudioEnvironment from './StudioEnvironment';
import PostFX from './effects/PostFX';

// Distance caméra–centre au repos : celle de la position initiale du Canvas
const CAMERA_REST = Math.hypot(...CAMERA_HOME);

const NO_INTRO = { active: false };

/**
 * `reserve` : `{ top, bottom, left }`, px gardés libres pour le chrome.
 * `intro` : la caméra suit l’intro tant qu’elle est active.
 * `onReady` : la scène a dessiné ses premières images.
 */
export default function Scene({
  cubeRef,
  cubeKey,
  onTurn,
  canTurn,
  look,
  puzzle,
  cameraLocked = false,
  reserve = NO_RESERVE,
  intro = NO_INTRO,
  onReady,
}) {
  // Shaders compilés : le puzzle se montre, `FirstFrame` compte ses images
  const [warm, setWarm] = useState(false);

  return (
    <>
      <color attach="background" args={[BACKDROP]} />
      <StudioEnvironment />
      <KeyLight />
      <ShaderWarmup onWarm={setWarm}>
        <PuzzleView
          key={`${puzzle.id}-${cubeKey}`}
          ref={cubeRef}
          puzzle={puzzle}
          onTurn={onTurn}
          canTurn={canTurn}
          look={look}
        />
      </ShaderWarmup>
      <FitCamera
        rest={CAMERA_REST}
        reserve={reserve}
        radius={look.mirror ? SUBJECT_RADIUS : CLASSIC_RADIUS}
        hold={intro.active}
      />
      <IntroCamera intro={intro} rest={CAMERA_REST} reserve={reserve} />
      <OrbitSnap locked={cameraLocked} disabled={intro.active} />
      {warm && <FirstFrame onReady={onReady} />}
      <PostFX />
    </>
  );
}
