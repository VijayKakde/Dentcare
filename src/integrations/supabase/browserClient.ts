import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// In some hosted preview environments, Vite env injection can be missing.
// These fallbacks prevent a blank-screen crash (publishable key is safe to ship).
const FALLBACK_SUPABASE_URL = "https://pfgpjlwnhmxifypfjjzb.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZ3BqbHduaG14aWZ5cGZqanpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDQ4MDksImV4cCI6MjA5ODMyMDgwOX0.D9KRp40j2XXLkBPWOR-Dph4waz1LBFXrY1VFSDKfVMc";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
