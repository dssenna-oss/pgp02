import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  type PsiData,
  PSI_SECTION_LABELS,
  normalizePsiData,
} from "@/lib/psi-helpers";
import { TEXTAREA_FIELDS, CONTROL_LABELS } from "@/lib/psi-diff";

/**
 * Página pública de uma PSI publicada — `/psi-publico/<companySlug>/<psiSlug>`.
 * Sem autenticação, layout limpo (sem sidebar do dashboard).
 *
 * Só mostra PSIs com status=APROVADO E publishedContent não-null.
 * Outras devolvem 404 pra não revelar PSIs em rascunho.
 */
export default async function PublicPsiPage({
  params,
}: {
  params: Promise<{ companySlug: string; psiSlug: string }>;
}) {
  const { companySlug, psiSlug } = await params;

  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, companyName: true, tradeName: true, logoUrl: true, website: true },
  });
  if (!company) notFound();

  const psi = await prisma.psi.findFirst({
    where: {
      companyId: company.id,
      publicSlug: psiSlug,
      status: "APROVADO",
      NOT: { publishedContent: { equals: null as any } },
    },
    select: {
      id: true,
      title: true,
      publishedContent: true,
      publishedAt: true,
      publishedVersionNum: true,
      approvedBy: { select: { name: true } },
    },
  });
  if (!psi || !psi.publishedContent) notFound();

  const data = normalizePsiData(psi.publishedContent) as PsiData;
  const displayName = company.tradeName ?? company.companyName;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header institucional */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt={displayName} className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-md bg-cyan-100 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-600">
              🛡️
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold truncate">{displayName}</p>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-600 hover:underline truncate block"
              >
                {company.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-2">
          <p className="inline-block text-xs font-medium uppercase tracking-wide text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/40 px-2 py-0.5 rounded">
            Política de Segurança da Informação
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{psi.title}</h1>
          <p className="text-sm text-muted-foreground">
            Versão {psi.publishedVersionNum} · publicada em{" "}
            {psi.publishedAt?.toLocaleDateString("pt-BR")}
            {psi.approvedBy?.name ? ` por ${psi.approvedBy.name}` : ""}
          </p>
        </div>

        {/* Cabeçalho */}
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-3">
          <h2 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-800 pb-2 mb-3">
            Cabeçalho institucional
          </h2>
          {data.header.vigencia && <FieldRow label="Vigência" value={data.header.vigencia} />}
          {data.header.aplicabilidade && (
            <FieldRow label="Aplicabilidade" value={data.header.aplicabilidade} />
          )}
          {data.header.frequenciaRevisao && (
            <FieldRow label="Frequência de revisão" value={data.header.frequenciaRevisao} />
          )}
        </section>

        {/* 7 seções */}
        {PSI_SECTION_LABELS.map((meta, idx) => {
          const sectionData = (data as any)[meta.key] ?? {};
          const fields = TEXTAREA_FIELDS[meta.key] ?? [];
          const ctrlMap = CONTROL_LABELS[meta.key] ?? {};
          const controles = sectionData.controles ?? {};
          return (
            <section
              key={meta.key}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
            >
              <h2 className="text-lg font-semibold border-b border-gray-200 dark:border-gray-800 pb-2 mb-3 flex items-center gap-2">
                <span>{meta.icon}</span>
                <span>
                  {idx + 1}. {meta.label}
                </span>
              </h2>
              {fields.map((f) => {
                const val = String(sectionData[f.key] ?? "").trim();
                if (!val) return null;
                return <FieldRow key={f.key} label={f.label} value={val} />;
              })}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Controles aplicados
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {Object.entries(ctrlMap).map(([key, label]) => {
                    const checked = Boolean(controles[key]);
                    return (
                      <div
                        key={key}
                        className={`flex items-start gap-2 px-2 py-1.5 rounded text-sm ${
                          checked
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200"
                            : "bg-gray-50 dark:bg-gray-800/40 text-gray-500"
                        }`}
                      >
                        <span>{checked ? "✓" : "○"}</span>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Documento mantido por <strong>{displayName}</strong> · Gerado pelo PGP — LGPD Art. 50
        </footer>
      </main>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string; psiSlug: string }>;
}) {
  const { companySlug, psiSlug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, companyName: true, tradeName: true },
  });
  if (!company) return { title: "PSI não encontrada" };
  const psi = await prisma.psi.findFirst({
    where: { companyId: company.id, publicSlug: psiSlug, status: "APROVADO" },
    select: { title: true },
  });
  if (!psi) return { title: "PSI não encontrada" };
  return {
    title: `${psi.title} — ${company.tradeName ?? company.companyName}`,
    description: `Política de Segurança da Informação publicada por ${company.tradeName ?? company.companyName}.`,
  };
}
