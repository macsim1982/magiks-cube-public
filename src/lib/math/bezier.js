// @ts-check
/**
 * Courbe de Bézier cubique d’animation, comme en CSS : de (0, 0) à (1, 1),
 * points de contrôle `p1` et `p2`. Rend la progression `y` pour un temps
 * `x` de 0 à 1 (Newton sur x).
 * @param {[number, number]} p1
 * @param {[number, number]} p2
 * @returns {(x: number) => number}
 */
export function cubicBezier([x1, y1], [x2, y2]) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const xAt = (t) => ((ax * t + bx) * t + cx) * t;
  const yAt = (t) => ((ay * t + by) * t + cy) * t;
  const dxAt = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = dxAt(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (xAt(t) - x) / d;
      if (t <= 0) return yAt(0);
      if (t >= 1) return yAt(1);
    }
    return yAt(t);
  };
}
