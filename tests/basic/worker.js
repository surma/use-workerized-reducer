import { initWorkerizedReducer } from "/dist/preact/use-workerized-reducer.es.js";

initWorkerizedReducer("reducer", (state, { type }) => {
  if (type === "increment") {
    state.counter += 1;
  }
});
