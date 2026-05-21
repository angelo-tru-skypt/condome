import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = "http://localhost:8069";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/condome_auth": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/condome_api": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
});
