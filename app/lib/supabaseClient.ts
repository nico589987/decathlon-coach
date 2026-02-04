import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const fallbackUrl = "https://example.supabase.co";
const fallbackKey = "public-anon-key";

if (!supabaseUrl || !supabaseAnonKey) {
  // Avoid build-time crashes when env vars are missing (e.g., on Vercel).
  // Real requests will still require proper env vars to be set.
  console.warn(
    "Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(
  supabaseUrl || fallbackUrl,
  supabaseAnonKey || fallbackKey
);
