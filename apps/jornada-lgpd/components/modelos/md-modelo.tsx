// Renderizador do markdown simples dos modelos do Pacote e das minutas.
// Server-safe (sem estado, sem dangerouslySetInnerHTML). Entende:
//   "## " / "### "  títulos de seção
//   "- "            item de lista
//   "| a | b |"     linhas consecutivas viram tabela (rolagem horizontal)
//   **negrito** · _itálico_ · [PLACEHOLDER] destacado em âmbar
//   linhas começando com 📝 viram nota destacada (notas de redação do Kit)

import type { ReactNode } from "react";

// Inline: processa placeholders ANTES do itálico (os [_____] têm underscores).
function inline(texto: string, chave: string): ReactNode[] {
  const nos: ReactNode[] = [];
  const porNegrito = texto.split(/(\*\*[^*]+\*\*)/g);
  porNegrito.forEach((peda, i) => {
    const ehNegrito = peda.startsWith("**") && peda.endsWith("**");
    const conteudo = ehNegrito ? peda.slice(2, -2) : peda;
    const porPlaceholder = conteudo.split(/(\[[^\]\n]+\])/g);
    const filhos: ReactNode[] = [];
    porPlaceholder.forEach((parte, j) => {
      if (parte.startsWith("[") && parte.endsWith("]")) {
        filhos.push(
          <span
            key={`${chave}-${i}-${j}`}
            className="rounded bg-amber-100 px-1 font-medium text-amber-900"
          >
            {parte}
          </span>,
        );
        return;
      }
      const porItalico = parte.split(/(_[^_\n]{2,}_)/g);
      porItalico.forEach((it, k) => {
        if (it.startsWith("_") && it.endsWith("_") && it.length > 3) {
          filhos.push(<em key={`${chave}-${i}-${j}-${k}`}>{it.slice(1, -1)}</em>);
        } else if (it) {
          filhos.push(it);
        }
      });
    });
    if (ehNegrito) {
      nos.push(
        <strong key={`${chave}-b-${i}`} className="font-semibold text-gray-900">
          {filhos}
        </strong>,
      );
    } else {
      nos.push(...filhos);
    }
  });
  return nos;
}

function Tabela({ linhas, chave }: { linhas: string[]; chave: string }) {
  const rows = linhas.map((l) =>
    l
      .replace(/^\|\s?/, "")
      .replace(/\s?\|$/, "")
      .split(/\s\|\s/)
      .map((c) => c.trim()),
  );
  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full min-w-[280px] text-sm">
        <tbody>
          {rows.map((cels, i) => (
            <tr key={`${chave}-r-${i}`} className={i % 2 ? "bg-white" : "bg-gray-50/60"}>
              {cels.map((c, j) => (
                <td
                  key={`${chave}-c-${i}-${j}`}
                  className={
                    "border-b border-gray-100 px-2.5 py-1.5 align-top leading-relaxed " +
                    (j === 0 && cels.length > 1 ? "font-medium text-gray-800" : "text-gray-700")
                  }
                >
                  {inline(c, `${chave}-i-${i}-${j}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MdModelo({ md }: { md: string }) {
  const linhas = md.split("\n");
  const blocos: ReactNode[] = [];
  let tabela: string[] = [];

  const descarregaTabela = (chave: string) => {
    if (tabela.length) {
      blocos.push(<Tabela key={chave} linhas={tabela} chave={chave} />);
      tabela = [];
    }
  };

  linhas.forEach((linha, i) => {
    const k = `l${i}`;
    if (linha.startsWith("|")) {
      tabela.push(linha);
      return;
    }
    descarregaTabela(`t${i}`);
    const texto = linha.trim();
    if (!texto) {
      blocos.push(<div key={k} className="h-1.5" />);
      return;
    }
    if (texto.startsWith("## ")) {
      blocos.push(
        <p key={k} className="mt-4 text-[15px] font-bold text-teal-800">
          {texto.slice(3)}
        </p>,
      );
      return;
    }
    if (texto.startsWith("### ")) {
      blocos.push(
        <p key={k} className="mt-3 text-sm font-semibold text-gray-800">
          {texto.slice(4)}
        </p>,
      );
      return;
    }
    if (texto.startsWith("📝 ")) {
      blocos.push(
        <p
          key={k}
          className="my-2 rounded-lg border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-900"
        >
          {inline(texto, k)}
        </p>,
      );
      return;
    }
    if (texto.startsWith("- ")) {
      blocos.push(
        <p key={k} className="flex gap-2 pl-1 text-sm leading-relaxed text-gray-700">
          <span className="shrink-0 text-teal-600">•</span>
          <span>{inline(texto.slice(2), k)}</span>
        </p>,
      );
      return;
    }
    blocos.push(
      <p key={k} className="text-sm leading-relaxed text-gray-700">
        {inline(texto, k)}
      </p>,
    );
  });
  descarregaTabela("t-fim");

  return <div className="space-y-1">{blocos}</div>;
}

// Texto puro (pra área de transferência): remove marcadores, mantém conteúdo.
export function mdParaTextoPuro(md: string): string {
  return md
    .split("\n")
    .map((l) =>
      l
        .replace(/^#{2,3} /, "")
        .replace(/^\- /, "• ")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/^\|\s?/, "")
        .replace(/\s?\|$/, "")
        .replace(/\s\|\s/g, "  ·  "),
    )
    .join("\n")
    .trim();
}
