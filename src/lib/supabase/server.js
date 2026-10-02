import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server component / server action me Supabase se baat karne ke liye
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component se call hua - ignore karo, middleware session refresh kar dega
          }
        },
      },
    }
  );
}
