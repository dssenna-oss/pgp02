"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, KeyRound, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  criarUsuario, atualizarUsuario, redefinirSenha, excluirUsuario,
} from "@/app/dashboard/usuarios/actions";

export type UsuarioDTO = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isSelf: boolean;
};
export type MembroOption = { nome: string; email: string; funcao: string };

const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrador", COORDENADOR: "Coordenador", MEMBRO: "Membro" };
const ROLE_VARIANT: Record<string, "red" | "blue" | "gray"> = { ADMIN: "red", COORDENADOR: "blue", MEMBRO: "gray" };

export function UsuariosClient({ usuarios, membrosSemLogin }: { usuarios: UsuarioDTO[]; membrosSemLogin: MembroOption[] }) {
  const router = useRouter();
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<UsuarioDTO | null>(null);
  const [resetando, setResetando] = useState<UsuarioDTO | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 font-bold">
          🔑 {usuarios.length} login(s) · {usuarios.filter((u) => u.isActive).length} ativo(s)
        </div>
        <button onClick={() => setCriando(true)} className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Novo login
        </button>
      </div>

      <div className="space-y-2">
        {usuarios.map((u) => (
          <div key={u.id} className={`bg-white border rounded-xl px-3.5 py-3 flex items-center gap-3.5 ${!u.isActive ? "opacity-60" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold text-gray-900">{u.name} {u.isSelf && <span className="text-[10px] text-brand-600 font-bold">(você)</span>}</div>
              <div className="text-[11.5px] text-gray-500 mt-0.5">{u.email}</div>
            </div>
            <Badge variant={ROLE_VARIANT[u.role] ?? "gray"}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
            {!u.isActive && <span className="text-[10.5px] font-bold px-2 py-0.5 rounded border bg-gray-100 text-gray-600">inativo</span>}
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setResetando(u)} title="Redefinir senha" className="text-gray-300 hover:text-amber-600"><KeyRound className="w-4 h-4" /></button>
              <button onClick={() => setEditando(u)} title="Editar" className="text-gray-300 hover:text-brand-600"><Pencil className="w-4 h-4" /></button>
              {!u.isSelf && (
                <button
                  onClick={async () => {
                    if (!confirm(`Excluir o login de ${u.name}? A pessoa perde o acesso ao app.`)) return;
                    const t = toast.loading("Excluindo…");
                    const r = await excluirUsuario(u.id);
                    if ("erro" in r) { toast.error(r.erro, { id: t }); return; }
                    toast.success("Login excluído", { id: t }); router.refresh();
                  }}
                  title="Excluir" className="text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg px-3.5 py-3 text-[12.5px] mt-5">
        💡 <b>Papéis:</b> Administrador e Coordenador gerenciam tudo (inclusive esta tela); Membro usa as ferramentas das fases.
        A senha que você define aqui é inicial — cada pessoa pode trocá-la depois em <b>Minha conta</b>.
      </div>

      {criando && <UsuarioModal membros={membrosSemLogin} onClose={() => setCriando(false)} onSaved={() => { setCriando(false); router.refresh(); }} />}
      {editando && <EditarModal usuario={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); router.refresh(); }} />}
      {resetando && <ResetModal usuario={resetando} onClose={() => setResetando(null)} onSaved={() => setResetando(null)} />}
    </>
  );
}

const inputCls = "w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelCls = "text-xs font-semibold text-gray-700 mb-1 block";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UsuarioModal({ membros, onClose, onSaved }: { membros: MembroOption[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBRO");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  function prefill(idx: string) {
    const m = membros[Number(idx)];
    if (!m) return;
    setName(m.nome); setEmail(m.email);
    if (/coordenador/i.test(m.funcao)) setRole("COORDENADOR");
    else if (/presidente|encarregado/i.test(m.funcao)) setRole("COORDENADOR");
    else setRole("MEMBRO");
  }

  async function salvar() {
    setSalvando(true);
    const r = await criarUsuario({ name, email, role, senha });
    if ("erro" in r) { toast.error(r.erro); setSalvando(false); return; }
    toast.success("Login criado"); onSaved();
  }

  return (
    <ModalShell title="Novo login" onClose={onClose}>
      <div className="p-5 space-y-3.5">
        {membros.length > 0 && (
          <div>
            <label className={labelCls}>Preencher a partir de um membro <span className="font-normal text-gray-400">(opcional)</span></label>
            <select className={inputCls} defaultValue="" onChange={(e) => prefill(e.target.value)}>
              <option value="">— escolher um membro sem login… —</option>
              {membros.map((m, i) => <option key={m.email} value={i}>{m.nome} · {m.funcao}</option>)}
            </select>
          </div>
        )}
        <div><label className={labelCls}>Nome *</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className={labelCls}>E-mail *</label><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@tcees.tc.br" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Papel</label>
            <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="MEMBRO">Membro</option>
              <option value="COORDENADOR">Coordenador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div><label className={labelCls}>Senha inicial *</label><input className={inputCls} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mín. 6 caracteres" /></div>
        </div>
        <p className="text-[11px] text-gray-400">Anote a senha inicial e informe à pessoa por um canal seguro. Ela pode trocá-la depois em “Minha conta”.</p>
      </div>
      <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
        <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
        <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Criando…" : "Criar login"}</button>
      </div>
    </ModalShell>
  );
}

function EditarModal({ usuario, onClose, onSaved }: { usuario: UsuarioDTO; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(usuario.name);
  const [role, setRole] = useState(usuario.role);
  const [isActive, setIsActive] = useState(usuario.isActive);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    const r = await atualizarUsuario({ id: usuario.id, name, role, isActive });
    if ("erro" in r) { toast.error(r.erro); setSalvando(false); return; }
    toast.success("Login atualizado"); onSaved();
  }

  return (
    <ModalShell title={`Editar — ${usuario.email}`} onClose={onClose}>
      <div className="p-5 space-y-3.5">
        <div><label className={labelCls}>Nome</label><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div>
          <label className={labelCls}>Papel</label>
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="MEMBRO">Membro</option>
            <option value="COORDENADOR">Coordenador</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
          <input type="checkbox" className="w-4 h-4 accent-brand-600" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={usuario.isSelf} />
          Acesso ativo {usuario.isSelf && <span className="text-[11px] text-gray-400">(não dá pra desativar você mesmo)</span>}
        </label>
      </div>
      <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
        <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
        <button onClick={salvar} disabled={salvando} className="text-sm bg-brand-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-brand-700 disabled:opacity-60">{salvando ? "Salvando…" : "Salvar"}</button>
      </div>
    </ModalShell>
  );
}

function ResetModal({ usuario, onClose, onSaved }: { usuario: UsuarioDTO; onClose: () => void; onSaved: () => void }) {
  const [nova, setNova] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    const r = await redefinirSenha({ id: usuario.id, novaSenha: nova });
    if ("erro" in r) { toast.error(r.erro); setSalvando(false); return; }
    toast.success("Senha redefinida — informe a nova à pessoa"); onSaved();
  }

  return (
    <ModalShell title={`Redefinir senha — ${usuario.name}`} onClose={onClose}>
      <div className="p-5 space-y-3.5">
        <p className="text-[12.5px] text-gray-600">Defina uma nova senha para <b>{usuario.email}</b> e informe à pessoa. Ela poderá trocá-la depois em “Minha conta”.</p>
        <div><label className={labelCls}>Nova senha *</label><input className={inputCls} value={nova} onChange={(e) => setNova(e.target.value)} placeholder="mín. 6 caracteres" /></div>
      </div>
      <div className="flex justify-end gap-2 px-5 py-3.5 border-t bg-gray-50 rounded-b-xl">
        <button onClick={onClose} className="text-sm border border-gray-300 bg-white text-gray-700 rounded-md px-4 py-2 hover:bg-gray-50">Cancelar</button>
        <button onClick={salvar} disabled={salvando} className="text-sm bg-amber-600 text-white rounded-md px-4 py-2 font-semibold hover:bg-amber-700 disabled:opacity-60">{salvando ? "Salvando…" : "Redefinir"}</button>
      </div>
    </ModalShell>
  );
}
