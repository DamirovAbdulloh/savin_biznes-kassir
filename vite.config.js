import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
export default defineConfig({
  plugins: [vue(), svgLoader()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // Standart 5175 (landing 5173, admin 5174 bilan to'qnashmasin).
    // PORT env orqali o'zgartirsa bo'ladi. strictPort: band bo'lsa jimgina
    // boshqa portga o'tmasin — aks holda admin panel porti (5174) bilan
    // to'qnashib qolardi.
    port: Number(process.env.PORT) || 5175,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
