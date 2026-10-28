import { describe, expect, it } from 'vitest';
import { PLASTIC_SIZE, plasticMaps } from './plastic';

// Octet par octet : `toEqual` sur ces 1,8 million d’octets prend près de 3 s
const sameBytes = (a, b) => a.length === b.length && a.every((value, i) => value === b[i]);

describe('plasticMaps', () => {
  it('gives the same opaque RGBA maps on every call', () => {
    const first = plasticMaps();
    const second = plasticMaps();
    expect(Object.keys(first)).toHaveLength(7);
    for (const [name, data] of Object.entries(first)) {
      expect(data, name).toHaveLength(PLASTIC_SIZE * PLASTIC_SIZE * 4);
      expect(sameBytes(data, second[name]), name).toBe(true);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] !== 255) throw new Error(`${name}: pixel ${(i - 3) / 4} is not opaque`);
      }
    }
  });

  // Normales en espace tangent : elles sortent toujours de la surface (z > 0)
  it('points every normal out of the surface', () => {
    const maps = plasticMaps();
    for (const name of Object.keys(maps).filter((key) => key.endsWith('Normal'))) {
      const data = maps[name];
      for (let i = 2; i < data.length; i += 4) {
        if (data[i] < 128) throw new Error(`${name}: normal ${(i - 2) / 4} points inward`);
      }
    }
  });
});
