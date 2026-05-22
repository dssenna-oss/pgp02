// Middleware de autenticação — bloqueia rotas autenticadas + /admin, /facilitador e /telao

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Mini-apps que SÓ o DPO/ADMIN acessa. Contribuidor (Saúde, RH, TI, etc.)
// participa via consulta/tramitação se o DPO precisar. Inventário e Riscos
// continuam abertos pra Contribuidor preencher.
const DPO_ONLY_DASHBOARD_PATHS = [
  "/dashboard/gap",
  "/dashboard/ripd",
  "/dashboard/terceiros",
  "/dashboard/dsr",
  "/dashboard/aviso",
  "/dashboard/incidentes",
];

// Páginas estáticas de fase (slides apresentados pelo facilitador) — não
// dependem de companyId, então o ADMIN pode acessá-las pra projetar.
// Exceção ao redirecionamento de admin que sai de /dashboard.
const ADMIN_DASHBOARD_PERMITIDO = [
  "/dashboard/conteudos-didaticos",
  "/dashboard/fase-preliminar",
  "/dashboard/fase-1",
  "/dashboard/fase-2",
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const role = token?.role;

    // Admin não pertence a grupo — clicar em mini-app de participante
    // estouraria 500 ("companyId ausente"). Redireciona pro painel.
    if (
      pathname.startsWith("/dashboard") &&
      role === "ADMIN" &&
      !ADMIN_DASHBOARD_PERMITIDO.includes(pathname)
    ) {
      return NextResponse.redirect(new URL("/facilitador", req.url));
    }

    // Mini-apps DPO-only — Contribuidor é redirecionado pra home
    if (DPO_ONLY_DASHBOARD_PATHS.some((p) => pathname.startsWith(p))) {
      if (role !== "DPO" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard?dpoOnly=1", req.url));
      }
    }

    // /admin, /facilitador e /telao exigem role ADMIN
    if ((pathname.startsWith("/admin") || pathname.startsWith("/facilitador") || pathname.startsWith("/telao")) && role !== "ADMIN") {
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
    "/telao",
  ],
};
