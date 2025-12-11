import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  build: {
    // Output only .js and .css into static/assets/
    outDir: "../static",
    emptyOutDir: true,

    // Prevent Vite from making assets/css/js folders
    assetsDir: ".",

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
