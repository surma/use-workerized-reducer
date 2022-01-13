## useWorkerizedReducer

`useWorkerizedReducer` is like `useReducer`, but the reducer runs in a worker. This makes it possible to place long-running computations in the reducer without affecting the responsiveness of the app.

- Works with both [React] and [Preact].
- Weighs in at ~5KiB brotli’d.
- Powered by [ImmerJS].

### Example

```jsx
// worker.js
import { initWorkerizedReducer } from "use-workerized-reducer";

initWorkerizedReducer(
  "counter", // Name of the reducer
  async (state, action) => {
    // Reducers can be async!
    // Manipulate `state` directly. ImmerJS will take
    // care of maintaining referential equality.
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

// Spin up the worker running the reducers.
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
      Count: {state.counter}
      <button disabled={busy} onclick={() => dispatch({ type: "decrement" })}>
        -
      </button>
      <button disabled={busy} onclick={() => dispatch({ type: "increment" })}>
        +
      </button>
    </>
  );
}

render(<App />, document.querySelector("main"));
```

### Browser Support

`useWorkerizedReducer` works in all browsers. Firefox requires a polyfill.

(Currently, `useWorkerizedReducer` relies on `WritableStream`, which is available everywhere except Firefox. If you want to support Firefox, I recommend the [web-streams-polyfill].)

### Details

`useWorkerizedReducer` takes care of bringing the functionality of `useReducer` to a worker. It bridges the gap between worker and main thread by duplicating the reducer’s state to the main thread. The reducer manipulates the state object in the worker, and through [ImmerJS] only patches will be `postMessage()`’d to keep the main thread’s copy of the state up-to-date.

Due to the communication with a worker, `useWorkerizedReducer` is inherently asynchronous. In fact, part of the motivation was to enable long-running reducers, which means considerable time can pass between a `dispatch()` call and the subsequent state change. `useWorkerizedReducer` will fully finish processing an action before starting the next one, even if the reducer is async.

If a reducer is still running, the `busy` variable returned by `useWorkerizedReducer` will be set to `true`.

### API

#### Exported methods

##### `useWorkerizedReducer(worker, name, initialState): [State, DispatchFunc, isBusy];`

`isBusy` will be `true` until the `initialState` has been successfully replicated to the worker. Afterwards, `isBusy` is true when there actions still being processed, `false` otherwise.

##### `initWorkerizedReducer(name, reducerFunc, localState?);`

`name` is the name of the reducer, which has to be identical to the `name` passed into `useWorkerizedReducer`. `reducerFunc` is a function of type `(state, action, localState) => void | Promise<void>`. It behaves the same as the reducer function you pass to the vanilla `useReducer` hook. In contrast to the reducer functions from the vanilla `useReducer` hook, it is important to manipulate the `state` object directly. ImmerJS is recording the operations performend on the object to generate a patch set. Creating copies of the object will not yield the desired effect. Since the modifications to `state` have to be transferred back to the main thread, the state object can only hold [structured cloneable values].

`localState` is optional, and is a function of type `(initialState) => LocalState`. It will be called when a new reducer is being created and is expected to return a new local state instance. Local state will not be transferred to the main thread and therefore can hold references to values that are _not_ structured cloneable, like functions or errors.

### Convenience exports

For React:

```js
import { ... } from "use-workerized-reducer/react";
```

For Preact:

```js
import { ... } from "use-workerized-reducer/preact";
```

If, for some reason, you don’t want to use either of those, you can use the generic export. Note that `useWorkerizedReducer` takes 3 extra parameters, which have to be the `useState`, `useEffect` and `useMemo` hook in that order.

```js
import { ... } from "use-workerized-reducer";
```

---

Apache-2.0

[immerjs]: https://immerjs.github.io/immer/
[web-streams-polyfill]: https://www.npmjs.com/package/web-streams-polyfill
[react]: https://reactjs.org/
[preact]: https://preactjs.com/
[structured cloneable values]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types
