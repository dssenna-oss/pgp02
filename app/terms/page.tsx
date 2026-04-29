
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
              Termos de Uso
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
            Termos de Uso
          </h1>
          <p className="text-gray-600">
            Última atualização: 15 de setembro de 2024
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              Ao acessar e usar o PGP System, você aceita e concorda em ficar vinculado pelos 
              termos e condições deste acordo. Se você não concordar com todos os termos e 
              condições deste acordo, então você não pode acessar o site ou usar qualquer serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              O PGP System é uma plataforma web que oferece ferramentas para auxiliar organizações 
              na implementação de Programas de Governança em Privacidade de acordo com a Lei Geral 
              de Proteção de Dados (LGPD).
            </p>
            <p className="text-gray-700 leading-relaxed">
              O serviço inclui funcionalidades como inventário de dados pessoais, análise de riscos, 
              GAP Analysis, geração de documentos e gestão de incidentes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Uso Aceitável</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você concorda em usar o PGP System apenas para fins legais e de acordo com estes Termos de Uso. 
              Especificamente, você concorda em não:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Usar o serviço para qualquer propósito ilegal ou não autorizado</li>
              <li>Interferir ou interromper a operação do serviço</li>
              <li>Tentar acessar dados de outras organizações</li>
              <li>Transmitir conteúdo malicioso ou prejudicial</li>
              <li>Violar qualquer lei ou regulamento aplicável</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Conta do Usuário</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para usar certas funcionalidades do PGP System, você deve criar uma conta. 
              Você é responsável por:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Manter a confidencialidade de suas credenciais de login</li>
              <li>Todas as atividades que ocorrem em sua conta</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              <li>Fornecer informações precisas e atualizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacidade e Proteção de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Nosso compromisso com a privacidade e proteção de dados está detalhado em nossa 
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                Política de Privacidade
              </Link>. Ao usar nossos serviços, você também concorda com nossa Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitação de Responsabilidade</h2>
            <p className="text-gray-700 leading-relaxed">
              O PGP System é fornecido "como está" sem garantias de qualquer tipo. Não nos 
              responsabilizamos por quaisquer danos diretos, indiretos, incidentais, consequenciais 
              ou punitivos decorrentes do uso ou incapacidade de usar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Modificações</h2>
            <p className="text-gray-700 leading-relaxed">
              Reservamos o direito de modificar estes termos a qualquer momento. As mudanças 
              entrarão em vigor imediatamente após a publicação no site. O uso continuado do 
              serviço após as mudanças constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contato</h2>
            <p className="text-gray-700 leading-relaxed">
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através 
              do e-mail: contato@pgpsystem.com.br
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
