## useWorkerizedReducer

`useWorkerizedReducer` is like `useReducer`, but the reducer runs in a worker. This makes it possible to place long-running computations in the reducer without affecting the responsiveness of the app.

Powered by [ImmerJS].

### Usage

```js
// worker.js
import { initWorkerizedReducer } from "use-workerized-reducer";

initWorkerizedReducer(
  "counter", // Name of the reducer
  (state, action) => {
    switch (action.type) {
      case "increment":
        state.counter += 1;
        break;
      case "decrement":
        state.counter -= 1;
        break;
      default:
        throw new Error();
    }
  }
);

// main.js
import { render, h, Fragment } from "preact";
import { useWorkerizedReducer } from "use-workerized-reducer/preact";

// Spin up the worker running the reducers
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

function App() {
  // A worker can contain multiple reducers, each with a unique name.
  // `busy` is true if any action is still being processed.
  const [state, dispatch, busy] = useWorkerizedReducer(
    worker,
    "counter", // Reducer name
    { counter: 0 } // Initial state
  );

  return (
    <>
      Count: {state?.count ?? "?"}
      <button disabled={busy} onclick={() => dispatch({ type: "decrement" })}>
        -
      </button>
      <button disabled={busy} onclick={() => dispatch({ type: "increment" })}>
        +
      </button>
    </>
  );
}
```

`userWorkerizedReducer` uses [ImmerJS]’s `produce()` and `applyPatches()` under the hood. This means that only patches are transferred between worker and main thread. Additionally, object identity is maintained as immutable data structures require. A reducer has to completely finish before the next action is processed.

### API

## TBD

Apache-2.0

[immerjs]: https://immerjs.github.io/immer/
