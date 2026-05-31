import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { CalendarioView, type EventoDTO } from "@/components/calendario-view";

export const dynamic = "force-dynamic";

function iso(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export default async function CalendarioPage() {
  const [marcos, reunioes, entregas] = await Promise.all([
    prisma.marco.findMany(),
    prisma.reuniao.findMany(),
    prisma.entrega.findMany({ where: { prazoData: { not: null } } }),
  ]);

  const eventos: EventoDTO[] = [
    ...marcos.map((m) => ({
      iso: iso(m.data),
      tipo: "MARCO" as const,
      titulo: m.descricao,
      eixo: m.eixoCodigos.split(",")[0],
      detalhe: m.tipo === "MAE" ? "marco-mãe" : null,
    })),
    ...reunioes.map((r) => ({
      iso: iso(r.data),
      tipo: "REUNIAO" as const,
      titulo: r.titulo,
      detalhe: r.hora ?? null,
    })),
    ...entregas.map((e) => ({
      iso: iso(e.prazoData!),
      tipo: "PRAZO" as const,
      titulo: e.titulo,
      eixo: e.eixoCodigo,
    })),
  ];

  return (
    <>
      <PageHeader
        emoji="📅"
        title="Calendário"
        lead="Reuniões, prazos de entregas e marcos críticos reunidos num só lugar."
      />
      <CalendarioView eventos={eventos} />
    </>
  );
}
