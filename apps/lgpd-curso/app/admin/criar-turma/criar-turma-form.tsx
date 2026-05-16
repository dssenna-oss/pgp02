"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

type Login = { grupo: number; orgao: string; papel: string; nome: string; email: string };
type Resultado = { turma: any; logins: Login[]; senhaPadrao: string } | null;

export function CriarTurmaForm() {
  const router = useRouter();
  const [nome, setNome] = useState(() => {
    const d = new Date();
    const mes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][d.getMonth()];
    return `${mes}-${d.getFullYear()}`;
  });
  const [cidade, setCidade] = useState("Vegas");
  const [qtdPM, setQtdPM] = useState(2);
  const [qtdCM, setQtdCM] = useState(2);
  const [senhaPadrao, setSenhaPadrao] = useState("Curso2026!");
  const [resultado, setResultado] = useState<Resultado>(null);
  const [pending, startTransition] = useTransition();

  const totalLogins = (qtdPM + qtdCM) * 5;

  async function criar() {
    if (!nome.trim()) { toast.error("Dê um nome à turma"); return; }
    if (qtdPM + qtdCM === 0) { toast.error("Pelo menos 1 grupo"); return; }

    startTransition(async () => {
      try {
        const res = await fetch("/api/curso/criar-turma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, cidade, qtdPM, qtdCM, senhaPadrao }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Erro"); return; }
        toast.success(`Turma "${data.turma.nome}" criada · ${data.turma.totalLogins} logins`);
        setResultado(data);
        router.refresh();
      } catch (e: any) {
        toast.error(e.message || "Erro de rede");
      }
    });
  }

  function baixarCartoes() {
    if (!resultado) return;
    const url = `/api/curso/cartoes-login.pdf?turmaId=${resultado.turma.id}`;
    window.open(url, "_blank");
  }

  return (
    <div className="border rounded-lg bg-white p-5 space-y-4">
      {/* Identificação */}
      <div>
        <h3 className="text-sm font-semibold mb-3">1. Identificação da turma</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Nome da turma</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Outubro-2026" />
          </div>
          <div>
            <Label>Cidade fictícia</Label>
            <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Vegas" />
          </div>
        </div>
      </div>

      {/* Quantidade de grupos */}
      <div>
        <h3 className="text-sm font-semibold mb-3">2. Quantidade de grupos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ContadorGrupo
            label="Prefeitura (PM)"
            cor="bg-emerald-50 border-emerald-200 text-emerald-900"
            corBadge="bg-emerald-100 text-emerald-700"
            value={qtdPM}
            onChange={setQtdPM}
            descricao="DPO + Saúde + RH + TI + Comunicação"
          />
          <ContadorGrupo
            label="Câmara (CM)"
            cor="bg-blue-50 border-blue-200 text-blue-900"
            corBadge="bg-blue-100 text-blue-700"
            value={qtdCM}
            onChange={setQtdCM}
            descricao="DPO + Cerimonial + Ouvidoria + TI + Procuradoria"
          />
        </div>
        <div className="mt-3 text-xs text-gray-600 text-center bg-gray-50 border rounded py-2">
          <Badge variant="primary">{qtdPM + qtdCM} grupos</Badge>
          {" · "}
          <Badge variant="primary">{totalLogins} logins</Badge>
          {" · "}
          <Badge variant="primary">{(qtdPM + qtdCM) * 2} processos pré-cadastrados</Badge>
        </div>
      </div>

      {/* Senha padrão */}
      <div>
        <h3 className="text-sm font-semibold mb-3">3. Senha padrão dos logins</h3>
        <Input
          value={senhaPadrao}
          onChange={(e) => setSenhaPadrao(e.target.value)}
          placeholder="Curso2026!"
        />
        <p className="text-[11px] text-gray-500 mt-1">Mesma senha pra todos os logins do curso. Será impressa nos cartões.</p>
      </div>

      {/* Preview dos logins */}
      {qtdPM + qtdCM > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">4. Preview dos primeiros logins gerados</h3>
          <div className="bg-gray-900 text-emerald-300 p-3 rounded font-mono text-[11px] overflow-x-auto">
            {gerarPreview(qtdPM, qtdCM).map((l, i) => (
              <div key={i}>{l}</div>
            ))}
            {qtdPM + qtdCM > 1 && <div className="text-gray-500 mt-1">  ...e mais {totalLogins - 5} logins</div>}
          </div>
        </div>
      )}

      {/* Ação */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button onClick={criar} disabled={pending} size="lg">
          {pending ? "Criando..." : "Criar turma + gerar materiais →"}
        </Button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="mt-4 border border-emerald-300 bg-emerald-50 rounded-lg p-4">
          <div className="text-sm text-emerald-900 font-semibold mb-2">
            ✓ Turma "{resultado.turma.nome}" criada
          </div>
          <div className="text-xs text-emerald-900 mb-3">
            {resultado.turma.totalGrupos} grupos · {resultado.turma.totalLogins} logins · 2 processos por grupo
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="primary" onClick={baixarCartoes}>
              <Printer className="h-4 w-4" /> Baixar cartões de login (PDF)
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/facilitador">
                Abrir painel do facilitador →
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContadorGrupo({
  label, cor, corBadge, value, onChange, descricao,
}: { label: string; cor: string; corBadge: string; value: number; onChange: (v: number) => void; descricao: string }) {
  return (
    <div className={`border rounded-lg p-3 ${cor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{label}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, value - 1))}
            className="h-7 w-7 flex items-center justify-center rounded bg-white border hover:bg-gray-50"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className={`min-w-[2rem] text-center font-bold text-lg px-2 rounded ${corBadge}`}>{value}</span>
          <button
            type="button"
            onClick={() => onChange(Math.min(5, value + 1))}
            className="h-7 w-7 flex items-center justify-center rounded bg-white border hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-xs">{descricao}</p>
      <p className="text-[10px] mt-1 opacity-70">{value * 5} logins · {value * 2} processos</p>
    </div>
  );
}

function gerarPreview(qtdPM: number, qtdCM: number): string[] {
  const lines: string[] = [];
  let g = 0;
  if (qtdPM > 0) {
    g = 1;
    lines.push(`  dpo.g${g}@curso.lgpd            (DPO · Grupo ${g} · PM)`);
    lines.push(`  saude.g${g}@curso.lgpd          (Saúde · Grupo ${g} · PM)`);
    lines.push(`  rh.g${g}@curso.lgpd             (RH · Grupo ${g} · PM)`);
  }
  if (qtdCM > 0) {
    const gc = qtdPM + 1;
    lines.push(`  dpo.g${gc}@curso.lgpd            (DPO · Grupo ${gc} · CM)`);
    lines.push(`  cerimonial.g${gc}@curso.lgpd     (Cerimonial · Grupo ${gc} · CM)`);
  }
  return lines;
}
