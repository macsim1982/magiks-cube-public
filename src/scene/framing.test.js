import { describe, expect, it } from 'vitest';
import { CAMERA_HOME, fitDistance, homePose, introPose, lensShift, POLAR_MIN, SUBJECT_RADIUS } from './framing';

const REST = Math.hypot(...CAMERA_HOME);
const phone = { fov: 45, width: 390, height: 844, rest: REST };

describe('fitDistance', () => {
  it('matches the full-canvas fit when nothing is reserved', () => {
    const vertical = (45 * Math.PI) / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * (390 / 844));
    const legacy = SUBJECT_RADIUS / Math.sin(Math.min(vertical, horizontal) / 2);
    expect(fitDistance(phone)).toBeCloseTo(Math.max(REST, legacy), 6);
  });

  it('backs away when the panel leaves less height than width', () => {
    const tablet = { ...phone, width: 600, height: 800 };
    expect(fitDistance({ ...tablet, reserve: { bottom: 443 } })).toBeGreaterThan(fitDistance({ ...tablet, reserve: { bottom: 239 } }));
  });

  it('keeps the size on a narrow phone: the width is the limit', () => {
    expect(fitDistance({ ...phone, reserve: { bottom: 443 } })).toBe(fitDistance({ ...phone, reserve: { bottom: 239 } }));
  });

  it('never comes closer than the rest distance', () => {
    expect(fitDistance({ fov: 45, width: 1600, height: 900, rest: REST })).toBe(REST);
  });
});

describe('lensShift', () => {
  it('centres the subject in the free zone above the panel', () => {
    const free = 844 - 443;
    expect(844 / 2 - lensShift({ bottom: 443 }).y).toBe(free / 2);
  });

  it('centres it between a top bar and the panel', () => {
    const shift = lensShift({ top: 60, bottom: 200 });
    expect(844 / 2 - shift.y).toBe(60 + (844 - 60 - 200) / 2);
  });

  it('centres it right of a side column', () => {
    const shift = lensShift({ left: 400 });
    expect(1440 / 2 - shift.x).toBe(400 + (1440 - 400) / 2);
  });
});

describe('fitDistance with a side column', () => {
  it('backs away when the column leaves less width than height', () => {
    const desk = { fov: 45, width: 1100, height: 900, rest: REST };
    expect(fitDistance({ ...desk, reserve: { left: 400 } })).toBeGreaterThan(fitDistance(desk));
  });
});

describe('homePose', () => {
  it('is the start view, with the polar angle OrbitControls allows', () => {
    const [x, y, z] = CAMERA_HOME;
    const pose = homePose();
    expect(pose.theta).toBeCloseTo(Math.atan2(x, z), 6);
    expect(pose.phi).toBe(Math.max(POLAR_MIN, Math.acos(y / Math.hypot(x, y, z))));
  });

  // Caméra, arête de devant (1,5 ; 1,5) et arête du fond (-1,5 ; -1,5) dans
  // le même plan vertical : les deux arêtes se superposent à l’image
  it('looks along the cube diagonal, at the same height and distance as before', () => {
    expect(homePose().theta).toBeCloseTo(Math.PI / 4, 12);
    expect(CAMERA_HOME[1]).toBe(4);
    expect(Math.hypot(...CAMERA_HOME)).toBeCloseTo(Math.hypot(4, 4, 6), 12);
  });
});

describe('introPose', () => {
  const end = { ...homePose(), distance: 15 };

  it('lands exactly on the rest view', () => {
    const pose = introPose(1, end);
    expect(pose.theta).toBeCloseTo(end.theta, 9);
    expect(pose.phi).toBeCloseTo(end.phi, 9);
    expect(pose.distance).toBeCloseTo(end.distance, 9);
  });

  it('starts higher and a full turn away', () => {
    const pose = introPose(0, end);
    expect(pose.phi).toBeLessThan(end.phi);
    expect(pose.distance).toBeGreaterThan(0);
    expect(end.theta - pose.theta).toBeCloseTo(Math.PI * 2, 9);
  });
});
