"use client";

// Visão consolidada da turma pro Comitê Executivo (PM ou CM) acompanhar
// pelo celular. Polling 5s — mesmo padrão do Painel do Facilitador.
// Sem detalhes pedagógicos sensíveis (SOS, erros plantados, phaseSkips).
//
// Pensado pra ser lido enquanto os 2 membros do Comitê (1 Coordenador +
// 1 Controle Interno) circulam pela sala acompanhando os grupos do órgão.
// Acesso read-only com gate de SENHA da turma (Caminho A) — não é login de
// usuário. Layout mobile-first, tipografia generosa.

import { useEffect, useState, type FormEvent } from "react";
import {
  Eye, Loader2, AlertTriangle, RefreshCw, Award, Clock,
  Building2, CheckCircle2, Circle, AlertCircle,
} from "lucide-react";

type BolinhaMissao = {
  id: string;
  label: string;
  nomeCurto: string;
  status: "DONE" | "DOING" | "IDLE";
  contador?: string;
  duracaoEsperadaSeg: number;
  inicioEm?: string;
  ultimaAtividadeEm?: string;
};

type Grupo = {
  grupoId: string;
  numero: number;
  orgao: string;
  companyName: string;
  score: number;
  ultimaAtividade: string | null;
  timeline: BolinhaMissao[];
  resumo: {
    inventario: string;
    riscos: string;
    gapScore: number;
    gapRespondidos: number;
    ripds: number;
    terceiros: number;
    dsr: number;
    avisoStatus: string | null;
    incidentes: number;
  };
};

type Dados = {
  turma: { nome: string; cidade: string };
  orgaoFiltro: "PM" | "CM" | null;
  grupos: Grupo[];
  geradoEm: string;
};

