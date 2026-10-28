// Les bips du défi chrono, par Web Audio. Safari ne joue un son qu’après un
// geste : `unlockAudio` se branche sur le clic qui lance l’inspection.
let audioCtx;

export function unlockAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  audioCtx.resume();
  return audioCtx;
}

function beep({ frequency, offset }) {
  const ctx = unlockAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const start = ctx.currentTime + offset;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
  osc.start(start);
  osc.stop(start + 0.17);
}

/** @param {{ frequency: number, offset: number }[]} beeps */
export function playBeeps(beeps) {
  beeps.forEach(beep);
}
