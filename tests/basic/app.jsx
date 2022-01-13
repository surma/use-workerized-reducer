/* @jsx h */

import { h, render } from "preact";
import { useEffect } from "preact/hooks";
import { testSuite, externalPromise } from "/tests/test-utils.js";
import { useWorkerizedReducer } from "/dist/preact/use-workerized-reducer.es.js";

const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

testSuite("Basic reducer functionality", async () => {
  const [promise, resolve] = externalPromise();
  function App() {
    const [state, dispatch] = useWorkerizedReducer(worker, "reducer", {
      counter: 0,
    });

    useEffect(() => {
      if (state.counter === 0) dispatch({ type: "increment" });
      if (state.counter === 1) resolve();
    }, [state]);

    return <pre>{JSON.stringify(state, null, "  ")}</pre>;
  }

  render(<App />, document.all.main);

  return promise;
});
