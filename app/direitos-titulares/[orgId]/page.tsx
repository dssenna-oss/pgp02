/**
 * Página pública — Requisição de Direitos do Titular (LGPD arts. 18, 19, 20).
 *
 * Acesso anônimo: o titular acessa por URL que contém o `companyId`.
 * Não exige login. Carrega dados institucionais (nome, DPO) para personalizar
 * o formulário, e renderiza o form client em camadas.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { DsrPublicForm } from "@/components/direitos-titulares/dsr-public-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { orgId: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.orgId },
    select: { companyName: true, tradeName: true },
  });
  const name = company?.tradeName || company?.companyName || "Instituição";
  return {
    title: `Exercer direitos LGPD — ${name}`,
    description: `Formulário público para exercício de direitos do titular previstos nos arts. 18, 19 e 20 da LGPD junto ao ${name}.`,
  };
}

export default async function DsrPublicPage({
  params,
}: {
  params: { orgId: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.orgId },
    select: {
      id: true,
      companyName: true,
      tradeName: true,
      cnpj: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      dpoName: true,
      dpoEmail: true,
      dpoPhone: true,
    },
  });

  if (!company) {
    notFound();
  }

  const displayName = company.tradeName || company.companyName;
  const fullAddress = [
    company.address,
    company.city ? `${company.city}/${company.state || ""}` : null,
    company.zipCode ? `CEP ${company.zipCode}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Cabeçalho institucional */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Formulário público de exercício de direitos do titular
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {displayName}
          </h1>
          {company.cnpj && (
            <p className="mt-1 text-sm text-slate-600">CNPJ {company.cnpj}</p>
          )}
          {fullAddress && (
            <p className="mt-1 text-sm text-slate-600">{fullAddress}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Card de orientações iniciais */}
        <section className="rounded-lg border border-blue-200 bg-blue-50/60 p-5 text-sm text-slate-800 sm:p-6">
          <h2 className="text-base font-semibold text-blue-900">
            Antes de preencher
          </h2>
          <ul className="mt-3 space-y-2 leading-relaxed">
            <li>
              <span className="font-semibold">Prazo legal de resposta:</span>{" "}
              até 15 (quinze) dias corridos do recebimento desta requisição
              (art. 19, §1º da LGPD).
            </li>
            <li>
              <span className="font-semibold">Custo:</span> o exercício dos
              direitos previstos na LGPD é{" "}
              <span className="font-semibold">gratuito</span> (art. 18, §5º).
            </li>
            <li>
              <span className="font-semibold">Identificação obrigatória:</span>{" "}
              esta requisição somente será atendida mediante comprovação
              inequívoca de identidade. Você precisará anexar cópia de documento
              oficial com foto (RG, CNH ou similar).
            </li>
            {company.dpoName && (
              <li>
                <span className="font-semibold">Encarregado (DPO):</span>{" "}
                {company.dpoName}
                {company.dpoEmail && (
                  <>
                    {" · "}
                    <a
                      href={`mailto:${company.dpoEmail}`}
                      className="text-blue-700 underline"
                    >
                      {company.dpoEmail}
                    </a>
                  </>
                )}
                {company.dpoPhone && <> · {company.dpoPhone}</>}
              </li>
            )}
          </ul>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Já enviou uma requisição? Consulte o andamento pelo número de
            protocolo.
          </p>
          <Link
            href={`/direitos-titulares/${company.id}/protocolo`}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Consultar protocolo →
          </Link>
        </div>

        {/* Formulário client */}
        <div className="mt-8">
          <DsrPublicForm
            company={{
              id: company.id,
              displayName,
              dpoEmail: company.dpoEmail,
            }}
          />
        </div>

        {/* Rodapé legal */}
        <footer className="mt-12 border-t pt-6 text-xs text-slate-500">
          <p>
            Esta página cumpre o dever de transparência ativa previsto nos arts.
            6º, VI; 9º; 18; 19; 20 e 23, I da Lei Geral de Proteção de Dados
            Pessoais (Lei nº 13.709/2018).
          </p>
          <p className="mt-2">
            Caso entenda que a resposta da instituição foi insuficiente, omissa
            ou contrária à LGPD, você pode encaminhar reclamação à{" "}
            <a
              href="https://www.gov.br/anpd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline"
            >
              Autoridade Nacional de Proteção de Dados (ANPD)
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
