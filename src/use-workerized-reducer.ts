import {
  produce,
  applyPatches,
  Patch,
  Draft,
  enablePatches,
  enableMapSet,
} from "immer";
enablePatches();
enableMapSet();

export type Reducer<State, Action, LocalState = {}> = (
  prevState: State,
  action: Action,
  localState: LocalState
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
export type UseMemo<T> = (
  factory: () => T,
  inputs: ReadonlyArray<any> | undefined
) => T;

interface InitMessage<State, Action> {
  __uwrType: "init";
  name: string;
  id: number;
  initialState: State;
}

interface DispatchMessage<State, Action> {
  __uwrType: "dispatch";
  name: string;
  id: number;
  action: Action;
}

interface DestroyMessage<State, Action> {
  __uwrType: "destroy";
  name: string;
}

interface PatchMessage<State, Action> {
  __uwrType: "patch";
  id: number;
  patches: Patch[];
}

type UWRMessage<State, Action> =
  | InitMessage<State, Action>
  | DispatchMessage<State, Action>
  | DestroyMessage<State, Action>;

export function initWorkerizedReducer<State, Action, LocalState = {}>(
  reducerName: string,
  reducer: Reducer<Draft<State>, Action>,
  initialLocalState: (initialState: State) => LocalState = () => ({} as any)
) {
  const activeReducers = new Map<
    String,
    WritableStream<UWRMessage<State, Action>>
  >();

  function sendPatch(id: number, patches: Patch[]) {
    const msg: PatchMessage<State, Action> = {
      __uwrType: "patch",
      id,
      patches,
    };
    postMessage(msg);
  }

  function createMessageQueue() {
    let localState: LocalState;
    let state: State | null = null;
    return new WritableStream<UWRMessage<State, Action>>({
      async write(data, controller) {
        switch (data.__uwrType) {
          case "init":
            {
              const { id, initialState } = data;
              state = initialState;
              localState = initialLocalState(state);
              sendPatch(id, []);
            }
            break;
          case "dispatch":
            {
              const { id, action } = data;
              state = await produce<State>(
                state,
                async (state) => {
                  await reducer(state, action, localState);
                },
                (patches) => sendPatch(id, patches)
              );
            }
            break;
          case "destroy":
            {
              const { name } = data;
              activeReducers.delete(name);
              controller.error();
            }
            break;
        }
      },
    });
  }

  function listener(ev: MessageEvent) {
    if (typeof ev.data !== "object" || !("__uwrType" in ev.data)) return;
    const data = ev.data as UWRMessage<State, Action>;
    if (data.__uwrType === "init") {
      const { name } = data;
      const [id, initReducerName] = JSON.parse(name) as [number, string];
      if (initReducerName !== reducerName) return;
      if (activeReducers.has(name)) return;
      const ws = createMessageQueue();
      activeReducers.set(name, ws);
    }
    const { name } = data;
    const ws = activeReducers.get(name);
    if (!ws) return;
    const w = ws.getWriter();
    w.write(data);
    w.releaseLock();
  }
  addEventListener("message", listener);
}

function uid() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16)
  ).join("");
}

let idCounter = 0;
export function useWorkerizedReducer<State, Action>(
  worker: Worker,
  reducerName: string,
  initialState: State,
  originalUseState: UseState<any>,
  originalUseEffect: UseEffect,
  originalUseMemo: UseMemo<number>
): [State | null, DispatchFunc<Action>, boolean] {
  const id = originalUseMemo(() => idCounter++, []);
  const [pendingIds] = originalUseState(new Set());
  const [state, setState] = originalUseState(initialState);
  // Initially set to true until the initialState
  // has been applied in the worker.
  const [isBusy, setBusy] = originalUseState(true);

  function fullReducerName() {
    return JSON.stringify([id, reducerName]);
  }

  // FIXME: This type is not correct. It’s any of the UWRMessages,
  // but without `id` or `name`. Couldn’t get it to work with `Omit` tho.
  function send(payload: Partial<UWRMessage<State, Action>>) {
    const id = uid();
    pendingIds.add(id);
    setBusy(true);
    worker.postMessage({ name: fullReducerName(), id, ...payload });
  }

  async function dispatch(action: Action) {
    send({
      __uwrType: "dispatch",
      action,
    });
  }

  originalUseEffect(() => {
    function listener(ev: MessageEvent) {
      if (typeof ev.data !== "object" || !("__uwrType" in ev.data)) return;
      const data = ev.data as PatchMessage<State, Action>;
      // For safety
      if (data.__uwrType !== "patch") return;
      const { id, patches } = data;
      if (!pendingIds.has(id)) return;
      pendingIds.delete(id);
      if (pendingIds.size === 0) setBusy(false);
      setState((state) => {
        return applyPatches(state, patches);
      });
    }
    worker.addEventListener("message", listener);
    send({ __uwrType: "init", initialState });
    () => {
      worker.removeEventListener("message", listener);
      send({ __uwrType: "destroy" });
    };
  }, []);

  return [state, dispatch, isBusy];
}
