
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Edit2, Save, X, Loader2, Plus, Trash2, Lock, Monitor } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import PhaseNativeTools, { phaseHasNativeTools } from "./phase-native-tools";

interface PracticalLink {
  title: string;
  url: string;
  description?: string;
  displayMode?: "new-tab" | "embed"; // nova aba ou embed interno
}

interface PhasePracticalLinksProps {
  phase: string;
}

export default function PhasePracticalLinks({ phase }: PhasePracticalLinksProps) {
  const { data: session } = useSession() || {};
  const [links, setLinks] = useState<PracticalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expandedEmbedIndex, setExpandedEmbedIndex] = useState<number | null>(null);
  
  // Verifica se o usuário é administrador
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    loadPracticalLinks();
  }, [phase]);

  const loadPracticalLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase-info?phase=${phase}`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data?.practicalUrls || []);
      }
    } catch (error) {
      console.error("Erro ao carregar links práticos:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePracticalLinks = async () => {
    try {
      setSaving(true);
      
      const response = await fetch("/api/phase-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase,
          practicalUrls: links,
        }),
      });

      if (response.ok) {
        toast.success("Links salvos com sucesso!");
        setEditing(false);
        loadPracticalLinks();
      } else {
        toast.error("Erro ao salvar links");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar links");
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { title: "", url: "", description: "", displayMode: "new-tab" }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof PracticalLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div data-tour-id="phase-practical">
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 flex-wrap min-w-0">
            <ExternalLink className="h-5 w-5 text-purple-600 flex-shrink-0" />
            <span>Coloque em prática</span>
            {!isAdmin && links.length > 0 && (
              <span className="text-xs text-gray-500 font-normal inline-flex items-center">
                <Lock className="h-3 w-3 inline mr-1" />
                Gerenciado pelo Administrador
              </span>
            )}
          </CardTitle>
          {!editing && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="self-start sm:self-auto"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {links.length > 0 ? "Editar" : "Adicionar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mini-apps nativos da fase (Inventário, Análise de Riscos, etc.).
            Aparecem antes dos links externos em fases que tenham ferramentas
            nativas (hoje só Fase 3). Em outras fases, não renderiza nada. */}
        {!editing && <PhaseNativeTools phase={phase} />}

        {editing ? (
          <div className="space-y-6">
            {links.map((link, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <div>
                  <Label htmlFor={`title-${index}`}>Título do Link</Label>
                  <Input
                    id={`title-${index}`}
                    placeholder="Ex: Mapeamento e Riscos"
                    value={link.title}
                    onChange={(e) => updateLink(index, "title", e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`url-${index}`}>URL do Aplicativo</Label>
                  <Input
                    id={`url-${index}`}
                    type="url"
                    placeholder="https://exemplo.abacusai.app/continue"
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`display-mode-${index}`}>Modo de Exibição</Label>
                  <Select
                    value={link.displayMode || "new-tab"}
                    onValueChange={(value) => updateLink(index, "displayMode", value as "new-tab" | "embed")}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione o modo de exibição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-tab">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Nova Aba
                        </div>
                      </SelectItem>
                      <SelectItem value="embed">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Embed (Interno)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {link.displayMode === "embed" 
                      ? "O aplicativo será exibido diretamente nesta página"
                      : "O aplicativo será aberto em uma nova aba do navegador"}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor={`description-${index}`}>Descrição (opcional)</Label>
                  <Textarea
                    id={`description-${index}`}
                    placeholder="Breve descrição do que este aplicativo faz..."
                    value={link.description || ""}
                    onChange={(e) => updateLink(index, "description", e.target.value)}
                    className="mt-2"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addLink}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Link
            </Button>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={savePracticalLinks}
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Links
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  loadPracticalLinks();
                }}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : links.length > 0 ? (
          <div className="space-y-4">
            {links.map((link, index) => {
              const displayMode = link.displayMode || "new-tab";
              const isExpanded = expandedEmbedIndex === index;

              return (
                <div
                  key={index}
                  className="border rounded-lg overflow-hidden hover:border-purple-400 transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">
                          {link.title}
                        </h4>
                        {link.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {link.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {displayMode === "new-tab" ? (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm"
                            >
                              Acessar aplicativo
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setExpandedEmbedIndex(isExpanded ? null : index)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Monitor className="h-4 w-4 mr-2" />
                                {isExpanded ? "Fechar aplicativo" : "Abrir aplicativo aqui"}
                              </Button>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium text-sm"
                              >
                                Abrir em nova aba
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Área de embed */}
                  {displayMode === "embed" && isExpanded && (
                    <div className="border-t bg-gray-50 dark:bg-gray-900">
                      <div className="relative w-full" style={{ paddingBottom: "75%" }}>
                        <iframe
                          src={link.url}
                          className="absolute inset-0 w-full h-full"
                          title={link.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : phaseHasNativeTools(phase) ? (
          // Fase tem mini-apps nativos: o card já tem conteúdo.
          // Só mostra os links externos se houver — sem mensagem vazia.
          isAdmin && (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center pt-2 border-t border-dashed border-gray-200 dark:border-gray-800">
              Você pode adicionar links externos extras (planilhas, formulários,
              outros aplicativos) clicando em "Adicionar" acima.
            </p>
          )
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {isAdmin
              ? "Nenhum link adicionado ainda. Clique em 'Adicionar' para inserir links de aplicativos práticos."
              : "Nenhum link prático disponível para esta fase. Entre em contato com o administrador."}
          </p>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
