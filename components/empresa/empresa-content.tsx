
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, User, MapPin, Phone, Mail, Globe } from "lucide-react";
import { useState } from "react";
import InstitutionalDomainCard from "./institutional-domain-card";

interface EmpresaContentProps {
  session?: any;
}

export default function EmpresaContent({ session }: EmpresaContentProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dados da Empresa
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Informações da organização para personalização dos documentos
          </p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancelar" : "Editar Informações"}
        </Button>
      </div>

      {/* Domínio institucional — funcional, alimenta auto-discovery
          de URLs no modal de Pré-preencher por Carta de Serviços */}
      <InstitutionalDomainCard />

      {/* Company Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo and Basic Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Logo e Identidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-12 w-12 text-blue-600" />
              </div>
              {isEditing ? (
                <Button variant="outline" size="sm">
                  Alterar Logo
                </Button>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Logo da empresa será exibido aqui
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  defaultValue="Empresa Exemplo Ltda."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                <Input
                  id="nomeFantasia"
                  defaultValue="Exemplo Corp"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  defaultValue="12.345.678/0001-90"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                <Input
                  id="inscricaoEstadual"
                  defaultValue="123.456.789.012"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone Principal</Label>
              <Input
                id="telefone"
                defaultValue="(11) 3456-7890"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                defaultValue="(11) 99876-5432"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Principal</Label>
              <Input
                id="email"
                defaultValue="contato@exemplo.com.br"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailDpo">Email do DPO</Label>
              <Input
                id="emailDpo"
                defaultValue="dpo@exemplo.com.br"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                defaultValue="https://www.exemplo.com.br"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="endereco">Logradouro</Label>
              <Input
                id="endereco"
                defaultValue="Rua das Flores, 123"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                defaultValue="123"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                defaultValue="Sala 456"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                defaultValue="Centro"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                defaultValue="São Paulo"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                defaultValue="SP"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                defaultValue="01234-567"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DPO Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Data Protection Officer (DPO)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeDpo">Nome do DPO</Label>
              <Input
                id="nomeDpo"
                defaultValue="João Silva Santos"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpfDpo">CPF do DPO</Label>
              <Input
                id="cpfDpo"
                defaultValue="123.456.789-00"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefoneDpo">Telefone do DPO</Label>
              <Input
                id="telefoneDpo"
                defaultValue="(11) 99876-5432"
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formacaoDpo">Formação/Certificações</Label>
              <Input
                id="formacaoDpo"
                defaultValue="Advogado, Certificação LGPD"
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Description */}
      <Card>
        <CardHeader>
          <CardTitle>Descrição da Atividade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="atividadePrincipal">Atividade Principal</Label>
            <Textarea
              id="atividadePrincipal"
              rows={3}
              defaultValue="Desenvolvimento de software e soluções tecnológicas para empresas de diferentes segmentos."
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="segmento">Segmento de Mercado</Label>
            <Input
              id="segmento"
              defaultValue="Tecnologia da Informação"
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numeroFuncionarios">Número de Funcionários</Label>
            <Input
              id="numeroFuncionarios"
              defaultValue="50-100"
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setIsEditing(false)}>
            Salvar Alterações
          </Button>
        </div>
      )}
    </div>
  );
}
