// =============================================================================
// NextAuth — versão mono-instituição (TCEES). Sem multi-tenant / papéis de curso.
// Papéis: ADMIN | COORDENADOR | MEMBRO  (todos veem o módulo do Comitê;
// edição/admin fica para etapas futuras).
// =============================================================================

import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        // SELECT específico (nunca include genérico) — protege o login de
        // quebrar quando o schema ganha coluna nova antes de o banco migrar.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isActive: true,
          },
        });

        if (!user || !user.password) throw new Error("Credenciais inválidas");

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Credenciais inválidas");
        if (!user.isActive) throw new Error("Conta inativa. Procure o coordenador.");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 8 * 60 * 60, // 8h
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
