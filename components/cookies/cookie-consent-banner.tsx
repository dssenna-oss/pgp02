"use client";

/**
 * CookieConsentBanner — UI do Sistema de Cookies (CP26 — Fatia 2).
 *
 * Adaptação do `cookie-consent-banner.tsx` do app antigo Detetive da
 * Privacidade. 4 modos de exibição:
 *
 *   1. Overlay bloqueante educativo (1ª visita, ainda sem consentimento)
 *      - Card central com 3 botões: Aceitar todos · Rejeitar não essenciais ·
 *        Gerenciar Cookies
 *      - Botão de ajuda (?) abre vídeo "/videos/O_Caso_dos_Cookies.mp4"
 *      - Não bloqueia páginas legais (/p/..., /aviso-privacidade, /termos-uso,
 *        /politica-cookies — listados em LEGAL_PAGES)
 *
 *   2. Modal de configurações granulares (chamado pelo botão "Gerenciar")
 *      - 4 categorias com switches (necessary é "Sempre Ativo")
 *      - Cada categoria expande pra mostrar exemplos
 *      - "Salvar Preferências" registra no localStorage + backend
 *
 *   3. Botão flutuante (após consentimento dado)
 *      - Ícone Cookie no canto inferior esquerdo
 *      - Click reabre o mini banner pra reconfigurar
 *
 *   4. Mini banner pós-consentimento (chamado pelo botão flutuante)
 *      - Card discreto canto inferior direito
 *      - 2 botões: "Gerenciar" (abre modal de settings) · "Fechar"
 *
 * Diferenças vs original:
 *   - Sem dependência de páginas /aviso-privacidade etc. — links apontam pra
 *     URLs públicas das políticas geradas pelo PGP (Fatia 4 desta feature
 *     pluga isso). Por enquanto, ficam como `#` placeholder.
 *   - Vídeo: o arquivo `/videos/O_Caso_dos_Cookies.mp4` precisa ser subido
 *     manualmente no `public/videos/`. Banner mostra fallback graceful se
 *     vídeo não existir.
 */

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cookie,
  HelpCircle,
  Settings,
  Shield,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  useCookieConsent,
  type CookiePreferences,
} from "@/lib/cookie-consent-context";

// Páginas onde o overlay bloqueante NÃO aparece (precisam ser acessíveis
// mesmo sem consentimento — políticas, termos, etc.)
const LEGAL_PAGES = ["/p/", "/aviso-privacidade", "/termos-uso", "/politica-cookies"];

// ============================================================
// Modal de Vídeo Educativo
// ============================================================

function CookieVideoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Cookie className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              O Caso dos Cookies
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="aspect-video bg-black">
          <video
            className="w-full h-full"
            controls
            autoPlay
            playsInline
            // Fallback graceful: se o vídeo não existe (não foi subido em
            // public/videos/), o navegador mostra o placeholder do controls
            // e a mensagem do <p> abaixo.
            onError={(e) => {
              console.warn(
                "Vídeo /videos/O_Caso_dos_Cookies.mp4 não encontrado. Suba o arquivo em public/videos/ pra habilitar este conteúdo.",
              );
            }}
          >
            <source src="/videos/O_Caso_dos_Cookies.mp4" type="video/mp4" />
            <p className="text-white p-8 text-center">
              Vídeo não disponível. Configure
              <code className="bg-gray-800 px-2 py-1 rounded mx-1">
                public/videos/O_Caso_dos_Cookies.mp4
              </code>
              pra exibir o conteúdo educativo.
            </p>
          </video>
        </div>
        <div className="p-4 bg-gray-800/50 border-t border-gray-700">
          <p className="text-sm text-gray-300 text-center">
            🎓 Entenda como os cookies funcionam e por que sua escolha importa
            para sua privacidade.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Modal de Configurações Granulares
// ============================================================

const COOKIE_CATEGORIES = [
  {
    id: "necessary" as const,
    name: "Cookies Necessários",
    description:
      "Essenciais para o funcionamento básico do site. Não podem ser desativados.",
    required: true,
    examples: ["Autenticação", "Segurança", "Preferências de sessão"],
  },
  {
    id: "analytics" as const,
    name: "Cookies Analíticos",
    description:
      "Nos ajudam a entender como você usa o site, melhorando a experiência.",
    required: false,
    examples: ["Google Analytics", "Métricas de uso", "Relatórios de erros"],
  },
  {
    id: "marketing" as const,
    name: "Cookies de Marketing",
    description:
      "Utilizados para exibir anúncios relevantes e medir campanhas.",
    required: false,
    examples: ["Anúncios personalizados", "Remarketing", "Redes sociais"],
  },
  {
    id: "preferences" as const,
    name: "Cookies de Preferências",
    description: "Lembram suas escolhas para personalizar sua experiência.",
    required: false,
    examples: ["Idioma", "Tema (claro/escuro)", "Layout preferido"],
  },
];

