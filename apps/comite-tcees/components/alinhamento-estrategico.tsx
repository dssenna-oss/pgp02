/**
 * Painel fixo de Alinhamento Estratégico (Portaria 22/2026, Art. 4º §1º II e III).
 * Amarra o Plano de Trabalho do Comitê ao Plano Estratégico do TCE-ES 2024-2037
 * e ao biênio. Recolhível para não competir com o cronograma.
 */
export function AlinhamentoEstrategico() {
  const linhas: { rotulo: string; valor: string }[] = [
    { rotulo: "Plano Estratégico TCE-ES 2024-2037", valor: "Objetivo “Garantir a excelência do sistema de governança do TCE-ES”." },
    { rotulo: "Diretriz", valor: "Política de Governança e Conformidade Legal — proteção de dados pessoais como dever institucional (LGPD, Lei 13.709/2018)." },
    { rotulo: "Aderência do Comitê", valor: "Programa de Governança em Privacidade (PGP) — instrumentaliza a conformidade à LGPD no TCE-ES." },
    { rotulo: "Tradução operacional", valor: "As 7 Fases do PGP convertem o objetivo estratégico em entregas concretas do biênio 2026-2027 (cronograma abaixo)." },
  ];

  return (
    <details className="bg-brand-50/60 border border-brand-200 rounded-lg mb-4 group" open>
      <summary className="cursor-pointer select-none px-4 py-2.5 text-[13px] font-bold text-brand-800 flex items-center gap-2">
        🎯 Alinhamento estratégico
        <span className="text-[11px] font-normal text-brand-600">(Portaria 22/2026, Art. 4º §1º, II e III)</span>
      </summary>
      <div className="px-4 pb-3.5 pt-1 space-y-1.5">
        {linhas.map((l) => (
          <div key={l.rotulo} className="text-[12.5px] text-gray-700 leading-relaxed">
            <b className="text-brand-800">{l.rotulo}:</b> {l.valor}
          </div>
        ))}
      </div>
    </details>
  );
}
