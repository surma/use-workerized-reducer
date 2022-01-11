/* @jsx h */
import { render, h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { useWorkerizedReducer } from "../src/use-workerized-reducer.ts";

const w = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});
function App() {
  const [state, dispatch] = useWorkerizedReducer(w, useState, useEffect);

  return (
    <div>
      <span>{state?.counter}</span>
      <button onclick={() => dispatch({ inc: 1 })}>Increase</button>
    </div>
  );
}

render(<App />, document.querySelector("main"));
