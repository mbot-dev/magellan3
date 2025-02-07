import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/dev": {
        target: "http://localhost:8066", // 外部サーバーのURL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev/, ""),
      },
    },
  },
});
