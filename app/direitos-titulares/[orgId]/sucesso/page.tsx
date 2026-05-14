/**
 * Tela de sucesso pós-submissão da requisição.
 * Mostra protocolo gerado + instruções pra acompanhamento.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CheckCircle2, Mail, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DsrSuccessPage({
  params,
  searchParams,
}: {
  params: { orgId: string };
  searchParams: { protocolo?: string; email?: string };
}) {
  const protocolNumber = searchParams.protocolo;
  const email = searchParams.email;

  if (!protocolNumber) {
    notFound();
  }

  const company = await prisma.company.findUnique({
    where: { id: params.orgId },
    select: {
      id: true,
      companyName: true,
      tradeName: true,
      dpoEmail: true,
      dpoPhone: true,
    },
  });
  if (!company) {
    notFound();
  }

  const displayName = company.tradeName || company.companyName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-green-200 bg-green-50/40 p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Requisição registrada!
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            Sua solicitação foi recebida pelo{" "}
            <strong>{displayName}</strong>.
          </p>

          <div className="mt-6 rounded-lg border-2 border-dashed border-green-500 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Número do protocolo
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900">
              {protocolNumber}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Guarde este número. Ele será necessário para consultar o status.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-base font-semibold">Próximos passos</h2>

          <div className="rounded-lg border bg-white p-5">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 flex-shrink-0 text-blue-700" />
              <div>
                <p className="font-medium text-sm">Aguarde resposta em até 15 dias</p>
                <p className="mt-1 text-sm text-slate-600">
                  A instituição tem até <strong>15 dias corridos</strong> para
                  responder, conforme art. 19, §1º da LGPD. A resposta será
                  enviada pelo canal que você selecionou{email ? `, vinculado ao e-mail ${email}` : ""}.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <div className="flex gap-3">
              <FileText className="h-5 w-5 flex-shrink-0 text-blue-700" />
              <div>
                <p className="font-medium text-sm">Consulte o andamento</p>
                <p className="mt-1 text-sm text-slate-600">
                  Você pode consultar o status da sua requisição a qualquer
                  momento usando o número do protocolo e seu e-mail.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link
                    href={`/direitos-titulares/${company.id}/protocolo?protocolo=${encodeURIComponent(
                      protocolNumber,
                    )}${email ? `&email=${encodeURIComponent(email)}` : ""}`}
                  >
                    Consultar protocolo →
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {(company.dpoEmail || company.dpoPhone) && (
            <div className="rounded-lg border bg-slate-50 p-5">
              <p className="text-sm font-medium">Encarregado (DPO)</p>
              <p className="mt-1 text-sm text-slate-700">
                Para esclarecimentos adicionais sobre o tratamento de dados
                pessoais:
                {company.dpoEmail && (
                  <>
                    {" "}
                    <a
                      href={`mailto:${company.dpoEmail}`}
                      className="text-blue-700 underline"
                    >
                      {company.dpoEmail}
                    </a>
                  </>
                )}
                {company.dpoPhone && <> · {company.dpoPhone}</>}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/direitos-titulares/${company.id}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar à página inicial
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
