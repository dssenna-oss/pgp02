import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { getSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Comitê LGPD · TCEES — Plano de Trabalho",
  description:
    "Acompanhamento do Plano de Trabalho do Comitê Executivo de Proteção de Dados Pessoais do TCEES (biênio 2026-2027).",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="pt-BR">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
