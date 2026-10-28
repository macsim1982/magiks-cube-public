import { describe, expect, it } from 'vitest';
import { gestureQuarters, lockAxis, readGesture, snapQuarters } from './gesture';

const pair = (ax, ay, bx, by) => [{ x: ax, y: ay }, { x: bx, y: by }];
const start = pair(100, 300, 200, 300);
// Glissé de `length` px à `degrees` (écran, y vers le haut)
const toward = (degrees, length = 100) => {
  const a = (degrees * Math.PI) / 180;
  return { dx: length * Math.cos(a), dy: -length * Math.sin(a) };
};

describe('lockAxis', () => {
  it('waits until the fingers have really moved', () => {
    expect(lockAxis(readGesture(start, pair(105, 302, 205, 302)))).toBeNull();
  });

  it('reads the average of both fingers', () => {
    // Un doigt file à droite, l’autre bouge à peine : le milieu va à droite
    expect(lockAxis(readGesture(start, pair(160, 300, 202, 300)))).toBe('y');
  });

  it('splits the circle in three lines, 60° apart', () => {
    expect(lockAxis(toward(0))).toBe('y');
    expect(lockAxis(toward(180))).toBe('y');
    expect(lockAxis(toward(60))).toBe('x');
    expect(lockAxis(toward(240))).toBe('x');
    expect(lockAxis(toward(-60))).toBe('z');
    expect(lockAxis(toward(120))).toBe('z');
  });

  it('gives each line ±30°', () => {
    expect(lockAxis(toward(25))).toBe('y');
    expect(lockAxis(toward(35))).toBe('x');
    expect(lockAxis(toward(85))).toBe('x');
    expect(lockAxis(toward(95))).toBe('z');
    expect(lockAxis(toward(-25))).toBe('y');
    expect(lockAxis(toward(-35))).toBe('z');
  });
});

describe('gestureQuarters', () => {
  it('turns fingers sliding right into y prime', () => {
    expect(gestureQuarters('y', readGesture(start, pair(256, 300, 356, 300)), 390)).toBeCloseTo(-1, 6);
  });

  it('follows each diagonal: ↗ is x, ↘ is z, the other way is prime', () => {
    expect(gestureQuarters('x', toward(60, 156), 390)).toBeCloseTo(1, 6);
    expect(gestureQuarters('x', toward(240, 78), 390)).toBeCloseTo(-0.5, 6);
    expect(gestureQuarters('z', toward(-60, 156), 390)).toBeCloseTo(1, 6);
    expect(gestureQuarters('z', toward(120, 156), 390)).toBeCloseTo(-1, 6);
  });

  it('counts only the part of the slide along the line', () => {
    // 30° hors de la droite de x : cos 30° du glissé
    expect(gestureQuarters('x', toward(90, 156), 390)).toBeCloseTo(Math.cos(Math.PI / 6), 6);
  });

  it('never goes past a half turn', () => {
    expect(gestureQuarters('y', { dx: -2000, dy: 0 }, 390)).toBe(2);
    expect(gestureQuarters('z', toward(120, 2000), 390)).toBe(-2);
  });
});

describe('snapQuarters', () => {
  it('springs back below the threshold, else lands on a quarter', () => {
    expect(snapQuarters(0.2)).toBe(0);
    expect(snapQuarters(0.3)).toBe(1);
    expect(snapQuarters(-0.6)).toBe(-1);
    expect(snapQuarters(1.6)).toBe(2);
    expect(snapQuarters(-2)).toBe(-2);
  });
});
