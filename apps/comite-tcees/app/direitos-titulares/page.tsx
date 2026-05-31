import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DSR_RIGHTS, DSR_RIGHT_CODES } from "@/lib/dsr-helpers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Direitos do Titular de Dados — TCE-ES" };

const CANAIS = [
  {
    titulo: "Ouvidoria — Conta pra Gente",
    desc: "Ponto de entrada recomendado. Escolha a opção LGPD para abrir sua manifestação.",
    href: "https://www.tcees.tc.br/ouvidoria/conta-pra-gente/",
    cta: "Abrir a Ouvidoria",
  },
  {
    titulo: "Acesso Identificado (peticionamento)",
    desc: "Protocole pelo sistema, assunto \"LGPD – Requerimento de Titular de dados – art. 18\". Exige conta e identificação (gov.br/certificado digital).",
    href: "https://acessoidentificado.tcees.tc.br/",
    cta: "Acessar o sistema",
  },
  {
    titulo: "Presencial — NCD / Protocolo",
    desc: "Entregue o Formulário de Requisição de Direitos do Titular preenchido + cópia de documento de identificação no Núcleo de Controle de Documentos.",
    href: "https://www.tcees.tc.br/lgpd/",
    cta: "Ver formulário e instruções",
  },
];

export default async function DireitosTitularesPage() {
  const [comite, encarregados] = await Promise.all([
    prisma.comite.findFirst({ select: { instituicao: true, sigla: true } }),
    prisma.membro.findMany({
      where: { funcao: { contains: "Encarregado" } },
      orderBy: { ordem: "asc" },
      select: { nome: true, funcao: true, email: true },
    }),
  ]);
  const inst = comite?.instituicao || "Tribunal de Contas do Estado do Espírito Santo";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] text-white">
        <div className="max-w-3xl mx-auto px-5 py-6">
          <div className="text-[12px] uppercase tracking-wide opacity-80">{inst}</div>
          <h1 className="text-2xl font-bold mt-1">Direitos do titular de dados pessoais</h1>
          <p className="text-[13px] opacity-90 mt-2 leading-relaxed">
            A Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018) garante a você o direito de saber e
            decidir sobre o tratamento dos seus dados pessoais. Veja abaixo seus direitos e como exercê-los junto ao {comite?.sigla || "TCE-ES"}.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {/* Direitos */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Seus direitos (art. 18, 19 e 20 da LGPD)</h2>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {DSR_RIGHT_CODES.map((c) => (
              <div key={c} className="bg-white border rounded-lg p-3">
                <div className="text-[11px] font-bold text-brand-700">{DSR_RIGHTS[c].legal}</div>
                <div className="text-[13px] text-gray-800 mt-0.5">{DSR_RIGHTS[c].label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Canais oficiais */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-1">Como exercer seus direitos</h2>
          <p className="text-[13px] text-gray-600 mb-3">
            O pedido segue o rito oficial do {comite?.sigla || "TCE-ES"}. Escolha um dos canais abaixo. Por segurança, será
            solicitada a comprovação da sua identidade — isso protege seus dados contra acesso indevido por terceiros.
          </p>
          <div className="space-y-2.5">
            {CANAIS.map((c, i) => (
              <div key={c.titulo} className="bg-white border rounded-xl p-4 flex items-start gap-3">
                <div className="text-lg font-extrabold text-brand-600 w-6 shrink-0">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-gray-900">{c.titulo}</div>
                  <p className="text-[12.5px] text-gray-600 mt-0.5">{c.desc}</p>
                </div>
                <a href={c.href} target="_blank" rel="noreferrer" className="shrink-0 text-[12.5px] font-semibold bg-brand-600 text-white rounded-md px-3 py-2 hover:bg-brand-700">
                  {c.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Encarregado */}
        <section className="bg-white border rounded-xl p-4">
          <h2 className="text-base font-bold text-gray-900 mb-2">Encarregado pelo Tratamento de Dados Pessoais (DPO)</h2>
          {encarregados.length === 0 ? (
            <p className="text-[13px] text-gray-600">Contato em atualização. Use os canais oficiais acima.</p>
          ) : (
            <div className="space-y-2">
              {encarregados.map((e) => (
                <div key={e.nome} className="text-[13px] text-gray-700">
                  <span className="font-semibold">{e.nome}</span> — {e.funcao}
                  {e.email && <> · <a className="text-brand-600 hover:underline" href={`mailto:${e.email}`}>{e.email}</a></>}
                </div>
              ))}
            </div>
          )}
          <p className="text-[12px] text-gray-500 mt-3">
            Horário de atendimento: segunda a sexta-feira, das 12h às 19h. Mais informações no portal oficial de privacidade.
          </p>
          <a href="https://www.tcees.tc.br/lgpd/" target="_blank" rel="noreferrer" className="inline-block mt-2 text-[13px] font-semibold text-brand-600 hover:underline">
            Portal LGPD do {comite?.sigla || "TCE-ES"} →
          </a>
        </section>

        <p className="text-center text-[12px] text-slate-400">
          {inst} · Comitê Executivo de Proteção de Dados Pessoais
        </p>
      </div>
    </main>
  );
}
