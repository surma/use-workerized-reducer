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
  async (state, { append }) => {
    await sleep(1000);
    state.name += append;
  },
  { name: "Test" }
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
