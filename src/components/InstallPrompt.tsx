import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translationHelpers';
import { logger } from '../utils/logger';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const { t_nested } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show again for 7 days
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 5 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      logger.info('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay" onClick={handleDismiss}>
      <div className="install-prompt" onClick={(e) => e.stopPropagation()}>
        {/* iOS/Android drag handle */}
        <div className="install-drag-handle"></div>
        
        <div className="install-content">
          <div className="install-mascot">
            <img src="/images/mascot.png" alt="Theory.AI Mascot" className="mascot-image" />
          </div>
        
        <h3 className="install-title">{t_nested('install.title')}</h3>
        <p className="install-description">
          {t_nested('install.description')}
        </p>
        
        <div className="install-mobile-message">
          <p>{t_nested('install.mobileMessage')}</p>
        </div>
        
          <div className="install-actions">
            <button className="install-btn primary" onClick={handleInstall}>
              {getTranslation(t_nested, 'install.installNow', 'Install Now')}
            </button>
            <button className="install-btn secondary" onClick={handleDismiss}>
              {getTranslation(t_nested, 'install.maybeLater', 'Maybe Later')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

