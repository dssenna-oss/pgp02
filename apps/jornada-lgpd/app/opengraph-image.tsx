// Cartão de compartilhamento (WhatsApp, LinkedIn, X...). Gerado no build pelo next/og —
// nenhuma imagem pra manter na mão. Satori exige display:flex em todo elemento com filhos.

import { ImageResponse } from "next/og";

// Edge: o gerador em Node quebra no build do Windows (fileURLToPath da fonte embutida).
export const runtime = "edge";

export const alt = "Jornada LGPD — Clube do Servidor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#115E59", // teal-800, o mesmo do cabeçalho
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 6,
              color: "#99F6E4", // teal-200
            }}
          >
            CLUBE DO SERVIDOR
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 104,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: -2,
            }}
          >
            Jornada LGPD
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 40,
              lineHeight: 1.35,
              color: "#CCFBF1", // teal-100
              maxWidth: 940,
            }}
          >
            Preencha o perfil da sua instituição uma vez — e saia com os 21 documentos da LGPD
            prontos em Word.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", width: 64, height: 6, backgroundColor: "#5EEAD4" }} />
          <div style={{ display: "flex", fontSize: 28, color: "#5EEAD4", fontWeight: 600 }}>
            jornada-lgpd.vercel.app
          </div>
        </div>
      </div>
    ),
    size,
  );
}
