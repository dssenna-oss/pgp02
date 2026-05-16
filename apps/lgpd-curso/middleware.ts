// Middleware de autenticação — bloqueia rotas autenticadas + /admin e /facilitador

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin não pertence a grupo — clicar em mini-app de participante
    // estouraria 500 ("companyId ausente"). Redireciona pro painel.
    if (pathname.startsWith("/dashboard") && token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/facilitador", req.url));
    }

    // /admin e /facilitador exigem role ADMIN
    if ((pathname.startsWith("/admin") || pathname.startsWith("/facilitador")) && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin/:path*",
    "/facilitador/:path*",
  ],
};
