import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/static/',
  plugins: [react(), tailwindcss()],

  build: {
    outDir: "../static",
    emptyOutDir: true,
    assetsDir: ".", // keep assets in /static/assets/

    rollupOptions: {
      input: resolve(__dirname, "index.html"),

      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/index.js",
        assetFileNames: "assets/index.[ext]",
      }
    }
  }
});

