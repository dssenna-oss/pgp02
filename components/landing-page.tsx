
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Shield, 
  FileText, 
  BarChart3, 
  Users, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  BookOpen,
  AlertTriangle,
  Settings,
  Activity,
  Table,
  ClipboardList,
  FileCheck,
  Cookie,
  ScrollText,
  FileKey,
  Globe,
  FileSignature,
  ShieldCheck,
  Siren
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const features = [
    {
      icon: <FileText className="h-8 w-8 text-teal-600" />,
      title: "Conteúdos Didáticos",
      description: "Material educativo e recursos instrucionais para auxiliar na conformidade com a LGPD.",
      image: "/images/cards/conteudos_didaticos.jpg"
    },
    {
      icon: <Shield className="h-8 w-8 text-cyan-600" />,
      title: "Entendendo o PGP - Programa de Governança em Privacidade",
      description: "O início da jornada de adequação compreendendo conceitos, modelos (Top Down e Botton Up) e estruturas fundamentais.",
      image: "/images/cards/entendendo_pgp.jpg"
    },
    {
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      title: "Inventário de Dados",
      description: "Mapeamento completo dos dados pessoais tratados pela organização",
      image: "/images/cards/inventario_dados.jpg"
    },
    {
      icon: <AlertTriangle className="h-8 w-8 text-orange-600" />,
      title: "Análise de Riscos",
      description: "Identificação e avaliação de riscos relacionados ao tratamento de dados",
      image: "/images/cards/analise_riscos.jpg"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "GAP Analysis",
      description: "Análise de lacunas em conformidade com os requisitos da LGPD",
      image: "/images/cards/gap_analysis.jpg"
    },
    {
      icon: <BookOpen className="h-8 w-8 text-purple-600" />,
      title: "RIPD Automático",
      description: "Geração automática de Relatórios de Impacto à Proteção de Dados",
      image: "/images/cards/ripd_automatico.jpg"
    },
    {
      icon: <Settings className="h-8 w-8 text-gray-600" />,
      title: "Políticas e Procedimentos",
      description: "Criação automatizada de políticas de privacidade e segurança",
      image: "/images/cards/politicas_procedimentos.jpg"
    },
    {
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      title: "Gestão de Incidentes",
      description: "Controle completo de incidentes de segurança e vazamento de dados",
      image: "/images/cards/gestao_incidentes.jpg"
    },
    {
      icon: <Activity className="h-8 w-8 text-emerald-600" />,
      title: "Monitoramento Contínuo",
      description: "Acompanhamento em tempo real de indicadores de conformidade e performance do programa de privacidade",
      image: "/images/cards/monitoramento_continuo.jpg"
    }
  ];

  const documents = [
    {
      name: "Inventário de dados pessoais",
      icon: <Table className="h-5 w-5" />,
      iconColor: "text-green-600",
      format: "Excel",
      formatColor: "bg-green-100 text-green-700",
      description: "Mapeamento completo de todos os dados pessoais tratados pela organização"
    },
    {
      name: "Análise de riscos",
      icon: <AlertTriangle className="h-5 w-5" />,
      iconColor: "text-orange-600",
      format: "Excel",
      formatColor: "bg-green-100 text-green-700",
      description: "Identificação e avaliação de riscos no tratamento de dados pessoais"
    },
    {
      name: "GAP Analysis",
      icon: <BarChart3 className="h-5 w-5" />,
      iconColor: "text-blue-600",
      format: "Excel",
      formatColor: "bg-green-100 text-green-700",
      description: "Análise de lacunas de conformidade com os requisitos da LGPD"
    },
    {
      name: "Plano de ação",
      icon: <ClipboardList className="h-5 w-5" />,
      iconColor: "text-purple-600",
      format: "Excel",
      formatColor: "bg-green-100 text-green-700",
      description: "Cronograma de ações para adequação à LGPD com responsáveis e prazos"
    },
    {
      name: "RIPD - Relatório de Impacto",
      icon: <FileCheck className="h-5 w-5" />,
      iconColor: "text-indigo-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Relatório de Impacto à Proteção de Dados Pessoais conforme exigido pela LGPD"
    },
    {
      name: "Aviso de cookies",
      icon: <Cookie className="h-5 w-5" />,
      iconColor: "text-amber-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Texto informativo sobre uso de cookies no site da empresa"
    },
    {
      name: "Termos de uso",
      icon: <ScrollText className="h-5 w-5" />,
      iconColor: "text-gray-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Termos e condições de uso dos serviços digitais da empresa"
    },
    {
      name: "Política de privacidade interna",
      icon: <FileKey className="h-5 w-5" />,
      iconColor: "text-teal-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Diretrizes internas para tratamento de dados pessoais pelos colaboradores"
    },
    {
      name: "Aviso de privacidade externa",
      icon: <Globe className="h-5 w-5" />,
      iconColor: "text-cyan-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Informações aos titulares sobre como seus dados são tratados"
    },
    {
      name: "Adequação LGPD para contratos",
      icon: <FileSignature className="h-5 w-5" />,
      iconColor: "text-rose-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Cláusulas contratuais para conformidade com a LGPD"
    },
    {
      name: "Política de Segurança da Informação",
      icon: <ShieldCheck className="h-5 w-5" />,
      iconColor: "text-emerald-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Diretrizes de segurança para proteção de dados e sistemas"
    },
    {
      name: "Plano de Incidentes",
      icon: <Siren className="h-5 w-5" />,
      iconColor: "text-red-600",
      format: "Word",
      formatColor: "bg-blue-100 text-blue-700",
      description: "Procedimentos para resposta a incidentes de segurança e vazamento de dados"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">LGPD - PGP</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">Criar Conta</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Vídeo de Apresentação */}
            <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-2xl bg-black mb-12">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/dyFafhGG9u0?modestbranding=1&rel=0"
                  title="PGP - Apresentação"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Programa de Governança
              <br />
              <span className="text-blue-600">em Privacidade</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Sistema completo para adequação à LGPD. Gere automaticamente todos os documentos 
              necessários para conformidade com a Lei Geral de Proteção de Dados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8">
                  Iniciar Jornada de Adequação
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-8">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Tudo que você precisa para implementar um programa robusto de governança em privacidade
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md overflow-hidden">
                  {/* Imagem no topo do card */}
                  <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Documentos Gerados Automaticamente
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Sistema gera todos os documentos necessários personalizados para sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group relative flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer"
              >
                {/* Conteúdo principal */}
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 ${doc.iconColor}`}>
                    {doc.icon}
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {doc.name}
                  </span>
                </div>
                
                {/* Badge de formato */}
                <span className={`text-xs font-semibold px-2 py-1 rounded ${doc.formatColor}`}>
                  {doc.format}
                </span>

                {/* Tooltip com descrição no hover */}
                <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg">
                  <p>{doc.description}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#3B7FDB]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
              Implemente seu programa de governança em privacidade de forma simples e eficiente.
              Comece hoje mesmo e garanta a conformidade da sua empresa com a LGPD.
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="h-12 px-8 bg-white text-[#3B7FDB] hover:bg-gray-50">
                Criar Conta Gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">LGPD - PGP</span>
              </div>
              <p className="text-gray-400">
                Sistema completo para conformidade com LGPD e governança em privacidade.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Funcionalidades</li>
                <li>Documentação</li>
                <li>Suporte</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Termos de Uso</li>
                <li>Política de Privacidade</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PGP. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
