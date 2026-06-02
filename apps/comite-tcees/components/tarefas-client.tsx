"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_ACAO, PRIORIDADE_ACAO } from "@/lib/comite-ui";
import { prazoInfo, prazoBR } from "@/lib/tarefas";
import { salvarTarefa, excluirTarefa, atualizarStatusTarefa, type TarefaInput } from "@/app/dashboard/tarefas/actions";

export type TarefaDTO = {
  id: string;
  titulo: string;
  descricao: string | null;
  responsavelId: string;
  responsavelNome: string;
  criadoPorNome: string | null;
  inventoryId: string | null;
  inventoryNome: string | null;
  inventoryStatus: string | null;
  prazoISO: string | null;
  prioridade: string;
  status: string;
};

type UsuarioOpt = { id: string; nome: string; role: string };
type ProcessoOpt = { id: string; nome: string };

const STATUS_LIST: { key: string; label: string }[] = [
  { key: "A_FAZER", label: "A fazer" },
  { key: "EM_ANDAMENTO", label: "Em andamento" },
  { key: "CONCLUIDA", label: "Concluída" },
];

export function TarefasClient({
  tarefas,
  ehEditor,
  meuId,
  usuarios,
  processos,
}: {
  tarefas: TarefaDTO[];
  ehEditor: boolean;
  meuId: string;
  usuarios: UsuarioOpt[];
  processos: ProcessoOpt[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<TarefaDTO | "novo" | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA">("todas");

  const pendentes = tarefas.filter((t) => t.status !== "CONCLUIDA");
  const atrasadas = pendentes.filter((t) => prazoInfo(t.prazoISO, t.status).atrasada).length;
  const concluidas = tarefas.filter((t) => t.status === "CONCLUIDA").length;
  const visiveis = tarefas.filter((t) => (filtro === "todas" ? true : t.status === filtro));

  async function mudarStatus(t: TarefaDTO, novo: string) {
    if (novo === t.status) return;
    const to = toast.loading("Atualizando…");
    try {
      await atualizarStatusTarefa(t.id, novo);
      toast.success("Status atualizado", { id: to });
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível atualizar", { id: to });
    }
  }

  async function excluir(t: TarefaDTO) {
    if (!confirm(`Excluir a tarefa "${t.titulo}"?`)) return;
    const to = toast.loading("Excluindo…");
    try {
      await excluirTarefa(t.id);
      toast.success("Tarefa excluída", { id: to });
      router.refresh();
    } catch {
      toast.error("Não foi possível excluir", { id: to });
    }
  }

  const kpi = (label: string, valor: number, cor: string) => (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-500 font-semibold">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={{ color: cor }}>{valor}</div>
    </div>
  );

  const chip = (k: typeof filtro, label: string) => (
    <button
      onClick={() => setFiltro(k)}
      className={`text-xs font-semibold border rounded-full px-3 py-1.5 ${
        filtro === k ? "bg-navy text-white border-navy" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="grid gap-3.5 grid-cols-3 mb-4">
        {kpi("Pendentes", pendentes.length, "#111827")}
        {kpi("Atrasadas", atrasadas, atrasadas ? "#dc2626" : "#111827")}
        {kpi("Concluídas", concluidas, "#16a34a")}
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {chip("todas", `Todas (${tarefas.length})`)}
          {chip("A_FAZER", "A fazer")}
          {chip("EM_ANDAMENTO", "Em andamento")}
          {chip("CONCLUIDA", "Concluídas")}
        </div>
        {ehEditor && (
          <button
            onClick={() => setEditando("novo")}
            className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Nova tarefa
          </button>
        )}
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {visiveis.map((t) => {
          const pr = PRIORIDADE_ACAO[t.prioridade] ?? { label: t.prioridade, variant: "gray" as const };
          const st = STATUS_ACAO[t.status] ?? { label: t.status, variant: "gray" as const };
          const prazo = prazoInfo(t.prazoISO, t.status);
          const podeMudar = ehEditor || t.responsavelId === meuId;
          return (
            <div key={t.id} className="bg-white border rounded-xl p-4 flex flex-col">
              <div className="flex justify-between gap-2 items-start">
                <div className="text-[13.5px] font-bold text-gray-900">{t.titulo}</div>
                {ehEditor && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setEditando(t)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => excluir(t)} title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant={st.variant}>{st.label}</Badge>
                <Badge variant={pr.variant}>prioridade {pr.label}</Badge>
              </div>

              {t.descricao && <div className="text-[12px] text-gray-600 mt-2 whitespace-pre-wrap">{t.descricao}</div>}

              <div className="text-[11.5px] text-gray-500 mt-2 space-y-0.5">
                {ehEditor && <div><b className="text-gray-700">Responsável:</b> {t.responsavelNome}{t.responsavelId === meuId ? " (você)" : ""}</div>}
                <div><b className="text-gray-700">Prazo:</b> {prazoBR(t.prazoISO)} <span className={prazo.cls}>· {prazo.texto}</span></div>
                {t.criadoPorNome && <div><b className="text-gray-700">Atribuída por:</b> {t.criadoPorNome}</div>}
              </div>

              {t.inventoryId && t.inventoryNome && (
                <Link
                  href={`/dashboard/inventario?abrir=${t.inventoryId}`}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-700 hover:text-brand-800 mt-2.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir o processo: {t.inventoryNome}
                </Link>
              )}

              {podeMudar && (
                <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100">
                  {STATUS_LIST.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => mudarStatus(t, s.key)}
                      className={`flex-1 text-[11.5px] font-semibold rounded-md px-2 py-1.5 border transition-colors ${
                        t.status === s.key
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {visiveis.length === 0 && (
          <div className="text-sm text-gray-500 py-6 col-span-full text-center bg-white border rounded-xl">
            {ehEditor
              ? 'Nenhuma tarefa ainda. Clique em "Nova tarefa" para atribuir o preenchimento de um processo a um membro.'
              : "Você não tem tarefas no momento."}
          </div>
        )}
      </div>

      {editando && (
        <TarefaModal
          tarefa={editando === "novo" ? null : editando}
          usuarios={usuarios}
          processos={processos}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); router.refresh(); }}
        />
      )}
    </>
  );
}

function TarefaModal({
  tarefa,
  usuarios,
  processos,
  onClose,
  onSaved,
}: {
  tarefa: TarefaDTO | null;
  usuarios: UsuarioOpt[];
  processos: ProcessoOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const ehNova = !tarefa;
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
  const [responsavelId, setResponsavelId] = useState(tarefa?.responsavelId ?? "");
  const [inventoryId, setInventoryId] = useState(tarefa?.inventoryId ?? "");
  const [prazo, setPrazo] = useState(tarefa?.prazoISO ?? "");
  const [prioridade, setPrioridade] = useState(tarefa?.prioridade ?? "MEDIA");
  const [salvando, setSalvando] = useState(false);

  function escolherProcesso(id: string) {
    setInventoryId(id);
    // Sugere um título quando ainda não há um e um processo foi escolhido.
    if (id && !titulo.trim()) {
      const p = processos.find((x) => x.id === id);
      if (p) setTitulo(`Preencher o inventário: ${p.nome}`);
    }
  }

  async function salvar() {
    if (!titulo.trim()) return toast.error("Informe o título da tarefa.");
    if (!responsavelId) return toast.error("Escolha o membro responsável.");
    setSalvando(true);
    const input: TarefaInput = {
      id: tarefa?.id || undefined,
      titulo,
      descricao,
      responsavelId,
      inventoryId: inventoryId || null,
      prazo: prazo || null,
      prioridade,
    };
    try {
      await salvarTarefa(input);
      toast.success(ehNova ? "Tarefa atribuída" : "Tarefa atualizada");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar");
    } finally {
      setSalvando(false);
    }
  }

  const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";
  const papel = (r: string) => (r === "ADMIN" ? "admin" : r === "COORDENADOR" ? "coordenação" : "membro");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{ehNova ? "Nova tarefa" : "Editar tarefa"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3.5">
          <div>
            <label className={labelCls}>Processo do Inventário <span className="font-normal text-gray-400">(opcional — vincular dá ao responsável a edição do processo)</span></label>
            <select className={inputCls} value={inventoryId} onChange={(e) => escolherProcesso(e.target.value)}>
              <option value="">— Nenhum (tarefa avulsa) —</option>
              {processos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Título *</label>
            <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Preencher o inventário do Sistema ECP" />
          </div>
          <div>
            <label className={labelCls}>Responsável *</label>
            <select className={inputCls} value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
              <option value="">— Escolha um membro —</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome} · {papel(u.role)}</option>)}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Só aparecem membros com login. Falta alguém? Crie o acesso em “Acessos ao app”.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Prazo</label>
              <input type="date" className={inputCls} value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Prioridade</label>
              <select className={inputCls} value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Média</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Descrição / instruções</label>
            <textarea className={inputCls} rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Oriente o responsável sobre o que precisa ser preenchido." />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">
            {salvando ? "Salvando…" : ehNova ? "Atribuir tarefa" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
