import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './OfflineIndicator.css';

export const OfflineIndicator: React.FC = () => {
  const { t_nested } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      // Use requestAnimationFrame to batch state updates
      requestAnimationFrame(() => {
        setIsOnline(true);
        setShowIndicator(true);
      });
      
      // Hide "Back online" message after 3 seconds
      setTimeout(() => {
        requestAnimationFrame(() => {
          setShowIndicator(false);
        });
      }, 3000);
    };

    const handleOffline = () => {
      requestAnimationFrame(() => {
        setIsOnline(false);
        setShowIndicator(true);
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show indicator on mount if offline
    if (!navigator.onLine) {
      requestAnimationFrame(() => {
        setShowIndicator(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      <div className="offline-content">
        <span className="offline-icon">
          {isOnline ? '✅' : '📡'}
        </span>
        <div className="offline-text">
          <strong>{isOnline ? t_nested('offline.backOnline') : t_nested('offline.noInternetConnection')}</strong>
          <span className="offline-subtext">
            {isOnline 
              ? t_nested('offline.dataWillSync')
              : t_nested('offline.canPracticeOffline')}
          </span>
        </div>
      </div>
    </div>
  );
};

