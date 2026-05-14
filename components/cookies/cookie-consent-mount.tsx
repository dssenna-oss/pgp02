"use client";

import { usePathname } from "next/navigation";
import { CookieConsentProvider } from "@/lib/cookie-consent-context";
import CookieConsentBanner from "./cookie-consent-banner";

/**
 * CookieConsentMount — wrapper client que decide se Provider e Banner
 * devem ser renderizados baseado no pathname (CP26 Fatia 3).
 *
 * Decisão arquitetural (questão 1, opção 1b): banner aparece SÓ em
 * páginas públicas. Páginas autenticadas (dashboard, sysadmin) ficam
 * intocadas — assume que ao logar/cadastrar, o usuário já passou pelo
 * banner (e foi salvo em localStorage + backend).
 *
 * Páginas públicas onde o banner monta:
 *   - /                       → landing/home
 *   - /login, /signup
 *   - /forgot-password, /reset-password
 *   - /privacy, /terms        → páginas estáticas de privacidade/termos
 *   - /p/[companySlug]/...   → URLs públicas das políticas (Aviso,
 *                              Termos, Cookies geradas pela empresa)
 *
 * Páginas onde o banner NÃO monta:
 *   - /dashboard/*    → usuário já logado
 *   - /sysadmin/*     → super admin já logado
 *   - /api/*          → não aplicável (sem UI)
 *
 * Em rotas não-públicas, retornamos `children` sem o Provider —
 * `useCookieConsent()` não pode ser chamado nessas rotas, mas isso é
 * intencional (o banner não existe lá).
 */

/** Prefixos de pathname que devem montar o Provider+Banner. */
const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/terms",
  "/p/", // URLs públicas das políticas (Aviso, Termos, Cookies)
];

/** Pathnames exatos que devem montar o Provider+Banner. */
const PUBLIC_PATH_EXACT = ["/"];

function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  if (PUBLIC_PATH_EXACT.includes(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function CookieConsentMount({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (!isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <CookieConsentProvider>
      {children}
      <CookieConsentBanner />
    </CookieConsentProvider>
  );
}
