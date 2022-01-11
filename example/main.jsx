/* @jsx h */
import { render, h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { useWorkerizedReducer } from "../src/use-workerized-reducer.ts";

const w = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

function Counter() {
  const [state, dispatch] = useWorkerizedReducer(
    w,
    "counter",
    useState,
    useEffect
  );

  return (
    <div>
      <span>{state?.counter}</span>
      <button onclick={() => dispatch({ inc: 1 })}>Increase</button>
    </div>
  );
}

function Name() {
  const [state, dispatch] = useWorkerizedReducer(
    w,
    "name",
    useState,
    useEffect
  );
  const ref = useRef(null);

  return (
    <div>
      <span>{state?.name}</span>
      <br />
      <input type="text" ref={ref} />
      <button onclick={() => dispatch({ append: ref.current?.value ?? "" })}>
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
