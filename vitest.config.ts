import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    root: "test/ts",
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
})
