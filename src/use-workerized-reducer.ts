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
  reducer: Reducer<Draft<State>, Action>,
  initialState: State
) {
  let state = produce<State | {}>(
    {},
    (obj) => Object.assign(obj, initialState),
    (patches) => postMessage(patches)
  ) as State;
  addEventListener("message", ({ data }: MessageEvent) => {
    state = produce<State>(
      state,
      (state) => {
        reducer(state, data);
      },
      (patches) => postMessage(patches)
    );
  });
}

export function useWorkerizedReducer<State, Action>(
  worker: Worker,
  originalUseState: UseState<any>,
  originalUseEffect: UseEffect
): [State | null, DispatchFunc<Action>] {
  const [state, setState] = originalUseState(null);
  const [dispatch] = originalUseState({
    f: (a: Action) => {
      worker.postMessage(a);
    },
  });

  originalUseEffect(() => {
    function listener({ data }: MessageEvent) {
      const patches = data as Patch[];
      setState((state) => {
        return applyPatches(state ?? {}, patches);
      });
    }
    worker.addEventListener("message", listener);
    () => worker.removeEventListener("message", listener);
  }, []);

  return [state, dispatch.f];
}
