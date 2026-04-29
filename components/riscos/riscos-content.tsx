
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Shield, Plus } from "lucide-react";

interface RiscosContentProps {
  session?: any;
}

export default function RiscosContent({ session }: RiscosContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Análise de Riscos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Identificação e avaliação de riscos relacionados ao tratamento de dados
          </p>
        </div>
        <Button onClick={() => alert('Funcionalidade será implementada em breve')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Análise
        </Button>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Riscos Alto
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  3
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Riscos Médio
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  8
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Riscos Baixo
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  12
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk List */}
      <Card>
        <CardHeader>
          <CardTitle>Riscos Identificados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: 1,
                titulo: "Exposição de dados pessoais sensíveis",
                categoria: "Segurança da Informação",
                probabilidade: "Alta",
                impacto: "Alto",
                nivel: "Alto",
                cor: "red"
              },
              {
                id: 2,
                titulo: "Acesso não autorizado a bases de dados",
                categoria: "Controle de Acesso",
                probabilidade: "Média",
                impacto: "Alto",
                nivel: "Médio",
                cor: "yellow"
              },
              {
                id: 3,
                titulo: "Falha no processo de anonimização",
                categoria: "Tratamento de Dados",
                probabilidade: "Baixa",
                impacto: "Médio",
                nivel: "Baixo",
                cor: "green"
              }
            ].map((risco) => (
              <div key={risco.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {risco.titulo}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {risco.categoria}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-sm text-gray-600">Prob: {risco.probabilidade}</span>
                    <span className="text-sm text-gray-600">Impacto: {risco.impacto}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={
                      risco.cor === "red" ? "destructive" : 
                      risco.cor === "yellow" ? "secondary" : "default"
                    }
                  >
                    {risco.nivel}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => alert('Funcionalidade de análise será implementada em breve')}
                  >
                    Analisar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
