import { initWorkerizedReducer } from "../src/use-workerized-reducer.ts";

initWorkerizedReducer(
  (state, { inc }) => {
    state.counter += inc;
  },
  { counter: 0 }
);
