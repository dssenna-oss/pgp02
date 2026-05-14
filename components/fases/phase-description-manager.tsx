
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Save, Edit2, X, Code, Type } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import HtmlSubAccordion from "./html-sub-accordion";

interface PhaseDescriptionManagerProps {
  phase: string;
  defaultContent: string;
  section?: string;
  title?: string;
  /** Se true, não renderiza o Card próprio (usado quando envolvido por
   * <PhaseSection> que já fornece o card externo — evita double card). */
  noCard?: boolean;
}

// Função para converter HTML para texto simples
const htmlToText = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Função para converter texto simples em HTML com estrutura básica
const textToHtml = (text: string): string => {
  // Divide o texto em parágrafos (linhas vazias)
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs
    .map(para => {
      if (!para.trim()) return '';
      
      // Verifica se é um item de lista (começa com -, *, ou número)
      const lines = para.split('\n');
      const isListItem = lines.every(line => 
        /^[\s]*[-*•]\s+/.test(line) || /^[\s]*\d+\.\s+/.test(line)
      );
      
      if (isListItem) {
        const items = lines
          .filter(line => line.trim())
          .map(line => {
            const text = line.replace(/^[\s]*[-*•]\s+/, '').replace(/^[\s]*\d+\.\s+/, '');
            return `<li>${text}</li>`;
          })
          .join('\n');
        return `<ul>\n${items}\n</ul>`;
      }
      
      // Verifica se parece um título (linha curta, sem pontuação final)
      if (para.length < 100 && !para.trim().endsWith('.') && !para.includes('\n')) {
        // Se tem número no início, pode ser um subtítulo
        if (/^\d+\./.test(para.trim())) {
          return `<h3>${para.trim()}</h3>`;
        }
        return `<h2>${para.trim()}</h2>`;
      }
      
      // Parágrafo normal
      return `<p>${para.trim()}</p>`;
    })
    .filter(html => html)
    .join('\n\n');
};

export default function PhaseDescriptionManager({
  phase,
  defaultContent,
  section = 'description',
  title = 'Descrição da Fase',
  noCard = false,
}: PhaseDescriptionManagerProps) {
  const { data: session } = useSession() || {};
  const [content, setContent] = useState(defaultContent);
  const [editableContent, setEditableContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMode, setEditMode] = useState<'html' | 'text'>('html'); // Novo estado para controlar modo de edição
  
  // Verifica se o usuário é administrador
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    loadDescription();
  }, [phase, section]);

  const loadDescription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase-info?phase=${phase}&section=${section}`);
      if (response.ok) {
        const data = await response.json();
        if (data?.description) {
          setContent(data.description);
          setEditableContent(data.description);
        } else {
          setContent(defaultContent);
          setEditableContent(defaultContent);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar descrição:", error);
      setContent(defaultContent);
      setEditableContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const saveDescription = async () => {
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
          section,
          description: contentToSave
        }),
      });

      if (response.ok) {
        toast.success("Descrição salva com sucesso!");
        setContent(contentToSave);
        setEditableContent(contentToSave);
        setEditing(false);
        setEditMode('html');
      } else {
        toast.error("Erro ao salvar descrição");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar descrição");
    } finally {
      setSaving(false);
    }
  };

  const startHtmlEdit = () => {
    setEditMode('html');
    setEditableContent(content);
    setEditing(true);
  };

  const startTextEdit = () => {
    setEditMode('text');
    setEditableContent(htmlToText(content));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditableContent(content);
    setEditing(false);
    setEditMode('html');
  };

  if (loading) {
    const loadingInner = (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
    if (noCard) return loadingInner;
    return <Card><CardContent>{loadingInner}</CardContent></Card>;
  }

  // Botões de edição (só admin) — extraído pra reuso entre modo Card e noCard
  const editButtons = isAdmin && !editing && (
    <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:flex-wrap">
      <Button onClick={startHtmlEdit} variant="outline" size="sm" className="w-full sm:w-auto">
        <Code className="h-4 w-4 mr-2" />
        Editar HTML
      </Button>
      <Button onClick={startTextEdit} variant="outline" size="sm" className="w-full sm:w-auto">
        <Type className="h-4 w-4 mr-2" />
        Editar texto
      </Button>
    </div>
  );

  // Conteúdo principal — comum entre os 2 modos.
  // Modo noCard usa HtmlSubAccordion (CP19 Fatia 2) que detecta múltiplos
  // <h4> e quebra em sub-accordions (especialmente útil em "Considerações").
  // Quando há < 2 h4s, o componente faz fallback pra render plano.
  const innerContent = editing ? null : (
    noCard ? (
      <HtmlSubAccordion html={content} />
    ) : (
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  );

  if (noCard) {
    return (
      <div>
        {/* No modo noCard, apenas botões inline (título já vem do PhaseSection) */}
        {editButtons && <div className="mb-3 flex justify-end">{editButtons}</div>}
        {editing ? (
          <EditingForm
            editMode={editMode}
            editableContent={editableContent}
            setEditableContent={setEditableContent}
            saving={saving}
            saveDescription={saveDescription}
            cancelEdit={cancelEdit}
          />
        ) : (
          innerContent
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="break-words">{title}</span>
          </CardTitle>
          {editButtons}
        </div>
      </CardHeader>

      <CardContent>
        {editing ? (
          <EditingForm
            editMode={editMode}
            editableContent={editableContent}
            setEditableContent={setEditableContent}
            saving={saving}
            saveDescription={saveDescription}
            cancelEdit={cancelEdit}
          />
        ) : (
          innerContent
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// Sub-componente local — formulário de edição
// Reusado entre os modos Card e noCard pra evitar duplicação.
// ============================================================
interface EditingFormProps {
  editMode: 'html' | 'text';
  editableContent: string;
  setEditableContent: (v: string) => void;
  saving: boolean;
  saveDescription: () => void;
  cancelEdit: () => void;
}

function EditingForm({
  editMode,
  editableContent,
  setEditableContent,
  saving,
  saveDescription,
  cancelEdit,
}: EditingFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          {editMode === 'html'
            ? 'Conteúdo HTML da Descrição'
            : 'Conteúdo em Texto da Descrição'}
        </label>
        <Textarea
          value={editableContent}
          onChange={(e) => setEditableContent(e.target.value)}
          rows={20}
          className={editMode === 'html' ? 'font-mono text-sm' : ''}
          placeholder={editMode === 'html'
            ? "Cole aqui o HTML da descrição..."
            : "Digite o texto da descrição..."}
        />
        {editMode === 'text' && (
          <p className="text-xs text-gray-500 mt-2">
            💡 Dica: Use linhas vazias para separar parágrafos. Linhas curtas sem pontuação final serão convertidas em títulos.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={saveDescription}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>

        <Button
          onClick={cancelEdit}
          variant="outline"
          disabled={saving}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
