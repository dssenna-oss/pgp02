/**
 * Formulário público de Requisição de Direitos do Titular — em camadas.
 *
 * Estrutura em 5 passos pra reduzir carga cognitiva (princípio "layered notices"
 * recomendado pela ICO/UK GDPR e citado no artigo principal):
 *   1. Identificação do titular
 *   2. Representante legal (opcional, condicional)
 *   3. Direitos a exercer + detalhamento
 *   4. Canal de resposta + anexos (B1)
 *   5. Aceite da declaração + revisão final
 *
 * Submissão: POST /api/direitos-titulares → redireciona pra /sucesso
 * com o protocolo gerado.
 */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Upload, X } from "lucide-react";
import {
  DSR_RIGHTS,
  DSR_RIGHT_CODES,
  DSR_TITULAR_CATEGORIES,
  DSR_TITULAR_CATEGORY_LABELS,
  DSR_RESPONSE_CHANNELS,
  DSR_RESPONSE_CHANNEL_LABELS,
  type DsrRightCode,
  type DsrTitularCategory,
  type DsrResponseChannel,
} from "@/lib/data-subject-requests";

type FormState = {
  // Step 1
  titularName: string;
  titularCpf: string;
  titularDocType: string;
  titularDocNumber: string;
  titularBirthDate: string;
  titularPhone: string;
  titularEmail: string;
  titularAddress: string;
  titularCategory: DsrTitularCategory;
  titularCategoryOther: string;
  // Step 2
  hasRepresentative: boolean;
  representativeName: string;
  representativeCpf: string;
  representativeType: string;
  representativeTypeOther: string;
  representativeEmail: string;
  representativePhone: string;
  // Step 3
  requestedRights: DsrRightCode[];
  detailedRequest: string;
  // Step 4
  responseChannel: DsrResponseChannel;
  responseChannelOther: string;
  identityDocUrl: string;
  identityDocName: string;
  representationDocUrl: string;
  representationDocName: string;
  // Step 5
  authenticityAccepted: boolean;
};

const INITIAL: FormState = {
  titularName: "",
  titularCpf: "",
  titularDocType: "",
  titularDocNumber: "",
  titularBirthDate: "",
  titularPhone: "",
  titularEmail: "",
  titularAddress: "",
  titularCategory: "cidadao",
  titularCategoryOther: "",
  hasRepresentative: false,
  representativeName: "",
  representativeCpf: "",
  representativeType: "",
  representativeTypeOther: "",
  representativeEmail: "",
  representativePhone: "",
  requestedRights: [],
  detailedRequest: "",
  responseChannel: "email",
  responseChannelOther: "",
  identityDocUrl: "",
  identityDocName: "",
  representationDocUrl: "",
  representationDocName: "",
  authenticityAccepted: false,
};

const STEP_LABELS = [
  "Identificação",
  "Representante",
  "Direitos",
  "Anexos e canal",
  "Revisão e envio",
];
const TOTAL_STEPS = STEP_LABELS.length;

