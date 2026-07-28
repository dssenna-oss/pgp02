// Middleware — protege a área logada. "/" e /entrar são públicos.
// /admin exige role ADMIN (Clube do Servidor).

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/jornada", req.url));
    }
    // ADMIN sem instituição não tem jornada própria — vive no /admin.
    if ((pathname.startsWith("/jornada") || pathname.startsWith("/perfil")) && role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } },
);

export const config = {
  matcher: ["/jornada", "/jornada/:path*", "/perfil", "/admin", "/admin/:path*", "/senha"],
};
