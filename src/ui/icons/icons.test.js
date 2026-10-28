import { describe, expect, it } from 'vitest';
import { ICONS } from './icons';

describe('ICONS', () => {
  it('draws every icon with at least one path', () => {
    for (const [name, parts] of Object.entries(ICONS)) {
      expect(parts.length, name).toBeGreaterThan(0);
      for (const part of parts) expect(part.d, name).toMatch(/^[Mm]/);
    }
  });

  // Un dessin, un nom : deux icônes identiques sont un doublon à fusionner
  it('holds each drawing once', () => {
    const drawings = Object.values(ICONS).map((parts) => parts.map((part) => part.d).join('|'));
    expect(new Set(drawings).size).toBe(drawings.length);
  });
});
