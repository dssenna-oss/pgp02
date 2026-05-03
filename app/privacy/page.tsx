
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Política de Privacidade
            </h1>
            <p className="text-gray-600">
              Carregando...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Política de Privacidade
          </h1>
          <p className="text-gray-600">
            Última atualização: 15 de setembro de 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed">
              Esta Política de Privacidade descreve como o LGPD - PGP coleta, usa e protege 
              suas informações pessoais quando você usa nossos serviços. Estamos comprometidos 
              em proteger sua privacidade e cumprindo integralmente a Lei Geral de Proteção 
              de Dados (LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Dados Coletados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Coletamos os seguintes tipos de informações:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2.1 Dados Fornecidos por Você</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Nome completo</li>
                  <li>E-mail</li>
                  <li>Informações da empresa (nome, CNPJ, endereço)</li>
                  <li>Dados inseridos no sistema para gestão de privacidade</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">2.2 Dados Coletados Automaticamente</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Endereço IP</li>
                  <li>Informações do navegador</li>
                  <li>Dados de uso da plataforma</li>
                  <li>Cookies técnicos necessários</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Como Usamos Seus Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos suas informações pessoais para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fornecer e operar nossos serviços</li>
              <li>Criar e gerenciar sua conta</li>
              <li>Comunicar-nos com você sobre o serviço</li>
              <li>Melhorar nossos serviços</li>
              <li>Cumprir obrigações legais</li>
              <li>Proteger contra fraudes e uso indevido</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Base Legal para Processamento</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Processamos seus dados pessoais com base em:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Execução de contrato:</strong> Para fornecer os serviços contratados</li>
              <li><strong>Interesse legítimo:</strong> Para melhorar nossos serviços e segurança</li>
              <li><strong>Obrigação legal:</strong> Para cumprir requisitos legais e regulatórios</li>
              <li><strong>Consentimento:</strong> Quando explicitamente fornecido por você</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Não vendemos seus dados pessoais. Podemos compartilhar informações apenas:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Com seu consentimento explícito</li>
              <li>Para cumprir obrigações legais</li>
              <li>Com prestadores de serviços que nos auxiliam (sob acordos de confidencialidade)</li>
              <li>Para proteger direitos, propriedade ou segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Segurança dos Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Implementamos medidas técnicas e administrativas apropriadas para proteger seus 
              dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. 
              Isso inclui criptografia, controles de acesso e monitoramento de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Seus Direitos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              De acordo com a LGPD, você tem os seguintes direitos:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação dos dados tratados com consentimento</li>
              <li>Revogação do consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Retenção de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Retemos seus dados pessoais apenas pelo tempo necessário para cumprir as 
              finalidades descritas nesta política, exceto quando períodos de retenção 
              mais longos forem exigidos por lei.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Usamos cookies essenciais para o funcionamento do site. Cookies são pequenos 
              arquivos de dados armazenados em seu dispositivo. Você pode configurar seu 
              navegador para recusar cookies, mas isso pode afetar a funcionalidade do site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Alterações na Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos 
              sobre mudanças significativas por e-mail ou através do site. O uso continuado 
              dos serviços após as mudanças constitui aceitação da nova política.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contato - Encarregado de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em 
              contato com nosso Encarregado de Dados (DPO):
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Encarregado (DPO):</strong> Durval Senna da Silva<br />
                <strong>E-mail:</strong> clubedoservidor@protonmail.com<br />
                <strong>Assunto:</strong> Solicitação LGPD - [Seu Nome]
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
