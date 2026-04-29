

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckSquare, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ChecklistItem {
  item: string;
  description: string;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

const CHECKLIST_DATA: ChecklistSection[] = [
  {
    title: "I. Etapa Inicial e Identificação do Processo de Tratamento",
    items: [
      {
        item: "1. Identificar Agentes e Encarregado",
        description: "Registrar o Controlador (responsável pelas decisões do tratamento) e o Operador (quem trata os dados em nome do controlador)."
      },
      {
        item: "2. Identificar o Encarregado",
        description: "Indicar o nome, e-mail e telefone do Encarregado (DPO), que é o canal de comunicação entre o controlador, titulares e a ANPD."
      },
      {
        item: "3. Definir a Necessidade do RIPD",
        description: "Justificar a necessidade de elaboração do relatório (seja por alto risco, solicitação da ANPD, ou como parte da gestão de riscos e prevenção)."
      },
      {
        item: "4. Avaliar o Alto Risco",
        description: "Aplicar critérios para definir se o tratamento é de alto risco (ex: tratamento em larga escala ou que afeta significativamente direitos dos titulares, combinado com critérios específicos como uso de dados sensíveis ou de crianças/adolescentes)."
      },
      {
        item: "5. Escopo da Operação",
        description: "Definir se o RIPD será único (para múltiplas operações similares) ou segregado (para cada projeto/processo, especialmente se forem muito distintos)."
      },
      {
        item: "6. Momento da Elaboração",
        description: "Recomenda-se elaborar o RIPD antes de iniciar o tratamento, ou o mais rápido possível ao identificar um tratamento de alto risco."
      }
    ]
  },
  {
    title: "II. Dados Tratados e Base Legal",
    items: [
      {
        item: "1. Descrição do Tratamento (Geral)",
        description: "Descrever o processo do tratamento, desde a coleta até a eliminação. O tratamento inclui operações como coleta, produção, recepção, utilização, processamento, armazenamento, eliminação, entre outras."
      },
      {
        item: "2. Tipos de Dados Pessoais",
        description: "Descrever os tipos de dados pessoais e dados pessoais sensíveis coletados ou tratados."
      },
      {
        item: "3. Categorias e Volume",
        description: "Indicar as categorias dos titulares (ex: clientes, servidores, estudantes) e o volume de dados pessoais tratados."
      },
      {
        item: "4. Fonte e Natureza da Coleta",
        description: "Descrever como os dados são coletados (ex: titular, formulário, sistema). Informar se foi adotada nova tecnologia ou método de tratamento."
      },
      {
        item: "5. Finalidade do Tratamento",
        description: "Detalhar a razão (motivo) pelo qual os dados são tratados, garantindo que os propósitos sejam legítimos, específicos e explícitos. Indicar os resultados e benefícios esperados para os titulares e para a organização/sociedade."
      },
      {
        item: "6. Hipótese Legal (Base Legal)",
        description: "Justificar a escolha da hipótese legal (base legal) para cada finalidade do tratamento (ex: cumprimento de obrigação legal, execução de políticas públicas, legítimo interesse)."
      },
      {
        item: "7. Uso Compartilhado",
        description: "Informar os compartilhamentos internos e externos (incluindo transferência internacional, se houver) e com quais órgãos/entidades/empresas os dados são compartilhados."
      },
      {
        item: "8. Política de Retenção e Descarte",
        description: "Descrever os prazos de retenção (período de guarda) e os métodos de descarte/eliminação dos dados pessoais."
      },
      {
        item: "9. Contexto do Tratamento",
        description: "Destacar fatores internos e externos, como o relacionamento com os indivíduos e se o tratamento envolve grupos vulneráveis (crianças, idosos, etc.)."
      }
    ]
  },
  {
    title: "III. Avaliação de Necessidade e Proporcionalidade, Análise de riscos, Salvaguardas e Controles",
    items: [
      {
        item: "1. Consultar Partes Interessadas",
        description: "Consultar partes internas e externas relevantes (encarregado, operadores, gestores, especialistas em SI, consultores jurídicos)."
      },
      {
        item: "2. Registrar Opiniões",
        description: "Registrar as opiniões (convergentes ou divergentes) e as justificativas para a opção adotada (considerado uma boa prática para transparência e prestação de contas)."
      },
      {
        item: "3. Avaliar Necessidade e Proporcionalidade",
        description: "Demonstrar que o tratamento é limitado ao mínimo necessário para a finalidade e que é pertinente, proporcional e não excessivo."
      },
      {
        item: "4. Implementar Princípios",
        description: "Descrever como o tratamento atende aos princípios da LGPD (ex: finalidade, adequação, necessidade, transparência)."
      },
      {
        item: "5. Definir a Metodologia de Riscos",
        description: "Selecionar a metodologia de gestão de riscos (ex: Matriz Probabilidade x Impacto) e documentar os critérios e valores escalares utilizados (ex: 5-baixo, 10-moderado, 15-alto)."
      },
      {
        item: "6. Identificar e Avaliar Riscos",
        description: "Identificar os riscos potenciais ao titular (ex: acesso não autorizado, perda de dados, vazamento, retenção prolongada)."
      },
      {
        item: "7. Classificar Riscos",
        description: "Para cada risco, estimar a probabilidade de ocorrência (P) e o impacto inerente sobre os direitos e liberdades do titular (I). Classificar o Nível de Risco (P x I)."
      },
      {
        item: "8. Descrever Medidas de Mitigação",
        description: "Descrever as medidas, salvaguardas e mecanismos de mitigação de risco que serão adotados (medidas de segurança, técnicas e administrativas)."
      },
      {
        item: "9. Classificar Risco Residual",
        description: "Indicar o efeito da medida sobre o risco (Reduzir, Evitar, Compartilhar, Aceitar). Após a aplicação dos controles, reavaliar o risco para obter o Risco Residual."
      },
      {
        item: "10. Garantir Transparência",
        description: "Definir como serão fornecidas informações de privacidade para os titulares."
      }
    ]
  },
  {
    title: "IV. Monitoramento e Revisão",
    items: [
      {
        item: "1. Aprovação",
        description: "Obter a aprovação e as assinaturas do Responsável pela Elaboração, do Encarregado, da Autoridade Representante do Controlador e do Operador."
      },
      {
        item: "2. Decisão Pós-RIPD",
        description: "O controlador deve verificar a viabilidade de prosseguir ou não com o tratamento, e implementar as medidas e salvaguardas recomendadas."
      },
      {
        item: "3. Revisão Contínua",
        description: "Revisar e atualizar o RIPD anualmente ou sempre que houver fatos novos que possam alterar os riscos identificados (ex: mudança na finalidade, nova tecnologia, alteração na quantidade de dados)."
      },
      {
        item: "4. Publicação (se aplicável)",
        description: "Publicar o RIPD, se determinado pela ANPD (no caso de agentes públicos), ou se o próprio controlador decidir fazê-lo (preferencialmente uma versão resumida e sintética para resguardar segredos)."
      },
      {
        item: "5. Encaminhamento à ANPD",
        description: "O RIPD deve ser encaminhado à ANPD apenas quando for solicitado."
      }
    ]
  }
];

// Função para gerar ID único para cada item
function getItemId(sectionIndex: number, itemIndex: number): string {
  return `section-${sectionIndex}-item-${itemIndex}`;
}

export default function RipdChecklist() {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carregar progresso do usuário
  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ripd-checklist");
      if (response.ok) {
        const data = await response.json();
        setCompletedItems(data.completedItems || []);
      }
    } catch (error) {
      console.error("Erro ao carregar progresso:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (newCompletedItems: string[]) => {
    try {
      setSaving(true);
      const response = await fetch("/api/ripd-checklist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completedItems: newCompletedItems }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar progresso");
      }
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
      toast.error("Erro ao salvar progresso");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    const newCompletedItems = completedItems.includes(itemId)
      ? completedItems.filter((id) => id !== itemId)
      : [...completedItems, itemId];

    setCompletedItems(newCompletedItems);
    saveProgress(newCompletedItems);
  };

  // Calcular progresso total
  const totalItems = CHECKLIST_DATA.reduce((acc, section) => acc + section.items.length, 0);
  const completedCount = completedItems.length;
  const progressPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <CardTitle>Checklist de Construção do RIPD</CardTitle>
          </div>
          <Badge variant={completedCount === totalItems ? "default" : "secondary"}>
            {completedCount}/{totalItems} itens concluídos
          </Badge>
        </div>
        <CardDescription>
          Guia completo para construção de um Relatório de Impacto à Proteção de Dados Pessoais conforme a LGPD
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso Geral</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Seções do checklist */}
        {CHECKLIST_DATA.map((section, sectionIndex) => {
          const sectionCompletedCount = section.items.filter((_, itemIndex) =>
            completedItems.includes(getItemId(sectionIndex, itemIndex))
          ).length;
          const sectionProgress = section.items.length > 0
            ? (sectionCompletedCount / section.items.length) * 100
            : 0;

          return (
            <div key={sectionIndex} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{section.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {sectionCompletedCount}/{section.items.length}
                </Badge>
              </div>

              <Progress value={sectionProgress} className="h-1" />

              <div className="space-y-3">
                {section.items.map((checklistItem, itemIndex) => {
                  const itemId = getItemId(sectionIndex, itemIndex);
                  const isCompleted = completedItems.includes(itemId);

                  return (
                    <div
                      key={itemId}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        isCompleted
                          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                          : "bg-muted/30 border-muted"
                      }`}
                    >
                      <Checkbox
                        id={itemId}
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleItem(itemId)}
                        disabled={saving}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={itemId}
                          className={`text-sm font-medium cursor-pointer ${
                            isCompleted ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {checklistItem.item}
                        </label>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {checklistItem.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {saving && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Salvando progresso...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
