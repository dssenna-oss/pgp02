import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { dataBR } from "@/lib/utils";
import { ferramentaDaEntrega } from "@/lib/entrega-ferramenta";
import { MarcosClient, type MarcoDTO } from "@/components/marcos-client";
import { VisaoGeralCards, type EntregaDTO, type EixoResumo } from "@/components/visao-geral-client";

export const dynamic = "force-dynamic";

export default async function VisaoGeral() {
  const [entregas, marcos, eixos, comite] = await Promise.all([
    prisma.entrega.findMany({ orderBy: { ordem: "asc" } }),
    prisma.marco.findMany({ orderBy: { ordem: "asc" } }),
    prisma.eixo.findMany({ orderBy: { ordem: "asc" } }),
    prisma.comite.findFirst(),
  ]);

  const total = entregas.length;
  const concluidas = entregas.filter((e) => e.status === "CONCLUIDO").length;
  const atrasadas = entregas.filter((e) => e.status === "ATRASADO").length;
  const execPct = total ? Math.round((concluidas / total) * 100) : 0;

  const eixosResumo: EixoResumo[] = eixos.map((eixo) => {
    const doEixo = entregas.filter((e) => e.eixoCodigo === eixo.codigo);
    const ok = doEixo.filter((e) => e.status === "CONCLUIDO").length;
    const pct = doEixo.length ? Math.round((ok / doEixo.length) * 100) : 0;
    return { id: eixo.id, codigo: eixo.codigo, nome: eixo.nome, pct, total: doEixo.length, concluidas: ok };
  });

  const proximo = marcos.find((m) => m.status !== "CONCLUIDO");

  // Entregas com o link da ferramenta que as executa (calculado ao vivo).
  const entregasDtos: EntregaDTO[] = entregas.map((e) => ({
    id: e.id,
    titulo: e.titulo,
    descricao: e.descricao,
    eixoCodigo: e.eixoCodigo,
    trimestre: e.trimestre,
    responsavel: e.responsavel,
    prazoTexto: e.prazoTexto,
    status: e.status,
    ferramentaHref: ferramentaDaEntrega(e.titulo)?.href ?? null,
  }));

  const marcosDtos: MarcoDTO[] = marcos.map((m) => ({
    id: m.id,
    dataISO: new Date(m.data).toISOString().slice(0, 10),
    dataBR: dataBR(m.data),
    descricao: m.descricao,
    eixoCodigos: m.eixoCodigos,
    tipo: m.tipo,
    status: m.status,
  }));

  return (
    <>
      <PageHeader
        emoji="📊"
        title="Visão geral"
        lead={`Acompanhamento do Plano de Trabalho do ${comite?.nomeComite ?? "Comitê"} — biênio ${comite?.bienio ?? "2026-2027"}.`}
      />

      <VisaoGeralCards
        execPct={execPct}
        concluidas={concluidas}
        total={total}
        atrasadas={atrasadas}
        eixos={eixosResumo}
        entregas={entregasDtos}
        marcoMae={comite?.marcoMae ?? "PGP consolidado"}
        marcoMaePrazo={dataBR(comite?.marcoMaePrazo)}
        proximoData={dataBR(proximo?.data)}
        proximoDesc={proximo?.descricao ?? "—"}
        marcosSlot={<MarcosClient marcos={marcosDtos} />}
      />
    </>
  );
}
