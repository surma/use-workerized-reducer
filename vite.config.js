export default {
  outDir: "./dist",
  build: {
    lib: {
      entry: "./src/use-workerized-reducer.ts",
      name: "use-workerized-reducer",
      formats: ["es"],
    },
  },
};