function tempoRelativo(iso: string | null): string {
  if (!iso) return "—";
  const seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 60) return "agora";
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`;
  return `há ${Math.floor(seg / 3600)}h`;
}

export function ComiteView({
  turmaSlug,
  orgao,
}: {
  turmaSlug: string;
  orgao: "PM" | "CM" | null;
}) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);

  // Gate Caminho A: senha da turma (a mesma dos participantes). NÃO é login de
  // usuário — só libera a visualização read-only. Guardada na sessionStorage
  // pra não pedir de novo a cada refresh do polling.
  const [senha, setSenha] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);

  const urlPainel = (s: string) =>
    `/api/comite/painel?turmaSlug=${turmaSlug}${orgao ? `&orgao=${orgao}` : ""}&senha=${encodeURIComponent(s)}`;

  // Restaura senha já validada nesta sessão do navegador.
  useEffect(() => {
    const s = sessionStorage.getItem("comite-senha");
    if (s) {
      setSenha(s);
      setAutenticado(true);
    }
  }, []);

  // Polling 5s — só depois de autenticado.
  useEffect(() => {
    if (!autenticado) return;
    let cancelado = false;
    async function load() {
      try {
        const res = await fetch(urlPainel(senha), { cache: "no-store" });
        if (res.status === 401) {
          // senha deixou de valer (ex.: facilitador trocou) → volta pro form
          if (!cancelado) {
            sessionStorage.removeItem("comite-senha");
            setAutenticado(false);
            setErroSenha("A senha mudou. Peça a senha atual ao facilitador.");
          }
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Erro ${res.status}`);
        }
        const data = await res.json();
        if (!cancelado) {
          setDados(data);
          setErro(null);
        }
      } catch (e: any) {
        if (!cancelado) setErro(e.message || "Erro ao carregar");
      } finally {
        if (!cancelado) setCarregandoInicial(false);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [turmaSlug, orgao, autenticado, senha]);

  async function tentarEntrar(e: FormEvent) {
    e.preventDefault();
    if (!senha.trim()) return;
    setVerificando(true);
    setErroSenha(null);
    try {
      const res = await fetch(urlPainel(senha), { cache: "no-store" });
      if (res.status === 401) {
        setErroSenha("Senha incorreta. Peça a senha da turma ao facilitador.");
        return;
      }
      if (!res.ok) {
        setErroSenha("Não consegui validar agora. Tente de novo em instantes.");
        return;
      }
      sessionStorage.setItem("comite-senha", senha);
      setAutenticado(true);
    } catch {
      setErroSenha("Sem conexão. Tente de novo.");
    } finally {
      setVerificando(false);
    }
  }

  // Enquanto não digitar a senha certa, só mostra a tela de senha.
  if (!autenticado) {
    return (
      <TelaSenha
        senha={senha}
        setSenha={setSenha}
        onSubmit={tentarEntrar}
        verificando={verificando}
        erro={erroSenha}
      />
    );
  }

  if (carregandoInicial) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Carregando painel da turma…</p>
      </div>
    );
  }

  if (erro && !dados) {
    return (
      <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-red-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Erro</div>
            <div className="text-sm">{erro}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!dados) return null;

  // Hero por órgão: emerald pra PM (combina com o gradient dos cards),
  // blue pra CM, slate (neutro) se vier sem filtro.
  const orgaoFiltro = dados.orgaoFiltro;
  const heroCor = orgaoFiltro === "PM"
    ? "from-emerald-600 via-emerald-700 to-teal-800"
    : orgaoFiltro === "CM"
    ? "from-blue-600 via-blue-700 to-indigo-800"
    : "from-slate-600 via-slate-700 to-slate-800";
  const tituloComite = orgaoFiltro === "PM"
    ? "Comitê Executivo · Prefeitura"
    : orgaoFiltro === "CM"
    ? "Comitê Executivo · Câmara"
    : "Comitê Executivo (visão geral)";
  const emojiOrgao = orgaoFiltro === "PM" ? "🛕" : orgaoFiltro === "CM" ? "🏛" : "👥";

  return (
    <div className="space-y-5">
      {/* Hero do Comitê */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroCor} px-5 py-6 text-white shadow-lg`}>
        <svg
          className="absolute inset-0 h-full w-full opacity-10"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern id="comite-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#comite-grid)" />
        </svg>
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-2 ring-white/40 backdrop-blur text-3xl">
            {emojiOrgao}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/80">
              Painel do Comitê
            </div>
            <h1 className="mt-0.5 text-xl font-bold leading-tight sm:text-2xl">
              {tituloComite}
            </h1>
            <div className="text-sm text-white/90">{dados.turma.nome} · {dados.turma.cidade}</div>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
          <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
            👥 {dados.grupos.length} grupo(s) sob acompanhamento
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 ring-1 ring-white/20">
            👁 Modo leitura — você acompanha sem interferir
          </span>
        </div>
      </div>

      {/* Resumo institucional */}
      <div className="rounded-lg border-l-4 border-l-slate-400 bg-white p-4">
        <p className="text-xs leading-relaxed text-gray-600">
          Você é membro do <strong className="text-gray-800">Comitê Executivo</strong> ({orgaoFiltro === "PM" ? "Prefeitura" : orgaoFiltro === "CM" ? "Câmara" : "turma"}):
          2 pessoas (1 Coordenador + 1 Controle Interno) que acompanham os grupos do órgão durante o curso. Anotem dúvidas recorrentes
          na <strong>Folha do Comitê Executivo</strong> (papel) e entreguem ao facilitador na Reflexão Final.
          Esta página atualiza sozinha a cada 5 segundos.
        </p>
      </div>

      {/* Cards dos grupos */}
      <div className="space-y-3">
        {dados.grupos.map((g) => (
          <CardGrupo key={g.grupoId} grupo={g} />
        ))}
      </div>

      {/* Rodapé com tempo */}
      <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
        <RefreshCw className="h-3 w-3" />
        Atualiza a cada 5s · {new Date(dados.geradoEm).toLocaleTimeString("pt-BR")}
      </div>
    </div>
  );
}

// Tela de senha (gate Caminho A) — pede a senha da turma antes de mostrar o
// painel read-only. A senha é a MESMA dos participantes (informada pelo
// facilitador). Não cria sessão de usuário; só guarda na sessionStorage.
function TelaSenha({
  senha,
  setSenha,
  onSubmit,
  verificando,
  erro,
}: {
  senha: string;
  setSenha: (s: string) => void;
  onSubmit: (e: FormEvent) => void;
  verificando: boolean;
  erro: string | null;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-2">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border bg-white p-6 text-center shadow-sm"
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
          🔑
        </div>
        <h1 className="text-lg font-bold text-gray-900">Painel do Comitê</h1>
        <p className="mt-1 text-sm text-gray-500">
          Digite a <strong>senha da turma</strong> (informada pelo facilitador) para acompanhar.
        </p>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="senha da turma"
          autoFocus
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        {erro && <p className="mt-2 text-xs font-medium text-red-600">{erro}</p>}
        <button
          type="submit"
          disabled={verificando || !senha.trim()}
          className="mt-4 w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {verificando ? "Verificando…" : "Entrar"}
        </button>
        <p className="mt-3 text-[11px] text-gray-400">
          👁 Modo leitura — você acompanha sem interferir
        </p>
      </form>
    </div>
  );
}

function CardGrupo({ grupo }: { grupo: Grupo }) {
  const orgaoEmoji = grupo.orgao === "PM" ? "🛕" : "🏛";
  const orgaoCor = grupo.orgao === "PM" ? "from-emerald-500 to-emerald-600" : "from-blue-500 to-blue-600";

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* Header do grupo */}
      <div className={`bg-gradient-to-r ${orgaoCor} px-4 py-3 text-white`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{orgaoEmoji}</span>
            <div className="min-w-0">
              <div className="font-bold text-base leading-tight truncate">
                Grupo {grupo.numero} · {grupo.orgao === "PM" ? "Prefeitura" : "Câmara"}
              </div>
              <div className="text-[11px] text-white/80 truncate">{grupo.companyName}</div>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] uppercase tracking-wide text-white/75 font-semibold">Score</div>
            <div className="text-xl font-bold tabular-nums leading-none">{grupo.score}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/85">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Última atividade: {tempoRelativo(grupo.ultimaAtividade)}</span>
        </div>
      </div>

      {/* Timeline das missões */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <TimelineMissoes bolinhas={grupo.timeline} />
      </div>

      {/* Resumo de progresso */}
      <div className="px-4 py-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <ItemResumo rotulo="Inventário"  valor={grupo.resumo.inventario} />
        <ItemResumo rotulo="Riscos"      valor={grupo.resumo.riscos} />
        <ItemResumo rotulo="GAP score"   valor={grupo.resumo.gapRespondidos > 0 ? `${grupo.resumo.gapScore}%` : "—"} />
        <ItemResumo rotulo="Plano"       valor={grupo.resumo.gapRespondidos > 0 ? `${grupo.resumo.gapRespondidos} respond.` : "—"} />
        <ItemResumo rotulo="RIPDs"       valor={String(grupo.resumo.ripds)} />
        <ItemResumo rotulo="Terceiros"   valor={`${grupo.resumo.terceiros} c/ cláusula`} />
        <ItemResumo rotulo="Aviso"       valor={grupo.resumo.avisoStatus || "—"} />
        <ItemResumo rotulo="Incidentes"  valor={String(grupo.resumo.incidentes)} />
      </div>
    </div>
  );
}

function ItemResumo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-dashed border-gray-100">
      <span className="text-gray-500 truncate">{rotulo}</span>
      <span className="font-semibold text-gray-800 text-right shrink-0">{valor}</span>
    </div>
  );
}

function TimelineMissoes({ bolinhas }: { bolinhas: BolinhaMissao[] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <div className="flex items-start gap-0 px-1 min-w-max">
        {bolinhas.map((b, i) => {
          const proxima = bolinhas[i + 1];
          const conectorAtivo = b.status === "DONE";
          const corBolinha =
            b.status === "DONE" ? "bg-emerald-500 text-white" :
            b.status === "DOING" ? "bg-amber-400 text-amber-900 animate-pulse" :
                                   "bg-gray-200 text-gray-500";
          const Icone =
            b.status === "DONE" ? CheckCircle2 :
            b.status === "DOING" ? AlertCircle :
                                   Circle;
          return (
            <div key={b.id} className="flex items-start min-w-0">
              <div className="flex flex-col items-center w-14 shrink-0">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shadow-sm ${corBolinha}`}>
                  <Icone className="h-4 w-4" />
                </div>
                <div className="mt-1 text-[10px] font-semibold text-gray-700 leading-tight text-center">
                  {b.label}
                </div>
                <div className="text-[9px] text-gray-500 leading-tight text-center max-w-[3.5rem] truncate">
                  {b.nomeCurto}
                </div>
                {b.contador && (
                  <div className="text-[9px] text-gray-400 tabular-nums">{b.contador}</div>
                )}
              </div>
              {proxima && (
                <div
                  className={`h-0.5 mt-[18px] flex-1 min-w-[14px] transition-colors ${
                    conectorAtivo ? "bg-emerald-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
