import Link from "next/link";
import { UserCheck, ArrowRight } from "lucide-react";
import { VisualizadorSlides } from "@/components/visualizador-slides";
import { getFaseSlides } from "@/lib/slides-fases";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-server";
import { ensureColunaDpoJustificativa } from "@/lib/coluna-dpo-justificativa";

export const dynamic = "force-dynamic";

async function getStatusEncarregado() {
  const session = await getSession();
  const companyId = session?.user?.companyId;
  if (!companyId) return { cadastrado: false, dpoName: null as string | null };
  await ensureColunaDpoJustificativa();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { dpoName: true, dpoEmail: true, dpoTelefone: true },
  });
  const cadastrado = !!(company?.dpoName && company?.dpoEmail && company?.dpoTelefone);
  return { cadastrado, dpoName: company?.dpoName || null };
}

export default async function Fase1Page() {
  const fase = getFaseSlides("fase-1")!;
  const status = await getStatusEncarregado();
  return (
    <div className="max-w-4xl mx-auto">
      <VisualizadorSlides fase={fase} />

      {/* Coloque em prática — Designação formal do Encarregado (Art. 41 LGPD).
          Aproveita a página /dashboard/encarregado que já existe; aqui é só
          o "portal de entrada" pedagógico vindo dos slides da Fase 1. */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          🎯 Coloque em prática
        </h2>
        <Link
          href="/dashboard/encarregado"
          className="group block rounded-lg border-l-4 border-l-emerald-500 border border-emerald-100 bg-white p-4 hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <UserCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">Designação do Encarregado (DPO)</h3>
                {status.cadastrado && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    ✓ {status.dpoName}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Cadastrem o(a) Encarregado(a) do grupo (nome, e-mail, telefone). Esses dados são
                reutilizados automaticamente no RIPD, Aviso de Privacidade e Comunicação ANPD.
                Ao final, o app gera o <strong>Ato de Designação formal em DOCX</strong> (Art. 41
                LGPD + Resolução CD/ANPD nº 18/2024) pronto pra impressão e assinatura.
              </p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 group-hover:text-emerald-800">
                {status.cadastrado ? "Revisar e gerar Ato" : "Começar designação"}{" "}
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
