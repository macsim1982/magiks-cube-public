// @ts-check
let worker;
let seq = 0;
/** @type {Map<number, { resolve: (moves: string[]) => void, reject: (error: Error) => void }>} */
const pending = new Map();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./kociemba.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (event) => {
    const job = pending.get(event.data.id);
    if (!job) return;
    pending.delete(event.data.id);
    if (event.data.error) job.reject(new Error(event.data.error));
    else job.resolve(event.data.solution);
  };
  worker.onerror = (event) => {
    const failed = worker;
    worker = null;
    failed?.terminate();
    const error = new Error(event.message || 'recherche interrompue');
    for (const job of pending.values()) job.reject(error);
    pending.clear();
  };
  return worker;
}

/** @param {string} facelets */
export function requestSolution(facelets) {
  const id = seq + 1;
  seq = id;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, facelets });
  });
}
