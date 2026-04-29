
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PGP - Programa de Governança em Privacidade",
  description: "Sistema completo para gestão de conformidade com a LGPD",
  keywords: ["LGPD", "privacidade", "proteção de dados", "governança", "compliance"],
  authors: [{ name: "PGP System" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PGP",
  },
  icons: {
    icon: "/images/pwa/icon.png",
    apple: "/images/pwa/icon.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3B7FDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-startup-image" href="/images/pwa/splash.png" />
      </head>
      <body className={`${inter.className} relative min-h-screen`}>
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url("/background.png")',
            opacity: 0.2
          }}
        />
        <div className="relative z-10">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
