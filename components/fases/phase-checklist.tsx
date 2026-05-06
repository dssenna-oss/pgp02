
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ListChecks, Loader2, Save, Edit2, X, Lock, Code, Type, ChevronDown, LayoutGrid, List as ListIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

/**
 * Status do checklist (CP24).
 *  - PENDING: ainda não começou (equivalente legado: checked=false)
 *  - IN_PROGRESS: em andamento (estado novo do Kanban)
 *  - DONE: concluído (equivalente legado: checked=true)
 *
 * Retrocompatibilidade: itens carregados de checklistState (Record<id, boolean>)
 * são derivados pra status. Save envia ambos formatos (boolean +
 * checklistKanbanState) pra preservar API e abrir caminho gradual.
 */
type ChecklistStatus = "PENDING" | "IN_PROGRESS" | "DONE";

function deriveStatus(item: { checked?: boolean; status?: ChecklistStatus }): ChecklistStatus {
  if (item.status) return item.status;
  return item.checked ? "DONE" : "PENDING";
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  /** Status do Kanban (CP24). Se ausente, derivado de `checked`. */
  status?: ChecklistStatus;
}

type ChecklistViewMode = "list" | "kanban";
const STORAGE_VIEWMODE_PREFIX = "pgp:phase-checklist-mode:";

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface PhaseChecklistProps {
  phase: string;
  sections: ChecklistSection[];
  /** Se true, não renderiza Card próprio (usado dentro de PhaseSection). */
  noCard?: boolean;
}

// Função para converter HTML para texto simples
const htmlToText = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Função para converter texto simples em HTML de checklist
const textToHtml = (text: string): string => {
  const lines = text.split('\n').filter(line => line.trim());
  let html = '';
  let currentList = '';
  let inList = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Verifica se é um item de lista (começa com -, *, • ou número)
    if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
      
      if (!inList) {
        currentList = '<ul class="space-y-2 mb-6">\n';
        inList = true;
      }
      
      currentList += `  <li class="text-sm text-gray-700 dark:text-gray-300">${text}</li>\n`;
    } else {
      // Se estava em uma lista, fecha ela
      if (inList) {
        currentList += '</ul>\n\n';
        html += currentList;
        currentList = '';
        inList = false;
      }
      
      // Verifica se é um título (linha curta sem pontuação final ou com número no início)
      if (trimmed.length < 100 && (!trimmed.endsWith('.') || /^\d+\./.test(trimmed))) {
        html += `<h4 class="font-semibold text-lg text-gray-900 dark:text-white mb-3">${trimmed}</h4>\n`;
      } else if (trimmed) {
        html += `<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${trimmed}</p>\n`;
      }
    }
  }
  
  // Fecha a lista se ainda estiver aberta
  if (inList) {
    currentList += '</ul>\n';
    html += currentList;
  }
  
  return html;
};

