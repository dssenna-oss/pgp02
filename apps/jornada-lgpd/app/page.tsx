// Landing pública — o que é a Jornada, em 30 segundos.

import Link from "next/link";
import { FileText, MapPinned, Download, Mail, MessageCircle } from "lucide-react";

// Pra quem quer habilitar a instituição: os dois canais do Clube.
// (o e-mail é o mesmo remetente dos convites; o zap abre com a mensagem já digitada)
const EMAIL_CONTATO = "contato@clubedoservidor.com.br";
const ASSUNTO_CONTATO = "Quero a Jornada LGPD para minha instituição";
const WHATSAPP_CONTATO = "5527992855325"; // +55 27 99285-5325

const LINK_EMAIL = `mailto:${EMAIL_CONTATO}?subject=${encodeURIComponent(ASSUNTO_CONTATO)}`;
const LINK_WHATSAPP = `https://wa.me/${WHATSAPP_CONTATO}?text=${encodeURIComponent(
  `Olá! ${ASSUNTO_CONTATO}.`,
)}`;

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
      <p className="mt-3 text-xs leading-relaxed text-gray-500">
        Falando honestamente: os documentos formais (ato, portaria, políticas, avisos) saem
        preenchidos; as fichas de trabalho saem estruturadas, prontas pra usar no dia a dia do
        mapeamento.
      </p>

      <Link
        href="/entrar"
        className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-base font-bold text-white shadow hover:bg-teal-800"
      >
        Entrar na Jornada →
      </Link>
      <p className="mt-2 text-xs text-gray-500">Já recebeu o convite? É só entrar.</p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-gray-900">
          Quero a Jornada pra minha instituição
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Fale com o Clube do Servidor por um destes canais — a gente habilita seu acesso.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <a
            href={LINK_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href={LINK_EMAIL}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-teal-700 px-5 py-2.5 text-sm font-bold text-teal-800 hover:bg-teal-50"
          >
            <Mail className="h-4 w-4" /> E-mail
          </a>
        </div>
      </div>
    </div>
  );
}