export function DsrPublicForm({
  company,
}: {
  company: { id: string; displayName: string; dpoEmail?: string | null };
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<
    "identity" | "representation" | null
  >(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const progressPct = useMemo(
    () => Math.round((step / TOTAL_STEPS) * 100),
    [step],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStepError(null);
  }

  function toggleRight(code: DsrRightCode) {
    setForm((prev) => ({
      ...prev,
      requestedRights: prev.requestedRights.includes(code)
        ? prev.requestedRights.filter((c) => c !== code)
        : [...prev.requestedRights, code],
    }));
    setStepError(null);
  }

  // ---------- validação por passo ----------
  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.titularName.trim() || form.titularName.trim().length < 3)
        return "Informe o nome completo do titular (mín. 3 caracteres).";
      if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(form.titularCpf.trim()))
        return "CPF inválido. Use o formato 000.000.000-00.";
      if (form.titularPhone.trim().length < 8)
        return "Informe um telefone de contato válido.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.titularEmail.trim()))
        return "Informe um e-mail de contato válido.";
      if (form.titularCategory === "outro" && !form.titularCategoryOther.trim())
        return "Especifique a categoria do titular.";
    }
    if (s === 2 && form.hasRepresentative) {
      if (!form.representativeName.trim())
        return "Informe o nome do representante.";
      if (!/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(form.representativeCpf.trim()))
        return "CPF do representante inválido.";
      if (!form.representativeType.trim())
        return "Selecione o tipo de representação.";
    }
    if (s === 3) {
      if (form.requestedRights.length === 0)
        return "Selecione pelo menos um direito a exercer.";
      if (form.detailedRequest.trim().length < 10)
        return "Descreva seu pedido com no mínimo 10 caracteres.";
    }
    if (s === 4) {
      if (!form.identityDocUrl)
        return "É obrigatório anexar um documento oficial de identidade.";
      if (form.hasRepresentative && !form.representationDocUrl)
        return "É obrigatório anexar a procuração / documento de representação.";
      if (form.responseChannel === "outro" && !form.responseChannelOther.trim())
        return "Especifique o canal preferido.";
    }
    if (s === 5) {
      if (!form.authenticityAccepted)
        return "Você precisa aceitar a declaração de autenticidade.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- upload ----------
  async function handleUpload(
    file: File,
    kind: "identity" | "representation",
  ) {
    try {
      setUploadingKind(kind);
      const data = new FormData();
      data.append("file", file);
      data.append("companyId", company.id);
      data.append("kind", kind);

      const res = await fetch("/api/direitos-titulares/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Falha no upload do arquivo.");
        return;
      }
      if (kind === "identity") {
        set("identityDocUrl", json.url);
        set("identityDocName", json.name);
      } else {
        set("representationDocUrl", json.url);
        set("representationDocName", json.name);
      }
      toast.success("Arquivo enviado.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar arquivo.");
    } finally {
      setUploadingKind(null);
    }
  }

  // ---------- submit ----------
  async function handleSubmit() {
    const err = validateStep(5);
    if (err) {
      setStepError(err);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        companyId: company.id,
        titularName: form.titularName,
        titularCpf: form.titularCpf,
        titularDocType: form.titularDocType || undefined,
        titularDocNumber: form.titularDocNumber || undefined,
        titularBirthDate: form.titularBirthDate || null,
        titularPhone: form.titularPhone,
        titularEmail: form.titularEmail,
        titularAddress: form.titularAddress || undefined,
        titularCategory: form.titularCategory,
        titularCategoryOther: form.titularCategoryOther || undefined,
        hasRepresentative: form.hasRepresentative,
        representativeName: form.hasRepresentative
          ? form.representativeName
          : undefined,
        representativeCpf: form.hasRepresentative
          ? form.representativeCpf
          : undefined,
        representativeType: form.hasRepresentative
          ? form.representativeType
          : undefined,
        representativeTypeOther: form.hasRepresentative
          ? form.representativeTypeOther
          : undefined,
        representativeEmail: form.hasRepresentative
          ? form.representativeEmail
          : undefined,
        representativePhone: form.hasRepresentative
          ? form.representativePhone
          : undefined,
        requestedRights: form.requestedRights,
        detailedRequest: form.detailedRequest,
        responseChannel: form.responseChannel,
        responseChannelOther:
          form.responseChannel === "outro"
            ? form.responseChannelOther
            : undefined,
        identityDocUrl: form.identityDocUrl,
        representationDocUrl: form.hasRepresentative
          ? form.representationDocUrl
          : undefined,
        authenticityAccepted: form.authenticityAccepted,
      };

      const res = await fetch("/api/direitos-titulares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.validation) {
          const first = json.validation[0];
          setStepError(`${first.field}: ${first.message}`);
        } else {
          setStepError(json.error || "Erro ao registrar requisição.");
        }
        toast.error(json.error || "Erro ao enviar.");
        return;
      }
      // Sucesso → redirecionar pra tela de protocolo
      router.push(
        `/direitos-titulares/${company.id}/sucesso?protocolo=${encodeURIComponent(
          json.request.protocolNumber,
        )}&email=${encodeURIComponent(form.titularEmail)}`,
      );
    } catch (e) {
      console.error(e);
      setStepError("Erro de rede ao enviar a requisição.");
      toast.error("Erro ao enviar a requisição.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- render ----------
  return (
    <Card className="overflow-hidden">
      {/* progresso */}
      <div className="border-b bg-slate-50 px-5 py-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">
            Passo {step} de {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
          </span>
          <span className="text-slate-500">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {stepError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{stepError}</AlertDescription>
          </Alert>
        )}

        {/* ============ STEP 1 — IDENTIFICAÇÃO ============ */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              1. Identificação do titular
            </h2>
            <p className="text-sm text-slate-600">
              Preencha seus dados para que possamos validar sua identidade e
              localizar suas informações.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nome completo *"
                value={form.titularName}
                onChange={(v) => set("titularName", v)}
              />
              <Field
                label="CPF *"
                placeholder="000.000.000-00"
                value={form.titularCpf}
                onChange={(v) => set("titularCpf", v)}
              />
              <Field
                label="Tipo de documento (RG, CNH, etc.)"
                value={form.titularDocType}
                onChange={(v) => set("titularDocType", v)}
              />
              <Field
                label="Número do documento"
                value={form.titularDocNumber}
                onChange={(v) => set("titularDocNumber", v)}
              />
              <Field
                label="Data de nascimento"
                type="date"
                value={form.titularBirthDate}
                onChange={(v) => set("titularBirthDate", v)}
              />
              <Field
                label="Telefone *"
                placeholder="(00) 00000-0000"
                value={form.titularPhone}
                onChange={(v) => set("titularPhone", v)}
              />
              <Field
                label="E-mail *"
                type="email"
                value={form.titularEmail}
                onChange={(v) => set("titularEmail", v)}
                className="sm:col-span-2"
              />
              <Field
                label="Endereço completo"
                value={form.titularAddress}
                onChange={(v) => set("titularAddress", v)}
                className="sm:col-span-2"
              />
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">
                Categoria do titular junto à instituição *
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {DSR_TITULAR_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={form.titularCategory === cat}
                      onChange={() => set("titularCategory", cat)}
                    />
                    <span className="text-sm">
                      {DSR_TITULAR_CATEGORY_LABELS[cat]}
                    </span>
                  </label>
                ))}
              </div>
              {form.titularCategory === "outro" && (
                <Field
                  label="Especifique"
                  value={form.titularCategoryOther}
                  onChange={(v) => set("titularCategoryOther", v)}
                  className="mt-3"
                />
              )}
            </div>
          </div>
        )}

        {/* ============ STEP 2 — REPRESENTANTE ============ */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">2. Representante legal</h2>
            <p className="text-sm text-slate-600">
              Esta seção é opcional. Preencha apenas se o titular estiver sendo
              representado.
            </p>

            <label className="flex cursor-pointer items-center gap-3 rounded-md border bg-slate-50 px-4 py-3">
              <Checkbox
                checked={form.hasRepresentative}
                onCheckedChange={(v) => set("hasRepresentative", !!v)}
              />
              <span className="text-sm">
                O titular está sendo representado por outra pessoa.
              </span>
            </label>

            {form.hasRepresentative && (
              <div className="space-y-4 rounded-md border border-slate-200 p-4">
                <p className="text-xs text-slate-500">
                  A procuração (ou documento de tutela/curatela/representação
                  legal) será anexada no passo 4.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Nome completo do representante *"
                    value={form.representativeName}
                    onChange={(v) => set("representativeName", v)}
                    className="sm:col-span-2"
                  />
                  <Field
                    label="CPF do representante *"
                    placeholder="000.000.000-00"
                    value={form.representativeCpf}
                    onChange={(v) => set("representativeCpf", v)}
                  />
                  <Field
                    label="E-mail"
                    type="email"
                    value={form.representativeEmail}
                    onChange={(v) => set("representativeEmail", v)}
                  />
                  <Field
                    label="Telefone"
                    value={form.representativePhone}
                    onChange={(v) => set("representativePhone", v)}
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Tipo de representação *
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { v: "legal", l: "Representante legal (pai, mãe, tutor, curador)" },
                      { v: "procurador", l: "Procurador com poderes específicos" },
                      { v: "outro", l: "Outro" },
                    ].map((opt) => (
                      <label
                        key={opt.v}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name="reptype"
                          checked={form.representativeType === opt.v}
                          onChange={() => set("representativeType", opt.v)}
                        />
                        <span className="text-sm">{opt.l}</span>
                      </label>
                    ))}
                  </div>
                  {form.representativeType === "outro" && (
                    <Field
                      label="Especifique"
                      value={form.representativeTypeOther}
                      onChange={(v) => set("representativeTypeOther", v)}
                      className="mt-3"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ STEP 3 — DIREITOS + DETALHAMENTO ============ */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              3. Direitos a exercer e detalhamento
            </h2>
            <p className="text-sm text-slate-600">
              Marque um ou mais direitos. O detalhamento do pedido é
              obrigatório.
            </p>

            <div className="space-y-2">
              {DSR_RIGHT_CODES.map((code) => {
                const checked = form.requestedRights.includes(code);
                const r = DSR_RIGHTS[code];
                return (
                  <label
                    key={code}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition ${
                      checked
                        ? "border-blue-500 bg-blue-50/60"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleRight(code)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {code}
                        </span>
                        <span className="font-medium text-sm text-slate-900">
                          {r.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({r.legal}, LGPD)
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">
                Detalhamento do pedido *
              </Label>
              <Textarea
                rows={6}
                value={form.detailedRequest}
                onChange={(e) => set("detailedRequest", e.target.value)}
                placeholder="Descreva, com o máximo de detalhes, sua requisição (períodos, datas, serviços utilizados, protocolos anteriores, etc.). Quanto mais informações, mais rápida será a resposta."
              />
              <p className="mt-1 text-xs text-slate-500">
                Mínimo 10 caracteres. {form.detailedRequest.length} caracteres
                digitados.
              </p>
            </div>
          </div>
        )}

        {/* ============ STEP 4 — ANEXOS + CANAL ============ */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                4. Anexos e canal de resposta
              </h2>
              <p className="text-sm text-slate-600">
                A identificação por documento oficial é obrigatória para
                garantir sua segurança.
              </p>
            </div>

            {/* Upload identidade */}
            <UploadField
              label="Documento oficial de identidade (RG, CNH, passaporte) *"
              hint="PDF, JPG ou PNG. Máx. 10 MB."
              uploading={uploadingKind === "identity"}
              currentName={form.identityDocName}
              currentUrl={form.identityDocUrl}
              onFile={(f) => handleUpload(f, "identity")}
              onClear={() => {
                set("identityDocUrl", "");
                set("identityDocName", "");
              }}
            />

            {/* Upload representação (se aplicável) */}
            {form.hasRepresentative && (
              <UploadField
                label="Procuração ou documento de representação *"
                hint="PDF, JPG ou PNG. Máx. 10 MB."
                uploading={uploadingKind === "representation"}
                currentName={form.representationDocName}
                currentUrl={form.representationDocUrl}
                onFile={(f) => handleUpload(f, "representation")}
                onClear={() => {
                  set("representationDocUrl", "");
                  set("representationDocName", "");
                }}
              />
            )}

            {/* Canal preferido */}
            <div>
              <Label className="mb-2 block text-sm font-medium">
                Canal preferido para receber a resposta *
              </Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {DSR_RESPONSE_CHANNELS.map((c) => (
                  <label
                    key={c}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="rchannel"
                      checked={form.responseChannel === c}
                      onChange={() => set("responseChannel", c)}
                    />
                    <span className="text-sm">
                      {DSR_RESPONSE_CHANNEL_LABELS[c]}
                    </span>
                  </label>
                ))}
              </div>
              {form.responseChannel === "outro" && (
                <Field
                  label="Especifique"
                  value={form.responseChannelOther}
                  onChange={(v) => set("responseChannelOther", v)}
                  className="mt-3"
                />
              )}
            </div>
          </div>
        )}

        {/* ============ STEP 5 — REVISÃO + ACEITE ============ */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">5. Revisão e envio</h2>
              <p className="text-sm text-slate-600">
                Revise o resumo abaixo. Em seguida, aceite a declaração de
                autenticidade para concluir.
              </p>
            </div>

            <div className="rounded-md border bg-slate-50 p-4 text-sm">
              <h3 className="font-medium">Resumo</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                <SummaryRow label="Nome" value={form.titularName} />
                <SummaryRow label="CPF" value={form.titularCpf} />
                <SummaryRow label="E-mail" value={form.titularEmail} />
                <SummaryRow label="Telefone" value={form.titularPhone} />
                <SummaryRow
                  label="Categoria"
                  value={
                    form.titularCategory === "outro"
                      ? form.titularCategoryOther
                      : DSR_TITULAR_CATEGORY_LABELS[form.titularCategory]
                  }
                />
                <SummaryRow
                  label="Representante"
                  value={
                    form.hasRepresentative
                      ? `${form.representativeName} (${form.representativeType})`
                      : "Não"
                  }
                />
                <SummaryRow
                  label="Direitos"
                  value={form.requestedRights.length + " selecionado(s)"}
                  fullRow
                />
                <SummaryRow
                  label="Canal de resposta"
                  value={
                    form.responseChannel === "outro"
                      ? form.responseChannelOther
                      : DSR_RESPONSE_CHANNEL_LABELS[form.responseChannel]
                  }
                  fullRow
                />
                <SummaryRow
                  label="Documento de identidade"
                  value={form.identityDocName || "—"}
                  fullRow
                />
                {form.hasRepresentative && (
                  <SummaryRow
                    label="Documento de representação"
                    value={form.representationDocName || "—"}
                    fullRow
                  />
                )}
              </dl>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs leading-relaxed">
                <strong>Aviso LGPD:</strong> os dados pessoais informados neste
                formulário serão tratados pela{" "}
                <strong>{company.displayName}</strong> exclusivamente para
                processar e responder a esta requisição. Base legal:
                cumprimento de obrigação legal pelo controlador (art. 7º, II e
                art. 11, II, "a" da LGPD). Os dados serão mantidos pelo prazo
                necessário ao atendimento, observando a tabela de
                temporalidade institucional.
              </AlertDescription>
            </Alert>

            <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-amber-50/60 p-4">
              <Checkbox
                checked={form.authenticityAccepted}
                onCheckedChange={(v) => set("authenticityAccepted", !!v)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">
                <strong>Declaração de autenticidade.</strong> Declaro, sob as
                penas da lei penal e sem prejuízo das sanções administrativas e
                cíveis cabíveis, que as informações aqui prestadas são
                verdadeiras e que os documentos anexados são autênticos e
                condizem com os originais.
              </span>
            </label>
          </div>
        )}

        {/* ============ NAV BUTTONS ============ */}
        <div className="flex justify-between border-t pt-5">
          <Button variant="outline" onClick={back} disabled={step === 1}>
            ← Voltar
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={next}>Avançar →</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.authenticityAccepted}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Enviar requisição
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------- componentes auxiliares ----------
function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={props.className}>
      <Label className="mb-1 block text-xs font-medium text-slate-700">
        {props.label}
      </Label>
      <Input
        type={props.type || "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  );
}

function UploadField(props: {
  label: string;
  hint: string;
  uploading: boolean;
  currentName: string;
  currentUrl: string;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <Label className="mb-1 block text-sm font-medium">{props.label}</Label>
      <p className="mb-2 text-xs text-slate-500">{props.hint}</p>
      {props.currentUrl ? (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <span className="truncate">{props.currentName}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={props.onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed bg-slate-50 px-4 py-6 hover:bg-slate-100">
          <input
            type="file"
            className="hidden"
            accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
            disabled={props.uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) props.onFile(f);
              e.target.value = "";
            }}
          />
          {props.uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Enviando…</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 text-slate-600" />
              <span className="text-sm text-slate-700">
                Clique para escolher arquivo
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  fullRow,
}: {
  label: string;
  value: string;
  fullRow?: boolean;
}) {
  return (
    <div className={fullRow ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}
