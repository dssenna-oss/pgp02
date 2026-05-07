"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Provider do Sistema de Cookies (CP26 — Fatia 2).
 *
 * Adaptação do `cookie-consent-context.tsx` do app antigo Detetive da
 * Privacidade ("Posso Confiar?"). Mantém a API original com 4 categorias
 * de cookies (necessary/analytics/marketing/preferences) e persistência
 * em localStorage + sincronização opcional com backend.
 *
 * Diferenças vs original:
 *   - Chave do localStorage renomeada: `pgp_cookie_consent` (era `detetive_*`)
 *   - Endpoint backend: /api/cookies/consent (mesmo path, schema CookieConsent
 *     já criado na Fatia 1)
 *   - Sem dependência de LandingVisitor (não existe no PGP)
 *
 * O Provider é envolvido APENAS em páginas públicas (login, signup, /p/...)
 * pela Fatia 3 — usuários logados no dashboard não veem o banner (assume
 * consentimento implícito ao logar).
 */

export interface CookiePreferences {
  necessary: boolean; // Sempre true, não pode ser desativado
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentContextType {
  hasConsented: boolean;
  isLoading: boolean;
  preferences: CookiePreferences;
  showBanner: boolean;
  showSettings: boolean;
  acceptAll: () => Promise<void>;
  rejectNonEssential: () => Promise<void>;
  savePreferences: (prefs: Partial<CookiePreferences>) => Promise<void>;
  openSettings: () => void;
  closeSettings: () => void;
  openBanner: () => void;
  closeBanner: () => void;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(
  undefined,
);

const COOKIE_CONSENT_KEY = "pgp_cookie_consent";
const COOKIE_PREFERENCES_KEY = "pgp_cookie_preferences";

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] =
    useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Restaura escolha persistida no mount (client-side only — evita
  // hydration mismatch).
  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);

      if (consent === "true" && savedPrefs) {
        const parsedPrefs = JSON.parse(savedPrefs) as Partial<CookiePreferences>;
        setPreferences({
          ...defaultPreferences,
          ...parsedPrefs,
          necessary: true,
        });
        setHasConsented(true);
        setShowBanner(false);
      } else {
        setShowBanner(true);
      }
    } catch (error) {
      console.error("Erro ao carregar consentimento de cookies:", error);
      setShowBanner(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToBackend = useCallback(async (prefs: CookiePreferences) => {
    try {
      await fetch("/api/cookies/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch (error) {
      // Backend pode estar fora — escolha do titular permanece em localStorage
      console.error("Erro ao salvar consentimento no backend:", error);
    }
  }, []);

  const saveConsent = useCallback(
    async (prefs: CookiePreferences) => {
      const finalPrefs = { ...prefs, necessary: true };

      localStorage.setItem(COOKIE_CONSENT_KEY, "true");
      localStorage.setItem(
        COOKIE_PREFERENCES_KEY,
        JSON.stringify(finalPrefs),
      );

      setPreferences(finalPrefs);
      setHasConsented(true);
      setShowBanner(false);
      setShowSettings(false);

      await saveToBackend(finalPrefs);
    },
    [saveToBackend],
  );

  const acceptAll = useCallback(async () => {
    await saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  }, [saveConsent]);

  const rejectNonEssential = useCallback(async () => {
    await saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }, [saveConsent]);

  const savePreferences = useCallback(
    async (prefs: Partial<CookiePreferences>) => {
      await saveConsent({ ...preferences, ...prefs, necessary: true });
    },
    [preferences, saveConsent],
  );

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const openBanner = useCallback(() => {
    setShowBanner(true);
  }, []);

  const closeBanner = useCallback(() => {
    if (hasConsented) {
      setShowBanner(false);
    }
  }, [hasConsented]);

  return (
    <CookieConsentContext.Provider
      value={{
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
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error(
      "useCookieConsent must be used within a CookieConsentProvider",
    );
  }
  return context;
}
