import { initWorkerizedReducer } from "/dist/preact/use-workerized-reducer.es.js";

initWorkerizedReducer(
  "reducer",
  (state, action, { increment }) => {
    state.counter += increment;
  },
  () => ({ increment: 1 })
);
