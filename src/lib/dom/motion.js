// @ts-check
// Material Design 3 : emphasized (spatial) et standard (couleurs, overlays)
import { cubicBezier } from '../math/bezier';

export const mdEmphasized = cubicBezier([0.2, 0], [0, 1]);
export const mdStandard = cubicBezier([0.4, 0], [0.2, 1]);

export const MD_SPATIAL = 0.5;
export const MD_COLOR = 0.32;

const reduced = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function animate(duration, ease, onUpdate) {
  const ms = (reduced() ? 0 : duration) * 1000;
  let frame = 0;
  if (ms <= 0) {
    onUpdate(1);
    return () => {};
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / ms);
    onUpdate(ease(t));
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
