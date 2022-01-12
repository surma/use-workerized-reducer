/* @jsx h */

import {h, render} from "preact";
import {useState, useEffect} from "preact/hooks";
import { testSuite, externalPromise } from "/tests/test-utils.js";
import { useWorkerizedReducer } from "/dist/preact/use-workerized-reducer.es.js";

const worker = new Worker(
	new URL("./worker.js", import.meta.url),
	{type: "module"}
);

testSuite("Remounting", async () => {
	const [promise, resolve] = externalPromise();
	function Counter({provideState}) {
		const [state, dispatch] = useWorkerizedReducer(
			worker,
			"reducer",
			{counter: 0}
		);

		useEffect(() => provideState({state, dispatch}), [state]);
		return <pre>{JSON.stringify(state, null, "  ")}</pre>
	} 

	function App() {
		const [state, setState] = useState(0);

		if(state === 0) {
			return <div>{state}: <Counter provideState={({state, dispatch}) => {
				if(state?.counter != 0) return;
				dispatch({type: "increment"});
				setState(state => state +1);
			}} /></div>
		} else if (state === 1) {
			setState(state => state+1);
			return <pre> {state} </pre>
		} else if(state === 2) {
			return <div>{state}<Counter provideState={({state, dispatch}) => {
				if(state?.counter == 0) resolve();
			}} /></div>
		} 
	}

	render(<App />, document.all.main);

	return promise;
});