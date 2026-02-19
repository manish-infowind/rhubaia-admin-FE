import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      // Keeps current app behavior (no app-code changes needed) and makes updates seamless.
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "logo.svg",
        "placeholder.svg",
        "decryption-worker.js",
      ],
      manifest: {
        name: "Pinaypal - Admin Panel",
        short_name: "Pinaypal Admin",
        description: "Pinaypal - Admin Panel",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        icons: [
          {
            src: "/logo.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Conservative defaults: keep caching simple and avoid surprising runtime behavior.
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2,ttf,json}"],
        // Your main bundle is currently > 2 MiB; bump limit so the SW can precache it.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        // Enables PWA behavior in `vite dev` so you can test quickly.
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
