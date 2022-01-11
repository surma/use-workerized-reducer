## useWorkerizedReducer

`useWorkerizedReducer` is like `useReducer`, but the reducer runs in a worker. This makes it possible to place long-running computations in the reducer without affecting the responsiveness of the app.
