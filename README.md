## useWorkerizedReducer

`useWorkerizedReducer` is like `useReducer`, but the reducer runs in a worker. This makes it possible to place long-running computations in the reducer without affecting the responsiveness of the app.

Powered by [ImmerJS]

### Usage

```js
// worker.js
import { initWorkerizedReducer } from "use-workerized-reducer";

initWorkerizedReducer(
  "counter", // Name of the reducer
  async (state, action) => {
    await sleep(1000); // Async reducers are supported
    state.counter += action.inc;
  },
  { counter: 0 }
);

// main.js
import { render, h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { useWorkerizedReducer } from "use-workerized-reducer";

// Spin up the worker running the reducers
const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

function App() {
  // Address reducer by name.
  // `busy` is true if any action is still being processed.
  // `useState` and `useEffect` need to be passed in, so that this library
  // can be used with preact and React alike.
  const [state, dispatch, busy] = useWorkerizedReducer(
    worker,
    "counter",
    useState,
    useEffect
  );

  return (
    <div>
      <div>{state?.counter}</div>
      <button onclick={() => dispatch({ inc: 1 })}>Increment</button>
    </div>
  );
}
```

---

Apache-2.0

[immerjs]: https://immerjs.github.io/immer/
