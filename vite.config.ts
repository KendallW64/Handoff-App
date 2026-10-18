import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative compiled URLs work at both a Pages project path and a custom domain.
// Navigation is in-memory; this prototype does not need server-side route rewrites.
export default defineConfig({ plugins: [react()], base: "./" });
