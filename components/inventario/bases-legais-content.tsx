"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Scale,
  ScrollText,
  Shield,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { inventoryStatusLabel, inventoryStatusColor } from "@/lib/auth-helpers";
import { cn } from "@/lib/utils";
import LiaInventoryBanner from "@/components/lia/lia-inventory-banner";

interface Props {
  id: string;
  session: any;
}

interface InventoryWithBasesLegais {
  id: string;
  serviceName: string;
  status: string;
  setor: string | null;
  previsaoLegal: string | null;
  legalBasis: string;
  legalBasisSensitive: string | null;
  legalBasisComments: string | null;
  legalReviewedAt: string | null;
  createdBy: { name: string | null; email: string; setor: string | null } | null;
  legalReviewedBy: { name: string | null; email: string } | null;
}

/**
 * Bases Legais sugeridas pela LGPD pra dados pessoais comuns.
 * Coloco como hint pro DPO escolher mais rápido.
 */
const BASES_COMUNS = [
  "Consentimento (Art. 7º, I)",
  "Cumprimento de obrigação legal/regulatória (Art. 7º, II)",
  "Execução de políticas públicas (Art. 7º, III)",
  "Estudos por órgão de pesquisa (Art. 7º, IV)",
  "Execução de contrato (Art. 7º, V)",
  "Procedimentos preliminares ao contrato (Art. 7º, V)",
  "Exercício regular de direitos em processo (Art. 7º, VI)",
  "Proteção da vida ou incolumidade física (Art. 7º, VII)",
  "Tutela da saúde (Art. 7º, VIII)",
  "Legítimo interesse (Art. 7º, IX)",
  "Proteção do crédito (Art. 7º, X)",
];

const BASES_SENSIVEIS = [
  "Consentimento específico (Art. 11, I)",
  "Cumprimento de obrigação legal (Art. 11, II, a)",
  "Tratamento por administração pública (Art. 11, II, b)",
  "Estudos por órgão de pesquisa (Art. 11, II, c)",
  "Exercício regular de direitos (Art. 11, II, d)",
  "Proteção da vida (Art. 11, II, e)",
  "Tutela da saúde (Art. 11, II, f)",
  "Garantia da prevenção à fraude (Art. 11, II, g)",
];

