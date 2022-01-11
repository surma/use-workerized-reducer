import { produce, applyPatches, Patch, Draft, enablePatches } from "immer";
enablePatches();

export type Reducer<State, Action> = (
  prevState: State,
  action: Action
) => State;
export type DispatchFunc<Action> = (a: Action) => void;
export type UseReducer<State, Action> = (
  reducer: Reducer<State, Action>,
  initialState: State
) => [State, DispatchFunc<Action>];
export type UseEffect = (
  callback: () => void | (() => void),
  inputs: ReadonlyArray<any>
) => void;
export type StateUpdater<S> = (value: S | ((prevState: S) => S)) => void;
export type UseState<S> = (initialState: S | (() => S)) => [S, StateUpdater<S>];
export interface MutableRef<T> {
  current: T;
}
export type UseRef<T> = (initialValue: T) => MutableRef<T>;

export function initWorkerizedReducer<State, Action>(
  reducerName: string,
  reducer: Reducer<Draft<State>, Action>,
) {
  function send(id, value) {
    postMessage({
      name: reducerName,
			id,
      value,
    });
  }

  let state: State | null = null; 
	const ws = new WritableStream({
		async write(data) {
			const { name, id, action } = data;
			if (name != reducerName) return;

			// If state is null, the first message will be the initialState.
			if(state === null) {
				state = await produce<State>(
					{} as any,
					(obj) => Object.assign(obj, action),
					(patches) => send(id, patches)
				);
				return;
			}

			state = await produce<State>(
				state,
				async (state) => {
					await reducer(state, action);
				},
				(patches) => send(id, patches)
			);
		}
	});

  addEventListener("message", async ({ data }: MessageEvent) => {
		const w = ws.getWriter();
		w.write(data);
		w.releaseLock();
	});
}

function uid() {
	return Array.from({length: 16}, () => Math.floor(Math.random() * 256).toString(16)).join("");
}

export function useWorkerizedReducer<State, Action>(
  worker: Worker,
  reducerName: string,
	initialState: State,
  originalUseState: UseState<any>,
  originalUseEffect: UseEffect
): [State | null, DispatchFunc<Action>, boolean] {
	const [activeSet] = originalUseState(new Set());
  const [state, setState] = originalUseState(null);
	// Initially set to true until the initialState
	// has been applied in the worker.
  const [isBusy, setBusy] = originalUseState(true);

	function send(action) {
			const id = uid();
			activeSet.add(id);
			setBusy(true);
      worker.postMessage({ name: reducerName, id, action });
	}

  const [dispatch] = originalUseState({
    f: (action: Action) => send(action)
  });

  originalUseEffect(() => {
    function listener({ data }: MessageEvent) {
      const { name, id, value } = data;
      if (name != reducerName) return;
			activeSet.delete(id);
			if(activeSet.size === 0) setBusy(false);
      setState((state) => {
        return applyPatches(state ?? {}, value);
      });
    }
    worker.addEventListener("message", listener);
		send(initialState);
    () => worker.removeEventListener("message", listener);
  }, []);

  return [state, dispatch.f, isBusy];
}
