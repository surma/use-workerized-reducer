export default {
  outDir: "./dist",
  build: {
    target: "es2019",
    lib: {
      entry: "./src/use-workerized-reducer.ts",
      name: "use-workerized-reducer",
      formats: ["es"],
    },
  },
};
