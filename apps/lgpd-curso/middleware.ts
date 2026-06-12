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

// Páginas estáticas de fase (slides apresentados pelo facilitador) + suas
// sub-rotas (práticas: termômetro, carta, setores, priorização, roadmap) —
// ADMIN pode acessar pra projetar/visualizar. As páginas detectam ausência
// de companyId e renderizam modo "Visualização do facilitador" no lugar
// do formulário interativo, evitando 500.
//
// Match via startsWith: liberar "/dashboard/fase-preliminar" também libera
// "/dashboard/fase-preliminar/termometro", "/dashboard/fase-preliminar/carta-alta-gestao", etc.
//
// SINCRONIA: toda página /dashboard projetável no Telão Comandado
// (lib/conteudos-telao.ts) PRECISA estar aqui — senão o telão (sessão ADMIN)
// é redirecionado pro /facilitador ao carregar o iframe. Mantenha as 2 listas
// alinhadas ao adicionar um conteúdo projetável.
const ADMIN_DASHBOARD_PERMITIDO = [
  "/dashboard/conteudos-didaticos",
  "/dashboard/entendendo-pgp",
  "/dashboard/historico-lgpd",
  "/dashboard/estrutura-lgpd",
  "/dashboard/fase-preliminar",
  "/dashboard/fase-1",
  "/dashboard/fase-2",
  // Encarregado é DPO-only do ponto de vista do CADASTRO, mas o card
  // "Coloque em prática" da Fase 1 linka pra cá. ADMIN consegue ver
  // a tela em modo visualização (form renderiza vazio, banner explica).
  "/dashboard/encarregado",
  // Caça às Pegadinhas (missão de Encerramento) — ADMIN consegue ver
  // o quiz pra preview/projeção mesmo sem grupo associado.
  "/dashboard/caca-pegadinhas",
];

function adminPodeAcessarDashboard(pathname: string): boolean {
  return ADMIN_DASHBOARD_PERMITIDO.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

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
      !adminPodeAcessarDashboard(pathname)
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
    "/telao-vivo/:path*",
  ],
};
