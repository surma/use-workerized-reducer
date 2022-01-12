import { initWorkerizedReducer } from "../src/use-workerized-reducer.preact.ts";

initWorkerizedReducer("counter", (state, { type }) => {
  switch (type) {
    case "increment":
      state.counter += 1;
      break;
    case "decrement":
      state.counter -= 1;
      break;
    default:
      throw new Error();
  }
});

initWorkerizedReducer("name", async (state, { append }) => {
  await sleep(1000);
  state.name += append;
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
