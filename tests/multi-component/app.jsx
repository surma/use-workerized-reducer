/* @jsx h */

import { h, render, Fragment } from "preact";
import { useEffect } from "preact/hooks";
import { testSuite, externalPromise } from "/tests/test-utils.js";
import { useWorkerizedReducer } from "/dist/preact/use-workerized-reducer.es.js";

const worker = new Worker(new URL("./worker.js", import.meta.url), {
  type: "module",
});

testSuite("Reusing a component", async () => {
  const [promise, resolve, reject] = externalPromise();
  const checkState = { counter1: -1, counter2: -1 };
  function check() {
    if (checkState.counter2 > 0) reject("Counter 2 got incremented");
    if (checkState.counter1 == 1 && checkState.counter2 == 0) resolve();
  }

  function Counter({ name, autoIncrement = false }) {
    const [state, dispatch] = useWorkerizedReducer(worker, "reducer", {
      counter: 0,
    });

    checkState[name] = state?.counter;
    check();

    useEffect(() => {
      if (autoIncrement) dispatch({ type: "increment" });
    }, []);

    return <pre>{JSON.stringify(state, null, "  ")}</pre>;
  }

  function App() {
    return (
      <Fragment>
        <Counter name="counter1" autoIncrement={true} />
        <Counter name="counter2" />
      </Fragment>
    );
  }

  render(<App />, document.all.main);

  return promise;
});
