import { createBrowserClient } from "@supabase/ssr";

// Browser (client component) me Supabase se baat karne ke liye
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
