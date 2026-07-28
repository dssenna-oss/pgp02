// Landing pública — o que é a Jornada, em 30 segundos.

import Link from "next/link";
import { FileText, MapPinned, Download, Mail } from "lucide-react";

// Pra quem quer habilitar a instituição: e-mail do Clube (mesmo remetente dos convites).
const EMAIL_CONTATO = "contato@clubedoservidor.com.br";
const ASSUNTO_CONTATO = "Quero a Jornada LGPD para minha instituição";

export default function LandingPage() {
  return (
    <div className="py-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
        Implementação da LGPD sem começar do zero
      </p>
      <h1 className="mt-2 text-3xl font-extrabold leading-tight text-gray-900">
        Preencha o perfil da sua instituição <span className="text-teal-700">uma vez</span> — e
        saia com os 21 documentos prontos.
      </h1>
      <p className="mt-3 max-w-xl leading-relaxed text-gray-600">
        Ato de designação, portaria do comitê, aviso de privacidade, plano de resposta a
        incidentes e todos os demais documentos da implementação — personalizados com os dados
        da sua instituição, em Word, na ordem das 7 Fases da implementação.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icone: MapPinned, titulo: "1 · Perfil", texto: "Dados da instituição, preenchidos uma única vez." },
          { icone: FileText, titulo: "2 · Trilha", texto: "As 7 Fases mostram só os documentos de cada etapa." },
          { icone: Download, titulo: "3 · Word pronto", texto: "Cada documento sai preenchido, pronto pra baixar." },
        ].map((c) => (
          <div key={c.titulo} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <c.icone className="h-5 w-5 text-teal-700" />
            <p className="mt-2 text-sm font-bold text-gray-900">{c.titulo}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{c.texto}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/entrar"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-base font-bold text-white shadow hover:bg-teal-800"
        >
          Entrar na Jornada →
        </Link>
        <a
          href={`mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(ASSUNTO_CONTATO)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-teal-700 px-6 py-3 text-base font-bold text-teal-800 hover:bg-teal-50"
        >
          <Mail className="h-4 w-4" /> Quero pra minha instituição
        </a>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        Já recebeu o convite? É só entrar. Ainda não tem acesso? Fale com o Clube do Servidor
        pelo botão acima — a gente habilita sua instituição.
      </p>
    </div>
  );
}
