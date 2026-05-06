
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { isSuperAdmin } from "@/lib/auth-helpers";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        let user;
        try {
          user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              company: true
            }
          });
        } catch (err: any) {
          // Diferencia falha de conexão (banco offline / credenciais do
          // DB erradas / pooler caído) de credenciais de USUÁRIO inválidas.
          // Sem isso, qualquer indisponibilidade do banco aparece como
          // "Credenciais inválidas" e leva o usuário a achar que digitou
          // senha errada quando o problema é infra.
          const code = err?.code;
          const msg = String(err?.message ?? "");
          if (
            code === "P1001" ||  // Can't reach database server
            code === "P1002" ||  // Database connection timed out
            code === "P1008" ||  // Operations timed out
            code === "P1010" ||  // User was denied access
            code === "P1017" ||  // Server closed the connection
            msg.includes("reach database") ||
            msg.includes("ECONNREFUSED") ||
            msg.includes("timed out")
          ) {
            console.error("[auth] Banco indisponível durante login:", code || msg);
            throw new Error("Banco de dados indisponível. Tente novamente em alguns segundos ou contate o administrador.");
          }
          // Erro genuinamente inesperado — propaga sem mascarar.
          throw err;
        }

        if (!user || !user.password) {
          throw new Error("Credenciais inválidas");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Credenciais inválidas");
        }

        // Verificar se o usuário está ativo
        if (!user.isActive) {
          throw new Error("Sua conta está inativa. Entre em contato com o administrador para ativá-la.");
        }

        // Remove o logoUrl da empresa — base64 incha o JWT e estoura
        // o limite de tamanho de header da Vercel (~16KB). O frontend
        // busca o logo separadamente via /api/company/logo.
        const companyForSession = user.company
          ? (() => {
              const { logoUrl: _omit, ...rest } = user.company;
              return rest;
            })()
          : null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          company: companyForSession,
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.company = user.company;
        // SUPER_ADMIN_EMAIL é env var server-only — calculamos no JWT
        // (server side) e propagamos pra session pro client poder usar
        // sem causar mismatch de hidratação.
        token.isSuperAdmin = isSuperAdmin(user.email);
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.company = token.company;
        session.user.isSuperAdmin = !!token.isSuperAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
