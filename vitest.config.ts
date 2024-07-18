import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    watch: {
      ignored: ["**/test/fixtures/package.json"],
    },
  },
  test: {
    coverage: {
      reporter: ["text", "clover", "json"],
    },
  },
});
