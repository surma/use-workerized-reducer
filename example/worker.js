import { initWorkerizedReducer } from "../src/use-workerized-reducer.ts";

initWorkerizedReducer(
  "counter",
  (state, { inc }) => {
    state.counter += inc;
  },
  { counter: 0 }
);

initWorkerizedReducer(
  "name",
  (state, { append }) => {
    state.name += append;
  },
  { name: "Test" }
);