export default function PhaseChecklist({ phase, sections: initialSections, noCard = false }: PhaseChecklistProps) {
  const { data: session } = useSession() || {};
  const [sections, setSections] = useState<ChecklistSection[]>(initialSections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState<'html' | 'text'>('html'); // Novo estado para controlar modo de edição
  const [editableContent, setEditableContent] = useState("");

  // CP19 Fatia 3 — UI: esconder concluídos + accordion por seção (só noCard)
  const [hideCompleted, setHideCompleted] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // CP24 — toggle Lista/Kanban (persistido por fase em localStorage)
  const [viewMode, setViewMode] = useState<ChecklistViewMode>("list");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(STORAGE_VIEWMODE_PREFIX + phase);
      if (v === "kanban" || v === "list") setViewMode(v);
    } catch {
      // silencioso
    }
  }, [phase]);
  function changeViewMode(m: ChecklistViewMode) {
    setViewMode(m);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_VIEWMODE_PREFIX + phase, m);
      } catch {
        // silencioso
      }
    }
  }
  
  // Verifica se o usuário é administrador
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    loadChecklistState();
  }, [phase]);

  // Default: 1ª seção aberta. Quando sections muda (depois de loadChecklistState),
  // re-aplica esse default se ainda não tiver nenhum estado.
  useEffect(() => {
    if (sections.length > 0 && openSections.size === 0) {
      setOpenSections(new Set([sections[0].id]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.length]);

  // Toggle accordion de uma seção do checklist
  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function expandAllSections() {
    setOpenSections(new Set(sections.map((s) => s.id)));
  }
  function collapseAllSections() {
    setOpenSections(new Set());
  }

  // Stats por seção (pra header com progresso individual)
  function sectionStats(section: ChecklistSection): { done: number; total: number; pct: number } {
    const total = section.items.length;
    const done = section.items.filter((i) => i.checked).length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  const loadChecklistState = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase-info?phase=${phase}`);
      if (response.ok) {
        const data = await response.json();
        
        // Carregar conteúdo HTML editável se existir
        if (data?.checklistHtml) {
          setEditableContent(data.checklistHtml);
          // Parsear HTML editado para atualizar os labels dos checkboxes
          const updatedSections = parseHtmlToSections(data.checklistHtml, initialSections);
          setSections(updatedSections);
        } else {
          // Gerar HTML a partir das seções iniciais
          setEditableContent(generateHtmlFromSections(initialSections));
          setSections(initialSections);
        }
        
        if (data?.checklistState) {
          // CP24 — checklistState aceita 2 formatos pra retrocompat:
          //   - Legacy boolean: { "id": true|false }
          //   - Novo string status: { "id": "PENDING"|"IN_PROGRESS"|"DONE" }
          // Detectamos o formato pelo tipo do valor de cada chave.
          const savedState = data.checklistState as Record<string, boolean | ChecklistStatus>;
          setSections(prevSections =>
            prevSections.map(section => ({
              ...section,
              items: section.items.map(item => {
                const v = savedState[item.id];
                if (typeof v === "string" && (v === "PENDING" || v === "IN_PROGRESS" || v === "DONE")) {
                  return { ...item, status: v, checked: v === "DONE" };
                }
                if (typeof v === "boolean") {
                  return { ...item, checked: v, status: v ? "DONE" : "PENDING" };
                }
                return item;
              })
            }))
          );
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estado do checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateHtmlFromSections = (secs: ChecklistSection[]) => {
    let html = "";
    secs.forEach(section => {
      html += `<h4 class="font-semibold text-lg text-gray-900 dark:text-white mb-3">${section.title}</h4>\n`;
      html += `<ul class="space-y-2 mb-6">\n`;
      section.items.forEach(item => {
        html += `  <li class="text-sm text-gray-700 dark:text-gray-300">${item.label}</li>\n`;
      });
      html += `</ul>\n\n`;
    });
    return html;
  };

  const parseHtmlToSections = (html: string, baseSections: ChecklistSection[]): ChecklistSection[] => {
    // Criar um parser DOM temporário
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extrair todos os h4 (títulos das seções)
    const h4Elements = doc.querySelectorAll('h4');
    const updatedSections: ChecklistSection[] = [];
    
    h4Elements.forEach((h4, sectionIndex) => {
      const sectionTitle = h4.textContent?.trim() || '';
      
      // Encontrar a lista <ul> seguinte ao h4
      let nextElement = h4.nextElementSibling;
      while (nextElement && nextElement.tagName !== 'UL') {
        nextElement = nextElement.nextElementSibling;
      }
      
      if (nextElement && nextElement.tagName === 'UL') {
        const liElements = nextElement.querySelectorAll('li');
        const items: ChecklistItem[] = [];
        
        liElements.forEach((li, itemIndex) => {
          const label = li.textContent?.trim() || '';
          // Usar o ID da seção base correspondente ou gerar um novo
          const baseSection = baseSections[sectionIndex];
          const baseItem = baseSection?.items[itemIndex];
          const itemId = baseItem?.id || `section-${sectionIndex}-item-${itemIndex}`;
          
          items.push({
            id: itemId,
            label: label,
            checked: baseItem?.checked || false
          });
        });
        
        // Usar o ID da seção base ou gerar um novo
        const baseSection = baseSections[sectionIndex];
        const sectionId = baseSection?.id || `section-${sectionIndex}`;
        
        updatedSections.push({
          id: sectionId,
          title: sectionTitle,
          items: items
        });
      }
    });
    
    return updatedSections.length > 0 ? updatedSections : baseSections;
  };

  const saveChecklistState = async () => {
    try {
      setSaving(true);
      
      // CP24 — checklistState agora guarda string status diretamente
      // (PENDING/IN_PROGRESS/DONE). API aceita JSON livre, mantendo
      // retrocompat (load detecta boolean ou string).
      const checklistState: Record<string, ChecklistStatus> = {};
      sections.forEach(section => {
        section.items.forEach(item => {
          checklistState[item.id] = deriveStatus(item);
        });
      });

      const response = await fetch("/api/phase-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          checklistState,
        }),
      });

      if (response.ok) {
        toast.success("Progresso salvo com sucesso!");
      } else {
        toast.error("Erro ao salvar progresso");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar progresso");
    } finally {
      setSaving(false);
    }
  };

  const saveChecklistHtml = async () => {
    try {
      setSaving(true);

      // Se estiver em modo texto, converte para HTML antes de salvar
      const contentToSave = editMode === 'text' 
        ? textToHtml(editableContent) 
        : editableContent;

      const response = await fetch("/api/phase-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          checklistHtml: contentToSave
        }),
      });

      if (response.ok) {
        toast.success("Conteúdo salvo com sucesso!");
        setEditing(false);
        setEditMode('html');
        loadChecklistState();
      } else {
        toast.error("Erro ao salvar conteúdo");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  };

  const startHtmlEdit = () => {
    setEditMode('html');
    setEditing(true);
  };

  const startTextEdit = () => {
    setEditMode('text');
    setEditableContent(htmlToText(editableContent));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditMode('html');
    loadChecklistState();
  };

  const handleCheckboxChange = (sectionId: string, itemId: string, checked: boolean) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? { ...item, checked, status: checked ? "DONE" : "PENDING" }
                  : item
              )
            }
          : section
      )
    );
  };

  // CP24 — atualiza status (incluindo IN_PROGRESS) usado pelo Kanban.
  // Mantém `checked` sincronizado com DONE pra retrocompat.
  const handleStatusChange = (itemId: string, status: ChecklistStatus) => {
    setSections(prevSections =>
      prevSections.map(section => ({
        ...section,
        items: section.items.map(item =>
          item.id === itemId
            ? { ...item, status, checked: status === "DONE" }
            : item
        )
      }))
    );
  };

  // Encontra todos os items achatados c/ contexto de seção (pro Kanban)
  function flattenItems(): Array<{ section: ChecklistSection; item: ChecklistItem; status: ChecklistStatus }> {
    const out: Array<{ section: ChecklistSection; item: ChecklistItem; status: ChecklistStatus }> = [];
    for (const section of sections) {
      for (const item of section.items) {
        out.push({ section, item, status: deriveStatus(item) });
      }
    }
    return out;
  }

  const calculateProgress = () => {
    const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
    const checkedItems = sections.reduce(
      (acc, section) => acc + section.items.filter(item => item.checked).length,
      0
    );
    return totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const progress = calculateProgress();

  // Quando dentro de PhaseSection, evita Card duplo: usa div + componentes
  // de header simulados (sem Card wrapper). PhaseSection já fornece o card
  // externo + título principal.
  const Wrapper = noCard ? "div" : Card;
  const Header = noCard ? "div" : CardHeader;
  const Content = noCard ? "div" : CardContent;

  return (
    <Wrapper className={noCard ? "" : undefined}>
      <Header className={noCard ? "mb-3" : undefined}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <ListChecks className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span>Checklist de implementação</span>
              {!isAdmin && editableContent && (
                <span className="text-xs text-gray-500 font-normal inline-flex items-center">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Gerenciado pelo Administrador
                </span>
              )}
            </CardTitle>
            {!editing && (
              <p className="text-sm text-gray-500 mt-1">
                Progresso: {progress}% concluído
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:flex-wrap">
            {!editing && isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startHtmlEdit}
                  className="w-full sm:w-auto"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Editar HTML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTextEdit}
                  className="w-full sm:w-auto"
                >
                  <Type className="h-4 w-4 mr-2" />
                  Editar texto
                </Button>
              </>
            )}
            {!editing && (
              <Button
                onClick={saveChecklistState}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Progresso
              </Button>
            )}
          </div>
        </div>
        
        {/* Barra de progresso */}
        {!editing && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Header>

      <Content className="space-y-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {editMode === 'html' 
                  ? 'Editar conteúdo HTML do checklist' 
                  : 'Editar conteúdo em Texto do checklist'}
              </label>
              <Textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className={editMode === 'html' ? "min-h-[400px] font-mono text-sm" : "min-h-[400px]"}
                placeholder={editMode === 'html' 
                  ? "Digite ou cole o HTML do checklist aqui..." 
                  : "Digite o texto do checklist aqui..."}
              />
              {editMode === 'html' ? (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Dica: Use HTML com tags como &lt;h4&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;p&gt;, etc.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Dica: Use linhas iniciadas com - ou * para itens de lista. Linhas curtas sem pontuação final serão convertidas em títulos.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={saveChecklistHtml}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
              <Button
                variant="outline"
                onClick={cancelEdit}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : noCard ? (
          // CP19 Fatia 3 — Render compacto: barra de progresso global,
          // toggle "Esconder concluídos", accordion por categoria com
          // contador "X/Y" e barra de progresso individual no header.
          <div className="space-y-3">
            {/* Toolbar mini: hide completed + expand/collapse + view mode toggle */}
            <div className="flex flex-wrap items-center gap-3 text-xs pb-2 border-b dark:border-gray-700">
              <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-400">
                <Checkbox
                  checked={hideCompleted}
                  onCheckedChange={(c) => setHideCompleted(!!c)}
                  className="h-3.5 w-3.5"
                />
                Esconder concluídos
              </label>
              {viewMode === "list" && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">·</span>
                  <button type="button" onClick={expandAllSections} className="text-blue-600 dark:text-blue-400 hover:underline">
                    Expandir todas
                  </button>
                  <button type="button" onClick={collapseAllSections} className="text-gray-600 dark:text-gray-400 hover:underline">
                    Recolher todas
                  </button>
                </>
              )}

              {/* CP24 — toggle Lista/Kanban */}
              <div className="ml-auto inline-flex bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => changeViewMode("list")}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-900 shadow font-medium text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                  title="Visualizar como lista (modo padrão)"
                >
                  <ListIcon className="h-3 w-3" />
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => changeViewMode("kanban")}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                    viewMode === "kanban"
                      ? "bg-white dark:bg-gray-900 shadow font-medium text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                  }`}
                  title="Visualizar como kanban (drag-drop entre 3 colunas)"
                >
                  <LayoutGrid className="h-3 w-3" />
                  Kanban
                </button>
              </div>
            </div>

            {/* Render condicional: Kanban OU lista */}
            {viewMode === "kanban" ? (
              <KanbanView
                sections={sections}
                hideCompleted={hideCompleted}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <ListView
                sections={sections}
                openSections={openSections}
                toggleSection={toggleSection}
                sectionStats={sectionStats}
                hideCompleted={hideCompleted}
                handleCheckboxChange={handleCheckboxChange}
              />
            )}
          </div>
        ) : (
          // Render legado (modo Card sem noCard)
          sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                {section.title}
              </h4>

              <div className="space-y-3 pl-2">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(section.id, item.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <label
                      htmlFor={item.id}
                      className={`text-sm cursor-pointer flex-1 ${
                        item.checked
                          ? "text-gray-500 dark:text-gray-400 line-through"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </Content>
    </Wrapper>
  );
}

// ============================================================
// CP24 — ListView (extraído do render principal)
// ============================================================

function ListView({
  sections,
  openSections,
  toggleSection,
  sectionStats,
  hideCompleted,
  handleCheckboxChange,
}: {
  sections: ChecklistSection[];
  openSections: Set<string>;
  toggleSection: (id: string) => void;
  sectionStats: (s: ChecklistSection) => { done: number; total: number; pct: number };
  hideCompleted: boolean;
  handleCheckboxChange: (sectionId: string, itemId: string, checked: boolean) => void;
}) {
  return (
    <>
      {sections.map((section) => {
        const stats = sectionStats(section);
        const isOpen = openSections.has(section.id);
        const isComplete = stats.total > 0 && stats.done === stats.total;
        const visibleItems = hideCompleted
          ? section.items.filter((i) => !i.checked)
          : section.items;
        return (
          <div
            key={section.id}
            className={`border dark:border-gray-700 rounded-md overflow-hidden ${
              isComplete ? "border-emerald-300 dark:border-emerald-900/50" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 flex-1 min-w-0 break-words">
                {section.title}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-medium ${
                    isComplete
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {stats.done}/{stats.total}
                </span>
                <div className="hidden sm:block w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isComplete ? "bg-emerald-500" : stats.done > 0 ? "bg-blue-500" : "bg-gray-400"
                    }`}
                    style={{ width: `${stats.pct}%` }}
                  />
                </div>
                <ChevronDownIcon open={isOpen} />
              </div>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-3 pt-1 space-y-1.5">
                  {visibleItems.length === 0 && (
                    <p className="text-xs italic text-gray-500 dark:text-gray-400">
                      {hideCompleted ? "Tudo concluído nesta categoria 🎉" : "Sem itens"}
                    </p>
                  )}
                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(section.id, item.id, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={item.id}
                        className={`text-sm cursor-pointer flex-1 ${
                          item.checked
                            ? "text-gray-500 dark:text-gray-400 line-through"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ============================================================
// CP24 — KanbanView com 3 colunas + drag-drop nativo
// ============================================================

const COL_DEFS: Array<{ status: ChecklistStatus; label: string; emoji: string; bg: string; ring: string; tint: string }> = [
  { status: "PENDING",     label: "Pendente",     emoji: "⏳", bg: "bg-slate-100 dark:bg-slate-800/40",   ring: "border-slate-300 dark:border-slate-700",   tint: "text-slate-600" },
  { status: "IN_PROGRESS", label: "Em andamento", emoji: "🔄", bg: "bg-amber-50/60 dark:bg-amber-950/20", ring: "border-amber-300 dark:border-amber-900/50", tint: "text-amber-700" },
  { status: "DONE",        label: "Feito",        emoji: "✅", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", ring: "border-emerald-300 dark:border-emerald-900/50", tint: "text-emerald-700" },
];

function KanbanView({
  sections,
  hideCompleted,
  onStatusChange,
}: {
  sections: ChecklistSection[];
  hideCompleted: boolean;
  onStatusChange: (itemId: string, status: ChecklistStatus) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<ChecklistStatus | null>(null);

  // Achata todos os items mantendo seção (pra exibir tag de origem)
  const items: Array<{ section: ChecklistSection; item: ChecklistItem; status: ChecklistStatus }> = [];
  for (const section of sections) {
    for (const item of section.items) {
      const status = deriveStatus(item);
      if (hideCompleted && status === "DONE") continue;
      items.push({ section, item, status });
    }
  }

  // Handlers drag-drop nativos HTML5
  function onDragStart(e: React.DragEvent<HTMLDivElement>, itemId: string) {
    setDraggingId(itemId);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", itemId);
    } catch {
      // alguns navegadores
    }
  }
  function onDragEnd() {
    setDraggingId(null);
    setHoverCol(null);
  }
  function onDragOverCol(e: React.DragEvent<HTMLDivElement>, status: ChecklistStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverCol !== status) setHoverCol(status);
  }
  function onDragLeaveCol(status: ChecklistStatus) {
    if (hoverCol === status) setHoverCol(null);
  }
  function onDropCol(e: React.DragEvent<HTMLDivElement>, status: ChecklistStatus) {
    e.preventDefault();
    let id = draggingId;
    if (!id) {
      try {
        id = e.dataTransfer.getData("text/plain");
      } catch {
        id = null;
      }
    }
    if (id) onStatusChange(id, status);
    setDraggingId(null);
    setHoverCol(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {COL_DEFS.map((col) => {
        const colItems = items.filter((it) => it.status === col.status);
        const isHover = hoverCol === col.status;
        return (
          <div
            key={col.status}
            onDragOver={(e) => onDragOverCol(e, col.status)}
            onDragLeave={() => onDragLeaveCol(col.status)}
            onDrop={(e) => onDropCol(e, col.status)}
            className={`rounded-lg border-2 border-dashed p-2 min-h-[200px] transition-colors ${
              col.bg
            } ${isHover ? "border-blue-500 ring-2 ring-blue-300" : col.ring}`}
          >
            {/* Header da coluna */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <span>{col.emoji}</span>
                <span className={`font-semibold text-sm ${col.tint} dark:opacity-90`}>{col.label}</span>
                <span className="text-xs bg-white/70 dark:bg-black/30 text-gray-700 dark:text-gray-300 px-1.5 rounded-full">
                  {colItems.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-1.5">
              {colItems.length === 0 && (
                <p className="text-[11px] italic text-gray-400 text-center px-2 py-3">
                  {col.status === "DONE" ? "Nada concluído ainda" : "Solte itens aqui"}
                </p>
              )}
              {colItems.map(({ item, section, status }) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.id)}
                  onDragEnd={onDragEnd}
                  className={`bg-white dark:bg-gray-900 rounded-md p-2 border border-gray-200 dark:border-gray-700 shadow-sm cursor-grab active:cursor-grabbing transition-opacity ${
                    draggingId === item.id ? "opacity-40" : ""
                  } ${status === "DONE" ? "" : ""}`}
                >
                  <p
                    className={`text-xs leading-snug ${
                      status === "DONE"
                        ? "text-gray-400 dark:text-gray-500 line-through"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate">
                    {section.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Sub-componente local — chevron rotacionado
function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
    />
  );
}
