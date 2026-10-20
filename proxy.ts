import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, sessionCookieName } from "@/lib/auth/routes";
import { isLocale, negotiateLocale } from "@/lib/i18n/config";

/** Pages anyone can open without an account. */
const PUBLIC_PAGES = new Set(["login", "signup", "topics", "welcome", "learn", "how-to-play"]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const cookieName = supabaseUrl ? sessionCookieName(supabaseUrl) : null;

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, first, page] = pathname.split("/");

  if (!isLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${negotiateLocale(request.headers.get("accept-language"))}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Cookie presence is only a routing hint; API routes verify the session and RLS enforces access.
  // Signed-in users on the login page are sent on by the page itself after verifying the session,
  // so a stale cookie can never bounce between here and the login page.
  const signedIn =
    cookieName !== null && hasSessionCookie(request.cookies.getAll().map((c) => c.name), cookieName);

  // Newcomers opening the app see the introduction first, not a login form.
  if (!signedIn && !page) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/welcome`;
    return NextResponse.redirect(url);
  }

  if (!signedIn && !PUBLIC_PAGES.has(page ?? "")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/login`;
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }
}

export const config = {
  // Skip API routes, the auth callback, Next internals and files with an extension (icons, images).
  matcher: ["/((?!api|auth|_next|.*\\..*).*)"],
};
