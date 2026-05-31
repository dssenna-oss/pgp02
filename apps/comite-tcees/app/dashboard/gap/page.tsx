import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { GapClient } from "@/components/gap-client";

export const dynamic = "force-dynamic";

export default async function GapPage() {
  const answers = await prisma.gapAnswer.findMany();
  const respostasIniciais: Record<string, { aderencia?: string | null; cenarioAtual?: string | null; pontoMelhoria?: string | null }> =
    Object.fromEntries(
      answers.map((a) => [a.controlCode, { aderencia: a.aderencia, cenarioAtual: a.cenarioAtual, pontoMelhoria: a.pontoMelhoria }]),
    );

  return (
    <>
      <PageHeader
        emoji="🧩"
        title="GAP Analysis"
        lead="Fase 4 do PGP — diagnóstico de aderência à LGPD em 119 controles / 28 domínios (template oficial). Marque a aderência de cada controle; o score por domínio e geral é calculado automaticamente."
      />
      <GapClient respostasIniciais={respostasIniciais} />
    </>
  );
}
