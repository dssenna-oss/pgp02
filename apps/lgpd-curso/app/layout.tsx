import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { TrainingBanner } from "@/components/training-banner";

export const metadata: Metadata = {
  title: "PGP Treinamento — Curso prático de LGPD",
  description: "Ambiente de treinamento para o curso presencial de LGPD. Não usar para dados reais.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <TrainingBanner />
        <Providers>{children}</Providers>
        <footer className="border-t bg-gray-50 py-3 px-4 text-center text-[11px] text-gray-500 mt-8">
          Curso prático de LGPD · Versão de treinamento · Não substitui o app de produção
        </footer>
      </body>
    </html>
  );
}
