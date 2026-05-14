"use client";

/**
 * Formulário público de aceite de Termo de Consentimento (S2).
 *
 * Aparece embutido na página pública do termo
 * (`/p/<orgSlug>/termo/<termSlug>`) quando `allowsDigital=true`.
 *
 * Fluxo:
 *   1. Mostra campos: nome (opcional) + email + CPF (cada um opcional,
 *      mas pelo menos 1 entre email/CPF obrigatório)
 *   2. Checkbox "Li, entendi e autorizo" + botão "Aceitar"
 *   3. Ao enviar: chama POST /accept → exibe confirmação com data
 *   4. Botão "Já aceitei antes — verificar" → GET /status pra mostrar
 *      estado atual + opção de revogar
 *
 * Estado "revogado": mostra alerta vermelho com data de revogação +
 * botão "Aceitar de novo" (cria novo ConsentRecord).
 *
 * Sem dependência de auth. Não envia cookies. Tudo gravado server-side
 * via IP/UA do header do request.
 */

import { useState } from "react";

type Status = "idle" | "checking" | "submitting" | "accepted" | "revoked" | "error";

interface Props {
  orgSlug: string;
  termSlug: string;
  /** Pra display "você está aceitando o termo X". */
  termTitle: string;
}

export default function ConsentAcceptForm({
  orgSlug,
  termSlug,
  termTitle,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [revokedAt, setRevokedAt] = useState<string | null>(null);

  const apiBase = `/api/p/consent/${orgSlug}/${termSlug}`;

  function maskCpfDisplay(raw: string): string {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) {
      setError("Marque a caixa de autorização antes de continuar.");
      return;
    }
    if (!email.trim() && !cpf.trim()) {
      setError("Informe seu email ou seu CPF pra identificarmos o aceite.");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch(`${apiBase}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titularName: name.trim() || null,
          titularEmail: email.trim() || null,
          titularCpf: cpf.replace(/\D/g, "") || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Não conseguimos registrar seu aceite.");
        setStatus("error");
        return;
      }
      setAcceptedAt(json.acceptedAt);
      setRevokedAt(null);
      setStatus("accepted");
      setResultMessage(
        json.reused
          ? "Você já tinha aceitado este termo antes — registro mantido."
          : "Aceite registrado com sucesso.",
      );
    } catch (e: any) {
      setError(e?.message ?? "Erro de rede — tente de novo.");
      setStatus("error");
    }
  }

  async function handleCheck() {
    setError(null);
    if (!email.trim() && !cpf.trim()) {
      setError("Informe email ou CPF pra verificar.");
      return;
    }
    setStatus("checking");
    try {
      const params = new URLSearchParams();
      if (email.trim()) params.set("email", email.trim());
      if (cpf.trim()) params.set("cpf", cpf.replace(/\D/g, ""));
      const res = await fetch(`${apiBase}/status?${params}`);
      const json = await res.json();
      if (json.status === "accepted") {
        setAcceptedAt(json.acceptedAt);
        setRevokedAt(null);
        setStatus("accepted");
        setResultMessage("Encontramos seu aceite ativo:");
      } else if (json.status === "revoked") {
        setAcceptedAt(json.acceptedAt);
        setRevokedAt(json.revokedAt);
        setStatus("revoked");
        setResultMessage("Seu consentimento foi revogado:");
      } else {
        setStatus("idle");
        setError("Não encontramos aceite pra este identificador.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Erro de rede");
      setStatus("error");
    }
  }

  async function handleRevoke() {
    if (
      !confirm(
        "Tem certeza que quer revogar seu consentimento? Vamos parar de usar seus dados pra este serviço.",
      )
    ) {
      return;
    }
    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch(`${apiBase}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titularEmail: email.trim() || null,
          titularCpf: cpf.replace(/\D/g, "") || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Não conseguimos registrar a revogação.");
        setStatus("error");
        return;
      }
      setRevokedAt(json.revokedAt);
      setStatus("revoked");
      setResultMessage(
        json.alreadyRevoked
          ? "Seu consentimento já estava revogado."
          : "Consentimento revogado. Em até 30 dias seus dados deixarão de ser tratados.",
      );
    } catch (e: any) {
      setError(e?.message ?? "Erro de rede");
      setStatus("error");
    }
  }

  function resetForReAccept() {
    setStatus("idle");
    setAgreed(false);
    setResultMessage(null);
  }

  // ============================================================
  // Render
  // ============================================================

  // Estado: ACEITO
  if (status === "accepted" && acceptedAt) {
    return (
      <div className="my-8 rounded-lg border border-emerald-300 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-900 text-lg mb-1">
              {resultMessage ?? "Aceite registrado"}
            </h3>
            <p className="text-sm text-emerald-800 mb-3">
              Termo: <strong>{termTitle}</strong>
              <br />
              Data do aceite: <strong>{new Date(acceptedAt).toLocaleString("pt-BR")}</strong>
            </p>
            <p className="text-xs text-emerald-700 mb-4">
              Guardamos um registro com IP, navegador e versão do termo que você viu — pra
              comprovar este aceite em eventual auditoria. Você pode revogar a qualquer momento,
              sem custo, sem precisar justificar.
            </p>
            <button
              type="button"
              onClick={handleRevoke}
              className="text-sm px-4 py-2 rounded border border-emerald-400 bg-white text-emerald-800 hover:bg-emerald-100"
            >
              Revogar este consentimento
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado: REVOGADO
  if (status === "revoked" && revokedAt) {
    return (
      <div className="my-8 rounded-lg border border-amber-300 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🛑</span>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 text-lg mb-1">
              {resultMessage ?? "Consentimento revogado"}
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              Você revogou em <strong>{new Date(revokedAt).toLocaleString("pt-BR")}</strong>.
              {acceptedAt && (
                <>
                  <br />
                  Aceite original: {new Date(acceptedAt).toLocaleString("pt-BR")}.
                </>
              )}
            </p>
            <p className="text-xs text-amber-700 mb-4">
              Se quiser autorizar novamente, marque a caixa abaixo e clique em "Aceitar".
            </p>
            <button
              type="button"
              onClick={resetForReAccept}
              className="text-sm px-4 py-2 rounded border border-amber-400 bg-white text-amber-800 hover:bg-amber-100"
            >
              Aceitar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado: IDLE / SUBMITTING / CHECKING / ERROR — formulário ativo
  return (
    <div className="my-8 rounded-lg border-2 border-violet-300 bg-violet-50 p-6">
      <h3 className="font-bold text-violet-900 text-xl mb-1">📝 Aceitar este termo</h3>
      <p className="text-sm text-violet-800 mb-5">
        Após preencher os campos abaixo e marcar a caixa de autorização, vamos guardar seu
        aceite com a data, hora, IP e versão exata do texto que você está lendo.
      </p>

      <form onSubmit={handleAccept} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Seu nome <span className="text-xs text-gray-500">(opcional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você gostaria de ser chamado"
            maxLength={200}
            className="w-full text-sm p-2 border border-gray-300 rounded bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              E-mail <span className="text-xs text-gray-500">(ou use CPF →)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              maxLength={254}
              className="w-full text-sm p-2 border border-gray-300 rounded bg-white"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              CPF <span className="text-xs text-gray-500">(ou use e-mail ←)</span>
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(maskCpfDisplay(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full text-sm p-2 border border-gray-300 rounded bg-white"
              inputMode="numeric"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 pt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-400"
          />
          <span className="text-sm text-gray-800">
            <strong>Eu li, entendi e autorizo</strong> o tratamento dos meus dados pessoais nas
            condições descritas neste termo.
          </span>
        </label>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            ⚠ {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="submit"
            disabled={status === "submitting" || !agreed}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm"
          >
            {status === "submitting" ? "Registrando..." : "Aceitar"}
          </button>
          <button
            type="button"
            onClick={handleCheck}
            disabled={status === "checking"}
            className="text-sm px-4 py-2.5 rounded border border-violet-300 bg-white text-violet-700 hover:bg-violet-100"
          >
            {status === "checking" ? "Verificando..." : "Já aceitei antes — verificar"}
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-600 mt-4">
        Você pode revogar este consentimento a qualquer momento, sem precisar justificar, sem
        custo, voltando nesta página e clicando em "Já aceitei antes — verificar".
      </p>
    </div>
  );
}