function CookieSettingsModal({
  isOpen,
  onClose,
  preferences,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  preferences: CookiePreferences;
  onSave: (prefs: Partial<CookiePreferences>) => Promise<void>;
}) {
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localPrefs);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurações de Cookies
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Banner de Segundo Nível — ANPD
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {COOKIE_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id,
                  )
                }
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      category.required
                        ? "bg-green-500"
                        : localPrefs[category.id]
                          ? "bg-blue-500"
                          : "bg-gray-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {category.required ? (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                      Sempre Ativo
                    </span>
                  ) : (
                    <Switch
                      checked={localPrefs[category.id]}
                      onCheckedChange={(checked) => {
                        setLocalPrefs({ ...localPrefs, [category.id]: checked });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {expandedCategory === category.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <strong>Exemplos:</strong>
                      </p>
                      <ul className="space-y-1">
                        {category.examples.map((example, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar Preferências"}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            Conforme Art. 8º da LGPD — Você pode alterar suas preferências a
            qualquer momento.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Componente principal
// ============================================================

export default function CookieConsentBanner() {
  const pathname = usePathname();
  const {
    hasConsented,
    isLoading,
    preferences,
    showBanner,
    showSettings,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openSettings,
    closeSettings,
    openBanner,
    closeBanner,
  } = useCookieConsent();

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verifica se estamos em uma página legal (não bloquear estas páginas)
  const isOnLegalPage = LEGAL_PAGES.some((page) =>
    pathname?.startsWith(page),
  );

  const handleAcceptAll = useCallback(async () => {
    setIsProcessing(true);
    try {
      await acceptAll();
    } finally {
      setIsProcessing(false);
    }
  }, [acceptAll]);

  const handleRejectNonEssential = useCallback(async () => {
    setIsProcessing(true);
    try {
      await rejectNonEssential();
    } finally {
      setIsProcessing(false);
    }
  }, [rejectNonEssential]);

  if (isLoading) return null;

  return (
    <>
      {/* ───── 1. Overlay bloqueante educativo ───── */}
      <AnimatePresence>
        {showBanner && !hasConsented && !isOnLegalPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            style={{ pointerEvents: "none" }}
          >
            {/* O overlay tem pointer-events: none pra permitir cliques na
                navbar (Login/Cadastrar). Apenas o card central tem
                pointer-events: auto. */}
            <div
              className="absolute inset-0 flex items-center justify-center p-4"
              style={{ pointerEvents: "none" }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full max-w-2xl"
                style={{ pointerEvents: "auto" }}
              >
                <Card className="border-2 border-amber-500/30 shadow-2xl shadow-amber-500/10 bg-white dark:bg-gray-900">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                          <Cookie className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-gray-900 dark:text-white">
                            Política de Cookies
                          </CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Conforme Guia Orientativo da ANPD
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowVideoModal(true)}
                        className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                        title="Assistir vídeo explicativo"
                      >
                        <HelpCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Mensagem Educativa */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        <span className="text-lg">🎓</span>{" "}
                        <strong className="text-blue-700 dark:text-blue-400">
                          Sua Primeira Lição Começa Aqui:
                        </strong>{" "}
                        O aplicativo está bloqueado até você fazer uma escolha
                        consciente, mas para ajudar, assista ao vídeo clicando
                        no botão de ajuda{" "}
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs">
                          ?
                        </span>{" "}
                        acima.
                      </p>
                    </div>

                    {/* Informações sobre cookies */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <p>
                        Utilizamos cookies para garantir o funcionamento do
                        site e melhorar sua experiência. Você tem o direito de
                        escolher quais cookies aceitar.
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>
                          Seus dados são protegidos pela Lei Geral de Proteção
                          de Dados (LGPD)
                        </span>
                      </div>
                    </div>

                    {/* 3 botões com destaque igual */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aceitar Todos
                      </Button>
                      <Button
                        onClick={handleRejectNonEssential}
                        disabled={isProcessing}
                        variant="outline"
                        className="border-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 font-medium py-3"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeitar Não Essenciais
                      </Button>
                      <Button
                        onClick={openSettings}
                        disabled={isProcessing}
                        variant="outline"
                        className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 font-medium py-3"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar Cookies
                      </Button>
                    </div>

                    {/* Links legais — Fatia 4 substitui placeholders por
                        URLs públicas das políticas geradas pela empresa */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Link
                        href="#"
                        className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Política de Cookies
                      </Link>
                      <Link
                        href="#"
                        className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Aviso de Privacidade
                      </Link>
                      <Link
                        href="#"
                        className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Termos de Uso
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── 2. Botão flutuante (após consentimento) ───── */}
      <AnimatePresence>
        {hasConsented && !showBanner && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={openBanner}
            className="fixed bottom-4 left-4 z-[9997] p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-lg shadow-cyan-500/30 transition-colors"
            title="Gerenciar preferências de cookies"
          >
            <Cookie className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ───── 3. Mini banner pós-consentimento ───── */}
      <AnimatePresence>
        {showBanner && hasConsented && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[9998]"
          >
            <Card className="border border-amber-200 dark:border-amber-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Cookie className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Configurações de Cookies
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Você pode alterar suas preferências a qualquer momento.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={openSettings}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Gerenciar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={closeBanner}
                        className="text-gray-500 text-xs"
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── 4. Modais ───── */}
      <CookieSettingsModal
        isOpen={showSettings}
        onClose={closeSettings}
        preferences={preferences}
        onSave={savePreferences}
      />
      <CookieVideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </>
  );
}
