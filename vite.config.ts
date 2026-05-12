// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-tanstack": ["@tanstack/react-router", "@tanstack/react-query", "@tanstack/react-start"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-ui": ["lucide-react", "clsx", "tailwind-merge"],
            "vendor-charts": ["recharts"],
            "vendor-pdf": ["jspdf", "html2canvas"],
            "vendor-utils": ["zod", "date-fns", "react-hook-form"],
          },
        },
      },
    },
  },
});
