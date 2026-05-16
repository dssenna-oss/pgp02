// =============================================================================
// NextAuth config — versão enxuta para o app de curso (Modalidade A)
// =============================================================================
// Diferenças vs. app de prod:
//   - Sem isSuperAdmin / tracking de lastLoginAt
//   - Sem omissão de logoUrl (treinamento não usa logos por empresa)
//   - Roles simplificados: ADMIN | DPO | MEMBER
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { company: true },
        });

        if (!user || !user.password) {
          throw new Error("Credenciais inválidas");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Credenciais inválidas");

        if (!user.isActive) {
          throw new Error("Conta inativa. Procure o facilitador.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          papel: user.papel ?? null,
          companyId: user.companyId,
          company: user.company,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 4 * 60 * 60, // 4h — mais que a aula prática
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.papel = user.papel;
        token.companyId = user.companyId;
        token.company = user.company;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.papel = token.papel;
        session.user.companyId = token.companyId;
        session.user.company = token.company;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
