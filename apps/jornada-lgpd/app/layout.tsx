import type { Metadata } from "next";
import { getSessao } from "@/lib/auth-server";
import { HeaderJornada } from "@/components/header-jornada";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jornada LGPD — Clube do Servidor",
  description:
    "Preencha o perfil da sua instituição uma vez e gere os 21 documentos da implementação da LGPD, prontos em Word, na ordem das 7 Fases.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessao();
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <HeaderJornada
          nome={user?.name ?? null}
          role={(user?.role as string) ?? null}
        />
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 pb-8 pt-4 text-center text-[11px] text-gray-400">
          Jornada LGPD · Clube do Servidor — documentos didáticos: adapte e submeta à revisão
          jurídica da sua instituição.
        </footer>
      </body>
    </html>
  );
}
