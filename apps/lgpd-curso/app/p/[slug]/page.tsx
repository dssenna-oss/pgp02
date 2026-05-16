// Rota pública /p/[slug] — Aviso de Privacidade publicado pelo grupo.
// Sem autenticação. Renderização do Markdown como HTML simples (sem libs externas).

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function mdParaHtml(md: string): string {
  // Conversor Markdown -> HTML mínimo (h1-h3, parágrafos, listas, ênfase).
  // Suficiente pra Aviso de Privacidade do curso.
  let html = md;
  // Escape básico
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Listas
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul>${m.replace(/\n/g, "")}</ul>`);
  // Parágrafos
  html = html
    .split(/\n{2,}/)
    .map((b) => {
      if (b.match(/^<(h1|h2|h3|ul|li)/)) return b;
      if (!b.trim()) return "";
      return `<p>${b.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
  return html;
}

export default async function PoliciaPublica({ params }: { params: { slug: string } }) {
  const policy = await prisma.policy.findFirst({
    where: { publicSlug: params.slug, status: "PUBLICADO" },
    include: { company: { select: { name: true, cidade: true } } },
  });
  if (!policy) notFound();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif", lineHeight: 1.6, color: "#1a1a1a" }}>
      <header style={{ borderBottom: "2px solid #2563EB", paddingBottom: "1rem", marginBottom: "2rem" }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          {policy.company.name} · {policy.company.cidade ?? "Vegas"}
        </div>
        <h1 style={{ fontSize: 26, margin: 0 }}>{policy.titulo}</h1>
        {policy.publishedAt && (
          <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            Publicado em {new Date(policy.publishedAt).toLocaleDateString("pt-BR")}
          </div>
        )}
      </header>

      <article
        className="prose"
        dangerouslySetInnerHTML={{ __html: mdParaHtml(policy.conteudoMd) }}
      />

      <footer style={{ marginTop: "3rem", padding: "1rem", borderTop: "1px solid #e5e5e5", fontSize: 11, color: "#999", textAlign: "center" }}>
        Documento gerado em ambiente de treinamento · PGP Treinamento · não vinculante
      </footer>

      <style>{`
        .prose h1 { font-size: 22px; margin-top: 2em; margin-bottom: .5em; }
        .prose h2 { font-size: 18px; margin-top: 1.8em; margin-bottom: .5em; color: #2563EB; }
        .prose h3 { font-size: 15px; margin-top: 1.4em; margin-bottom: .3em; }
        .prose p { margin: 0.6em 0; }
        .prose ul { margin: 0.6em 0; padding-left: 1.5em; }
        .prose strong { color: #111; }
      `}</style>
    </div>
  );
}
