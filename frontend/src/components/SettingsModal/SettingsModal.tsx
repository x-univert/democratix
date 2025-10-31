import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHandleThemeManagement } from 'hooks/useHandleThemeManagement';
import { useFocusTrap } from 'hooks/useFocusTrap';
import { ThemeTooltipDots } from '../Header/components/ThemeTooltip/components/ThemeTooltipDots';
import { useGetNetworkConfig } from 'lib';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ThemeMode = 'mvx:dark-theme' | 'mvx:vibe-theme' | 'mvx:light-theme' | 'auto';
type Language = 'fr' | 'en' | 'es';
type Network = 'devnet' | 'testnet' | 'mainnet';

const THEME_LABELS: Record<ThemeMode, string> = {
  'mvx:dark-theme': 'Sombre (TealLab)',
  'mvx:light-theme': 'Clair (BrightLight)',
  'mvx:vibe-theme': 'VibeMode',
  'auto': 'Auto'
};

const THEME_DOT_COLORS: Record<string, string[]> = {
  'mvx:dark-theme': ['#23F7DD', '#262626', '#B6B3AF', '#FFFFFF'],
  'mvx:vibe-theme': ['#471150', '#5A2A62', '#D200FA', '#FFFFFF'],
  'mvx:light-theme': ['#000000', '#A5A5A5', '#E2DEDC', '#F3EFED']
};

const LANGUAGE_LABELS: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español'
};

