import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { TrainingBanner } from "@/components/training-banner";
import { getSession } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "PGP Treinamento — Curso prático de LGPD",
  description: "Ambiente de treinamento para o curso presencial de LGPD. Não usar para dados reais.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Sessão resolvida no servidor e passada ao SessionProvider — assim o
  // useSession() já nasce "authenticated" no 1º render (SSR + cliente) e a
  // sidebar não pisca o menu errado enquanto a sessão carrega.
  const session = await getSession();
  return (
    <html lang="pt-BR">
      <body>
        <TrainingBanner />
        <Providers session={session}>{children}</Providers>
        <footer className="border-t bg-gray-50 py-3 px-4 text-center text-[11px] text-gray-500 mt-8">
          Curso prático de LGPD · Versão de treinamento · Não substitui o app de produção
        </footer>
      </body>
    </html>
  );
}
