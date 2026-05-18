"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Save, UserCheck, UserPlus, Sparkles, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { saveEncarregado } from "./actions";

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  orgao: string | null;
  cidade: string | null;
  dpoName: string | null;
  dpoEmail: string | null;
  dpoTelefone: string | null;
  dpoEndereco: string | null;
  dpoSubstitutoNome: string | null;
  dpoSubstitutoEmail: string | null;
  dpoSubstitutoTelefone: string | null;
} | null;

export function EncarregadoForm({ company }: { company: Company }) {
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();

  const [dpoName, setDpoName] = useState(company?.dpoName || "");
  const [dpoEmail, setDpoEmail] = useState(company?.dpoEmail || "");
  const [dpoTelefone, setDpoTelefone] = useState(company?.dpoTelefone || "");
  const [dpoEndereco, setDpoEndereco] = useState(company?.dpoEndereco || "");
  const [subNome, setSubNome] = useState(company?.dpoSubstitutoNome || "");
  const [subEmail, setSubEmail] = useState(company?.dpoSubstitutoEmail || "");
  const [subTelefone, setSubTelefone] = useState(company?.dpoSubstitutoTelefone || "");

  function sugerirDoMeuUsuario() {
    if (session?.user?.name) setDpoName(session.user.name);
    if (session?.user?.email) setDpoEmail(session.user.email);
    toast.success("Nome e email preenchidos do seu cadastro");
  }

  function salvar() {
    startTransition(async () => {
      try {
        await saveEncarregado({
          dpoName, dpoEmail, dpoTelefone, dpoEndereco,
          dpoSubstitutoNome: subNome, dpoSubstitutoEmail: subEmail, dpoSubstitutoTelefone: subTelefone,
        });
        toast.success("Identidade do Encarregado salva — agora será reutilizada nos documentos");
      } catch (e: any) {
        toast.error(e.message || "Erro");
      }
    });
  }

  const completo = !!(dpoName.trim() && dpoEmail.trim() && dpoTelefone.trim());

  return (
    <div className="space-y-6">
      {/* Agente de tratamento (read-only, derivado da Company) */}
      <section className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          Agente de Tratamento (Controlador)
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Estes dados vêm do cadastro do grupo e são usados automaticamente nos documentos legais.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <Label className="text-[11px] text-gray-500">Nome</Label>
            <div className="font-medium text-gray-900">{company?.name || "—"}</div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">CNPJ</Label>
            <div className="font-medium text-gray-900">{company?.cnpj || "—"}</div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">Cidade</Label>
            <div className="font-medium text-gray-900">{company?.cidade || "—"}</div>
          </div>
        </div>
      </section>

      {/* Encarregado titular */}
      <section className={`border rounded-lg p-4 ${completo ? "border-emerald-300 bg-emerald-50/30" : "border-amber-300 bg-amber-50/30"}`}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-700" />
            Encarregado (DPO) — titular
          </h3>
          <Button size="sm" variant="ghost" onClick={sugerirDoMeuUsuario}>
            <Sparkles className="h-3.5 w-3.5" /> Sugerir dos meus dados
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={dpoName} onChange={(e) => setDpoName(e.target.value)} placeholder="Ex: Maria Silva Souza" />
          </div>
          <div>
            <Label>E-mail institucional *</Label>
            <Input type="email" value={dpoEmail} onChange={(e) => setDpoEmail(e.target.value)} placeholder="encarregado@orgao.gov.br" />
          </div>
          <div>
            <Label>Telefone *</Label>
            <Input value={dpoTelefone} onChange={(e) => setDpoTelefone(e.target.value)} placeholder="(00) 0000-0000" />
          </div>
          <div>
            <Label>Endereço institucional</Label>
            <Input value={dpoEndereco} onChange={(e) => setDpoEndereco(e.target.value)} placeholder="Av. exemplo, 100 — Centro" />
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mt-2">
          * Campos obrigatórios pra constar no Aviso de Privacidade público (Art. 9º, V LGPD) e no RIPD (Art. 38).
        </p>
      </section>

      {/* Encarregado substituto */}
      <section className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4 text-gray-500" />
          Encarregado Substituto
          <span className="text-[11px] text-gray-500 font-normal">(prática recomendada — Art. 41 §1º)</span>
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Quem assume em férias, afastamento ou impedimento do titular. Mantém a continuidade do canal com titulares e com a ANPD.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Nome completo</Label>
            <Input value={subNome} onChange={(e) => setSubNome(e.target.value)} placeholder="Ex: João Pereira Lima" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={subEmail} onChange={(e) => setSubEmail(e.target.value)} placeholder="substituto@orgao.gov.br" />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={subTelefone} onChange={(e) => setSubTelefone(e.target.value)} placeholder="(00) 0000-0000" />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={salvar} disabled={pending}>
          <Save className="h-4 w-4" /> {pending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
