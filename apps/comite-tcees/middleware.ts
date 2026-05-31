// Middleware de autenticação — exige login em /dashboard e suas sub-rotas.
// Mono-instituição: todos os papéis (ADMIN/COORDENADOR/MEMBRO) acessam o
// módulo do Comitê. Restrições finas de edição ficam para etapas futuras.

import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*"],
};
