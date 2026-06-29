import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (not only VITE_) so we can map backend-provided vars
  // like SUPABASE_URL / SUPABASE_ANON_KEY into the VITE_* names our client expects.
  const env = loadEnv(mode, process.cwd(), "");

  // Safe fallbacks (URL + publishable key) so the app never blank-screens
  // even if a hosted preview doesn't inject env vars.
  const FALLBACK_BACKEND_URL = "https://qkzgtyjuffiakmgznjnd.supabase.co";
  const FALLBACK_BACKEND_PUBLISHABLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFremd0eWp1ZmZpYWttZ3puam5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzI1OTQsImV4cCI6MjA4NTYwODU5NH0.Cs4EwomO7mXnkeJrFqc6wHt6Lzx8X2krXpP644BflQg";

  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_BACKEND_URL;

  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_BACKEND_PUBLISHABLE_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Ensure these are ALWAYS inlined for the browser build (prevents runtime undefined)
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        supabasePublishableKey
      ),
    },
  };
});
