/* @jsx h */
import { render, h } from "preact";
import { useRef } from "preact/hooks";
import { useWorkerizedReducer } from "../src/use-workerized-reducer.preact.ts";

const w = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

function Counter() {
  const [state, dispatch, busy] = useWorkerizedReducer(
    w,
    "counter",
		{ counter: 0 }
  );

  return (
    <div>
      <button disabled={busy} onclick={() => dispatch({ type: "decrement" })}>-</button>
      <span>{state?.counter}</span>
      <button disabled={busy} onclick={() => dispatch({ type: "increment" })}>+</button>
    </div>
  );
}

function Name() {
  const [state, dispatch, busy] = useWorkerizedReducer(
    w,
    "name",
		{ name: "Test" }
  );
  const ref = useRef(null);

  return (
    <div>
      <span>{state?.name}</span>
      <br />
      <input type="text" ref={ref} disabled={busy} />
      <button disabled={busy} onclick={() => dispatch({ append: ref.current?.value ?? "" })}>
        Append
      </button>
    </div>
  );
}

function App() {
  return (
    <div>
      <Counter />
      <Name />
    </div>
  );
}

render(<App />, document.querySelector("main"));
