// Banner que aparece quando ADMIN/Facilitador acessa páginas de prática
// (Fase Preliminar · Fase 1 · Fase 2). As práticas dependem de companyId
// (gravam dados na company do grupo) e ADMIN não pertence a grupo.
//
// O banner é informativo — explica que é visualização, não interação. Os
// formulários renderizam normalmente mas com botões "Salvar" desabilitados
// (cada página decide). Pra interagir de verdade, ADMIN precisa deslogar
// e logar como DPO de um grupo.

import { getSession } from "@/lib/auth-server";
import { Eye } from "lucide-react";

export async function AdminPreviewBanner() {
  const session = await getSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const semCompany = !session?.user?.companyId;

  if (!isAdmin || !semCompany) return null;

  return (
    // esconder-em-projecao: no telão (Modo Projeção / iframe do Telão
    // Comandado) este aviso é ruído — só interessa ao facilitador navegando.
    <div className="esconder-em-projecao mb-4 rounded-md border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <Eye className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <div className="flex-1 text-xs text-amber-900">
          <div className="font-semibold mb-0.5">Modo Facilitador</div>
          <p>
            Você vê esta página como os participantes. As práticas (Termômetro,
            Carta) são preenchidas por eles no celular.
          </p>
        </div>
      </div>
    </div>
  );
}
