
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ListChecks, Loader2, Save, Edit2, X, Lock, Code, Type } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface PhaseChecklistProps {
  phase: string;
  sections: ChecklistSection[];
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

export default function PhaseChecklist({ phase, sections: initialSections }: PhaseChecklistProps) {
  const { data: session } = useSession() || {};
  const [sections, setSections] = useState<ChecklistSection[]>(initialSections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState<'html' | 'text'>('html'); // Novo estado para controlar modo de edição
  const [editableContent, setEditableContent] = useState("");
  
  // Verifica se o usuário é administrador
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    loadChecklistState();
  }, [phase]);

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
          // Atualizar o estado dos checkboxes com os dados salvos
          const savedState = data.checklistState as Record<string, boolean>;
          setSections(prevSections =>
            prevSections.map(section => ({
              ...section,
              items: section.items.map(item => ({
                ...item,
                checked: savedState[item.id] ?? item.checked
              }))
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
      
      // Criar objeto com o estado de todos os checkboxes
      const checklistState: Record<string, boolean> = {};
      sections.forEach(section => {
        section.items.forEach(item => {
          checklistState[item.id] = item.checked;
        });
      });

      const response = await fetch("/api/phase-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          checklistState
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
                item.id === itemId ? { ...item, checked } : item
              )
            }
          : section
      )
    );
  };

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-green-600" />
              Checklist de implementação
              {!isAdmin && editableContent && (
                <span className="text-xs text-gray-500 ml-2 font-normal">
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
          <div className="flex gap-2">
            {!editing && isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startHtmlEdit}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Editar HTML
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTextEdit}
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
                className="bg-green-600 hover:bg-green-700"
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
      </CardHeader>
      
      <CardContent className="space-y-6">
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
            <div className="flex gap-2">
              <Button
                onClick={saveChecklistHtml}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
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
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          // Exibir checklist interativo com checkboxes
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
      </CardContent>
    </Card>
  );
}