const NETWORK_LABELS: Record<Network, string> = {
  devnet: 'Devnet',
  testnet: 'Testnet',
  mainnet: 'Mainnet'
};

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const modalRef = useFocusTrap(isOpen);
  const clickOutsideRef = useRef<HTMLDivElement>(null);
  const { activeTheme, handleThemeSwitch } = useHandleThemeManagement();
  const { network } = useGetNetworkConfig();
  const { t, i18n } = useTranslation();

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    return saved || 'auto';
  });

  const [language, setLanguage] = useState<Language>(() => {
    return i18n.language as Language || 'fr';
  });

  const [selectedNetwork, setSelectedNetwork] = useState<Network>(() => {
    const saved = localStorage.getItem('selectedNetwork') as Network;
    return saved || 'devnet';
  });

  // États pour les menus déroulants
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // Fermer le modal en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clickOutsideRef.current && !clickOutsideRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Appliquer le thème
  useEffect(() => {
    const applyTheme = (mode: ThemeMode) => {
      if (mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const autoTheme = prefersDark ? 'mvx:dark-theme' : 'mvx:light-theme';
        document.documentElement.setAttribute('data-mvx-theme', autoTheme);
      } else {
        document.documentElement.setAttribute('data-mvx-theme', mode);
      }
    };

    applyTheme(themeMode);
    localStorage.setItem('themeMode', themeMode);

    // Écouter les changements de préférence système si Auto est sélectionné
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('auto');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [themeMode]);

  // Changer la langue
  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [language, i18n]);

  // Sauvegarder le réseau sélectionné
  useEffect(() => {
    localStorage.setItem('selectedNetwork', selectedNetwork);
    // TODO: Implémenter le changement de réseau
  }, [selectedNetwork]);

  const handleThemeChange = (newMode: ThemeMode) => {
    setThemeMode(newMode);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const handleNetworkChange = (newNetwork: Network) => {
    setSelectedNetwork(newNetwork);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-20 pr-4">
      <div
        ref={(el) => {
          (modalRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (clickOutsideRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        className="bg-secondary border-2 border-secondary vibe-border rounded-xl shadow-2xl p-6 w-80 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="settings-modal-title" className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Settings">⚙️</span>
            {t('settings.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary text-2xl leading-none transition-colors"
            aria-label={t('common.close')}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Sélecteur de thème (déroulant) */}
        <div className="mb-4">
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-primary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-all"
            type="button"
            aria-expanded={isThemeOpen}
            aria-controls="theme-options"
          >
            <div className="flex items-center gap-3">
              {themeMode === 'auto' ? (
                <span className="text-xl">🔄</span>
              ) : (
                <ThemeTooltipDots dotColors={THEME_DOT_COLORS[themeMode]} size="large" />
              )}
              <span className="font-semibold text-primary">
                {t('settings.theme.label')}: <span className="text-accent">{t(`settings.theme.${themeMode === 'auto' ? 'auto' : themeMode === 'mvx:dark-theme' ? 'dark' : themeMode === 'mvx:light-theme' ? 'light' : 'vibe'}`)}</span>
              </span>
            </div>
            <span className={`text-secondary transition-transform ${isThemeOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {isThemeOpen && (
            <div id="theme-options" className="mt-2 flex flex-col gap-2 pl-2">
              {/* Thèmes MultiversX */}
              {(['mvx:dark-theme', 'mvx:light-theme', 'mvx:vibe-theme'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    handleThemeChange(t);
                    setIsThemeOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-left flex items-center gap-3 text-sm ${
                    themeMode === t
                      ? 'bg-btn-primary text-btn-primary shadow-md'
                      : 'bg-primary text-secondary border border-secondary hover:bg-tertiary'
                  }`}
                  type="button"
                  role="radio"
                  aria-checked={themeMode === t}
                >
                  <ThemeTooltipDots dotColors={THEME_DOT_COLORS[t]} size="large" />
                  <span className="flex-1">{THEME_LABELS[t]}</span>
                  {themeMode === t && (
                    <span className="text-lg">✓</span>
                  )}
                </button>
              ))}

              {/* Mode Auto */}
              <button
                onClick={() => {
                  handleThemeChange('auto');
                  setIsThemeOpen(false);
                }}
                className={`px-3 py-2 rounded-lg font-medium transition-all text-left flex items-center gap-3 text-sm ${
                  themeMode === 'auto'
                    ? 'bg-btn-primary text-btn-primary shadow-md'
                    : 'bg-primary text-secondary border border-secondary hover:bg-tertiary'
                }`}
                type="button"
                role="radio"
                aria-checked={themeMode === 'auto'}
              >
                <span className="text-xl">🔄</span>
                <span className="flex-1">{THEME_LABELS['auto']}</span>
                {themeMode === 'auto' && (
                  <span className="text-lg">✓</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sélecteur de réseau (déroulant) */}
        <div className="mb-4">
          <button
            onClick={() => setIsNetworkOpen(!isNetworkOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-primary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-all"
            type="button"
            aria-expanded={isNetworkOpen}
            aria-controls="network-options"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {selectedNetwork === 'devnet' && '🔧'}
                {selectedNetwork === 'testnet' && '🧪'}
                {selectedNetwork === 'mainnet' && '🌐'}
              </span>
              <span className="font-semibold text-primary">
                {t('settings.network.label')}: <span className="text-accent">{t(`settings.network.${selectedNetwork}`)}</span>
              </span>
            </div>
            <span className={`text-secondary transition-transform ${isNetworkOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {isNetworkOpen && (
            <div id="network-options" className="mt-2 flex flex-col gap-2 pl-2">
              {(['devnet', 'testnet', 'mainnet'] as Network[]).map((net) => (
                <button
                  key={net}
                  onClick={() => {
                    handleNetworkChange(net);
                    setIsNetworkOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-left flex items-center gap-3 text-sm ${
                    selectedNetwork === net
                      ? 'bg-btn-primary text-btn-primary shadow-md'
                      : 'bg-primary text-secondary border border-secondary hover:bg-tertiary'
                  }`}
                  type="button"
                  role="radio"
                  aria-checked={selectedNetwork === net}
                >
                  <span className="text-xl">
                    {net === 'devnet' && '🔧'}
                    {net === 'testnet' && '🧪'}
                    {net === 'mainnet' && '🌐'}
                  </span>
                  <span className="flex-1">{NETWORK_LABELS[net]}</span>
                  {selectedNetwork === net && (
                    <span className="text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedNetwork !== network.id && (
            <p className="text-xs text-warning mt-2 px-2">
              {t('settings.network.reloadWarning')}
            </p>
          )}
        </div>

        {/* Sélecteur de langue (déroulant) */}
        <div>
          <button
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-primary border-2 border-secondary vibe-border rounded-lg hover:bg-tertiary transition-all"
            type="button"
            aria-expanded={isLanguageOpen}
            aria-controls="language-options"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {language === 'fr' && '🇫🇷'}
                {language === 'en' && '🇬🇧'}
                {language === 'es' && '🇪🇸'}
              </span>
              <span className="font-semibold text-primary">
                {t('settings.language.label')}: <span className="text-accent">{t(`settings.language.${language}`)}</span>
              </span>
            </div>
            <span className={`text-secondary transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {isLanguageOpen && (
            <div id="language-options" className="mt-2 flex flex-col gap-2 pl-2">
              {(['fr', 'en', 'es'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    handleLanguageChange(lang);
                    setIsLanguageOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-all text-left flex items-center gap-3 text-sm ${
                    language === lang
                      ? 'bg-btn-primary text-btn-primary shadow-md'
                      : 'bg-primary text-secondary border border-secondary hover:bg-tertiary'
                  }`}
                  type="button"
                  role="radio"
                  aria-checked={language === lang}
                >
                  <span className="text-xl">
                    {lang === 'fr' && '🇫🇷'}
                    {lang === 'en' && '🇬🇧'}
                    {lang === 'es' && '🇪🇸'}
                  </span>
                  <span className="flex-1">{LANGUAGE_LABELS[lang]}</span>
                  {language === lang && (
                    <span className="text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
