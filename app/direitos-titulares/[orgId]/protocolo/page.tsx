/**
 * Tela pública de consulta de protocolo.
 * O titular informa nº de protocolo + e-mail e vê o status atual.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { DsrProtocolLookup } from "@/components/direitos-titulares/dsr-protocol-lookup";

export const dynamic = "force-dynamic";

export default async function DsrProtocolPage({
  params,
  searchParams,
}: {
  params: { orgId: string };
  searchParams: { protocolo?: string; email?: string };
}) {
  const company = await prisma.company.findUnique({
    where: { id: params.orgId },
    select: { id: true, companyName: true, tradeName: true },
  });
  if (!company) notFound();
  const displayName = company.tradeName || company.companyName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Consulta de protocolo · {displayName}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Acompanhar requisição de direitos
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <DsrProtocolLookup
          orgId={company.id}
          initialProtocol={searchParams.protocolo}
          initialEmail={searchParams.email}
        />

        <div className="mt-8 text-center text-sm">
          <Link
            href={`/direitos-titulares/${company.id}`}
            className="text-blue-700 hover:underline"
          >
            ← Voltar e criar nova requisição
          </Link>
        </div>
      </main>
    </div>
  );
}
