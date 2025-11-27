import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mascot } from './Mascot';
import './SplashScreen.css';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { t_nested } = useLanguage();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Duolingo standard: 3.5 seconds for proper branding and reading time
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Smooth fade out
      setTimeout(onFinish, 500);
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-circle">
          <div className="mascot-container">
            <Mascot size={130} mood="excited" />
          </div>
        </div>
      </div>
    </div>
  );
};

