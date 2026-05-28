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
import { ensureColunasControleTurma } from "@/lib/colunas-controle-turma";
import { ensureColunaForumAberto } from "@/lib/coluna-forum-aberto";

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

        // SELECT específico em vez de include: { company: true }.
        // Lição cravada em feedback_prisma_user_select: include genérico
        // traz TODAS as colunas, então toda vez que o schema ganha coluna
        // nova e o banco prod ainda não migrou, o login QUEBRA em cascata
        // (todo endpoint autenticado falha). Listar campos protege contra
        // isso — desempenha bem mesmo se adicionar coluna nova depois.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true, // necessário pra bcrypt.compare
            role: true,
            papel: true,
            isActive: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true,
                cnpj: true,
                orgao: true,
                cidade: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          throw new Error("Credenciais inválidas");
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) throw new Error("Credenciais inválidas");

        if (!user.isActive) {
          throw new Error("Conta inativa. Procure o facilitador.");
        }

        // Auto-migração idempotente das colunas de Controle de Turma — roda em
        // qualquer login (inclusive do facilitador), garantindo que as colunas
        // existam antes de qualquer query que selecione todas as colunas de
        // curso_turmas.
        await ensureColunasControleTurma();
        await ensureColunaForumAberto();

        // Janela de acesso da turma — participantes só entram entre a data
        // inicial e a final definidas pelo facilitador. O facilitador (ADMIN)
        // entra sempre. Turma sem datas configuradas = sem restrição.
        if (user.role !== "ADMIN" && user.companyId) {
          const grupo = await prisma.cursoGrupo.findUnique({
            where: { companyId: user.companyId },
            select: {
              turma: {
                select: { acessoInicio: true, acessoFim: true, forumAberto: true },
              },
            },
          });
          const turma = grupo?.turma;
          if (turma?.acessoInicio || turma?.acessoFim) {
            const agora = new Date();
            const fmt = (d: Date) =>
              d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
            if (turma.acessoInicio && agora < turma.acessoInicio) {
              throw new Error(
                `O acesso a esta turma abre em ${fmt(turma.acessoInicio)}. Volte nessa data para entrar.`,
              );
            }
            // Fórum aberto = suporte pós-curso: ignora a data limite (acessoFim)
            // e deixa o participante entrar pra usar o fórum. A data inicial
            // (acessoInicio) continua valendo. Facilitador arquiva quando quiser.
            if (turma.acessoFim && agora > turma.acessoFim && !turma.forumAberto) {
              throw new Error(
                `O período de acesso a esta turma encerrou em ${fmt(turma.acessoFim)}. Procure o facilitador.`,
              );
            }
          }
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
