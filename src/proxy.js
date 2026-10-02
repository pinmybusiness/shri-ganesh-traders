import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Har request pe: session refresh karo + bina login wale ko /login pe bhejo
// (Next.js 16 me isko "proxy" kehte hain, pehle "middleware" tha)
export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  // Login nahi hai aur protected page khol raha hai -> login pe bhejo
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Login hai aur /login khol raha hai -> dashboard pe bhejo
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Pages pe chale; PWA files (sw.js, manifest.json, icons) + static/images chhod do.
    // Warna manifest/sw login pe redirect ho jaate hain -> PWA install toot jata hai.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|webmanifest)$).*)",
  ],
};