export default function BasesLegaisContent({ id, session }: Props) {
  const router = useRouter();
  const [data, setData] = useState<InventoryWithBasesLegais | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [previsaoLegal, setPrevisaoLegal] = useState("");
  const [legalBasis, setLegalBasis] = useState("");
  const [legalBasisSensitive, setLegalBasisSensitive] = useState("");
  const [legalBasisComments, setLegalBasisComments] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/inventario/${id}/bases-legais`);
        if (!r.ok) {
          const err = await r.json();
          toast.error(err.error ?? "Erro ao carregar processo");
          router.push("/dashboard/inventario");
          return;
        }
        const inv = await r.json();
        setData(inv);
        setPrevisaoLegal(inv.previsaoLegal ?? "");
        // Não pré-preenche se for placeholder do mapeamento
        const lb = inv.legalBasis === "[Em preenchimento]" ? "" : inv.legalBasis;
        setLegalBasis(lb ?? "");
        setLegalBasisSensitive(inv.legalBasisSensitive ?? "");
        setLegalBasisComments(inv.legalBasisComments ?? "");
      } catch {
        toast.error("Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`/api/inventario/${id}/bases-legais`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previsaoLegal,
          legalBasis,
          legalBasisSensitive,
          legalBasisComments,
        }),
      });
      const updated = await r.json();
      if (!r.ok) {
        toast.error(updated.error ?? "Erro ao salvar");
        return;
      }
      toast.success("Bases Legais salvas!");
      setData((d) => (d ? { ...d, ...updated } : d));
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Carregando...</div>
    );
  }
  if (!data) return null;

  const statusColor = inventoryStatusColor(data.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/dashboard/inventario">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar pra listagem
          </Link>
        </Button>
        <div className="flex items-start gap-3 flex-wrap">
          <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2.5 mt-1">
            <Scale className="h-7 w-7 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bases Legais
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complemente as bases legais aplicáveis ao processo de
              tratamento. Esse preenchimento é responsabilidade do
              DPO/jurídico — o contribuidor não tem acesso a essa tela.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(statusColor.bg, statusColor.text, statusColor.border)}
          >
            {inventoryStatusLabel(data.status)}
          </Badge>
        </div>
      </div>

      {/* Card de contexto do processo */}
      <Card className="bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800">
        <CardContent className="p-4 space-y-1 text-sm">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            Processo:{" "}
            <span className="font-normal">
              {data.serviceName === "[Em preenchimento]"
                ? "Sem nome ainda"
                : data.serviceName}
            </span>
          </p>
          {data.setor && (
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Setor:</span> {data.setor}
            </p>
          )}
          {data.createdBy && (
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Criado por:</span>{" "}
              {data.createdBy.name ?? data.createdBy.email}
            </p>
          )}
          {data.legalReviewedAt && data.legalReviewedBy && (
            <p className="text-emerald-700 dark:text-emerald-300 mt-2 inline-flex items-center gap-1 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Última atualização das Bases Legais por{" "}
              {data.legalReviewedBy.name ?? data.legalReviewedBy.email} em{" "}
              {new Date(data.legalReviewedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Banner LIA — aparece quando base usa Art. 7º IX (CP21 Fatia 3).
          Reage a `legalBasis` em tempo real conforme o DPO digita. */}
      <LiaInventoryBanner
        inventoryId={data.id}
        inventoryName={data.serviceName}
        legalBasis={legalBasis || data.legalBasis}
        legalBasisSensitive={legalBasisSensitive || data.legalBasisSensitive}
      />

      {/* Formulário */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Previsão Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Previsão Legal
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lei, decreto, instrução normativa ou regulamento que{" "}
              <strong>obriga</strong> o tratamento dos dados. Se não houver
              previsão legal específica, deixe em branco.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={previsaoLegal}
              onChange={(e) => setPrevisaoLegal(e.target.value)}
              placeholder="Ex: Lei 8.112/90 (regime jurídico dos servidores), CLT Art. 2º, ou Decreto Municipal nº..."
              rows={3}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* Base Legal — Dados Comuns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Base Legal — Dados Pessoais Comuns
              <span className="text-xs font-normal text-gray-500">
                (Art. 7º LGPD)
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hipótese legal que <strong>autoriza</strong> o tratamento dos
              dados pessoais comuns. Escolha 1 das hipóteses do Art. 7º.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value)}
              placeholder="Ex: Execução de contrato (Art. 7º, V)"
              disabled={saving}
            />
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                Ver as 10 bases legais do Art. 7º
              </summary>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                {BASES_COMUNS.map((b) => (
                  <li
                    key={b}
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => setLegalBasis(b)}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </details>
          </CardContent>
        </Card>

        {/* Base Legal — Dados Sensíveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Base Legal — Dados Pessoais Sensíveis
              <span className="text-xs font-normal text-gray-500">
                (Art. 11 LGPD)
              </span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aplicável só se o processo trata dados sensíveis (saúde,
              biometria, racial, etc.). Se não há sensíveis, pode deixar
              vazio ou marcar "N/A".
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={legalBasisSensitive}
              onChange={(e) => setLegalBasisSensitive(e.target.value)}
              placeholder="Ex: Cumprimento de obrigação legal (Art. 11, II, a)"
              disabled={saving}
            />
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">
                Ver as bases legais do Art. 11
              </summary>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                {BASES_SENSIVEIS.map((b) => (
                  <li
                    key={b}
                    className="cursor-pointer hover:text-blue-600"
                    onClick={() => setLegalBasisSensitive(b)}
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </details>
          </CardContent>
        </Card>

        {/* Comentários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Comentários sobre as Bases Legais
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Justificativa, alternativas consideradas, ações pendentes
              (ex: revisão de termo de consentimento, elaboração de LIA pra
              legítimo interesse, etc.).
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={legalBasisComments}
              onChange={(e) => setLegalBasisComments(e.target.value)}
              placeholder="Ex: Embora a base escolhida seja Execução de Contrato, durante a manutenção dos dados após o término aplicar-se-á Cumprimento de Obrigação Legal (Art. 7º, II) — Art. 12 da CLT exige guarda por 5 anos."
              rows={5}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 -mx-2 px-2 py-3 rounded-t-lg shadow-lg">
          <Button asChild variant="outline">
            <Link href="/dashboard/inventario">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={saving} className="shadow-md">
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Salvando..." : "Salvar Bases Legais"}
          </Button>
        </div>
      </form>
    </div>
  );
}
