// Autenticação — credenciais (e-mail + senha) com next-auth, padrão da família.
// JWT carrega role (ADMIN = Clube do Servidor | GESTOR = instituição) e
// instituicaoId, pra evitar consulta ao banco em cada página.

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 dias
  pages: { signIn: "/entrar" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const senha = credentials?.senha ?? "";
        if (!email || !senha) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            nome: true,
            senha: true,
            role: true,
            instituicaoId: true,
            isActive: true,
          },
        });
        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(senha, user.senha);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          instituicaoId: user.instituicaoId,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.instituicaoId = (user as any).instituicaoId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).instituicaoId = token.instituicaoId ?? null;
      }
      return session;
    },
  },
};
