export default function (variant) {
  return {
    outDir: "./dist",
    build: {
      target: "es2019",
      emptyOutDir: false,
      lib: {
        entry: [
          "./src/use-workerized-reducer",
          variant !== "generic" ? variant : null,
          "ts",
        ]
          .filter(Boolean)
          .join("."),
        fileName: `${variant}/use-workerized-reducer`,
        formats: ["es"],
      },
      rollupOptions: {
        external: ["preact", "react", "preact/hooks"],
      },
    },
    optimizeDeps: {},
  };
}
