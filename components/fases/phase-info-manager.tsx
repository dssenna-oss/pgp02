

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, ListChecks, Edit2, Save, X, Loader2, Lock, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PhaseInfoManagerProps {
  phase: string;
  section?: "heyzine" | "howto" | "both"; // Permite renderizar seções específicas
}

export default function PhaseInfoManager({ phase, section = "both" }: PhaseInfoManagerProps) {
  const { data: session } = useSession() || {};
  const [heyzineEmbedUrl, setHeyzineEmbedUrl] = useState("");
  const [howToProceed, setHowToProceed] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingHeyzine, setEditingHeyzine] = useState(false);
  const [editingHowTo, setEditingHowTo] = useState(false);
  // Card "Considerações sobre a fase" começa colapsado pra reduzir altura
  // inicial da página (decisão 1.A do cardápio). Auto-expande quando o
  // admin entra em modo edição pra evitar editar conteúdo escondido.
  const [howToExpanded, setHowToExpanded] = useState(false);
  useEffect(() => {
    if (editingHowTo) setHowToExpanded(true);
  }, [editingHowTo]);
  
  // Verifica se o usuário é administrador
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    loadPhaseInfo();
  }, [phase]);

  const loadPhaseInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase-info?phase=${phase}`);
      if (response.ok) {
        const data = await response.json();
        setHeyzineEmbedUrl(data?.heyzineEmbedUrl || "");
        setHowToProceed(data?.howToProceed || "");
      }
    } catch (error) {
      console.error("Erro ao carregar informações da fase:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePhaseInfo = async (field: "heyzine" | "howto") => {
    try {
      setSaving(true);
      
      const payload: any = { phase };
      
      if (field === "heyzine") {
        payload.heyzineEmbedUrl = heyzineEmbedUrl;
        payload.howToProceed = howToProceed; // Manter o outro campo
      } else {
        payload.heyzineEmbedUrl = heyzineEmbedUrl; // Manter o outro campo
        payload.howToProceed = howToProceed;
      }

      const response = await fetch("/api/phase-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Informações salvas com sucesso!");
        if (field === "heyzine") {
          setEditingHeyzine(false);
        } else {
          setEditingHowTo(false);
        }
        loadPhaseInfo();
      } else {
        toast.error("Erro ao salvar informações");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar informações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // Componente do E-book Heyzine
  const HeyzineSection = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 flex-wrap min-w-0">
            <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span>E-book Interativo</span>
            {!isAdmin && heyzineEmbedUrl && (
              <span className="text-xs text-gray-500 font-normal inline-flex items-center">
                <Lock className="h-3 w-3 inline mr-1" />
                Gerenciado pelo Administrador
              </span>
            )}
          </CardTitle>
          {!editingHeyzine && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingHeyzine(true)}
              className="self-start sm:self-auto"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {heyzineEmbedUrl ? "Editar" : "Adicionar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editingHeyzine ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="heyzineUrl">URL de Embed do Heyzine</Label>
              <Input
                id="heyzineUrl"
                type="url"
                placeholder="Cole aqui a URL de embed do Heyzine"
                value={heyzineEmbedUrl}
                onChange={(e) => setHeyzineEmbedUrl(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Exemplo: https://heyzine.com/flip-book/XXXXXX.html
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => savePhaseInfo("heyzine")}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingHeyzine(false);
                  loadPhaseInfo();
                }}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : heyzineEmbedUrl ? (
          <div className="space-y-4">
            <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <iframe
                src={heyzineEmbedUrl}
                className="w-full h-[600px]"
                frameBorder="0"
                scrolling="auto"
                allowFullScreen
                title="E-book Interativo"
              />
            </div>
            <a
              href={heyzineEmbedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
            >
              Abrir em nova janela
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {isAdmin 
              ? "Nenhum e-book adicionado ainda. Clique em 'Adicionar' para inserir um e-book Heyzine."
              : "Nenhum e-book disponível para esta fase. Entre em contato com o administrador."}
          </p>
        )}
      </CardContent>
    </Card>
  );

  // Componente das Considerações sobre a fase (Collapsible — 1.A do
  // cardápio: default fechado pra reduzir altura). Clique no header abre
  // ou fecha o conteúdo. Edição força abrir (effect acima).
  const HowToProceedSection = () => (
    <Collapsible open={howToExpanded} onOpenChange={setHowToExpanded} asChild>
      <Card>
        <CardHeader className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CollapsibleTrigger
              className="flex items-center gap-2 flex-wrap min-w-0 text-left group flex-1 cursor-pointer rounded -m-1 p-1 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              aria-label={howToExpanded ? "Recolher considerações" : "Expandir considerações"}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-500 transition-transform shrink-0",
                  howToExpanded && "rotate-180",
                )}
              />
              <CardTitle className="flex items-center gap-2 flex-wrap min-w-0">
                <ListChecks className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span>Considerações sobre a fase</span>
                {!howToExpanded && (
                  <span className="text-xs text-gray-500 font-normal">
                    (clique pra expandir)
                  </span>
                )}
                {!isAdmin && howToProceed && howToExpanded && (
                  <span className="text-xs text-gray-500 font-normal inline-flex items-center">
                    <Lock className="h-3 w-3 inline mr-1" />
                    Gerenciado pelo Administrador
                  </span>
                )}
              </CardTitle>
            </CollapsibleTrigger>
            {!editingHowTo && isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingHowTo(true);
                }}
                className="self-start sm:self-auto"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {howToProceed ? "Editar" : "Adicionar"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
          <CardContent>
        {editingHowTo ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="howToProceed">Passo-a-passo</Label>
              <Textarea
                id="howToProceed"
                placeholder="Digite aqui o passo-a-passo de como proceder nesta fase..."
                value={howToProceed}
                onChange={(e) => setHowToProceed(e.target.value)}
                className="mt-2 min-h-[300px]"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Dica: Use números ou marcadores para organizar as etapas (ex: 1., 2., 3. ou • item)
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => savePhaseInfo("howto")}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingHowTo(false);
                  loadPhaseInfo();
                }}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : howToProceed ? (
          <div 
            className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: howToProceed }}
          />
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {isAdmin
              ? "Nenhum passo-a-passo adicionado ainda. Clique em 'Adicionar' para inserir as instruções."
              : "Nenhum passo-a-passo disponível para esta fase. Entre em contato com o administrador."}
          </p>
        )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  // Renderizar apenas seção Heyzine
  if (section === "heyzine") {
    return <HeyzineSection />;
  }

  // Renderizar apenas seção Como Proceder
  if (section === "howto") {
    return (
      <div id="howto" data-phase-section-id="howto" className="scroll-mt-4">
        <HowToProceedSection />
      </div>
    );
  }

  // Renderizar ambas as seções (comportamento padrão)
  return (
    <div className="space-y-6">
      <HeyzineSection />
      <HowToProceedSection />
    </div>
  );
}
