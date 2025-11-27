import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n/config';
import './mobile-optimizations.css';
import * as serviceWorker from './serviceWorkerRegistration';
import { LanguageProvider } from './contexts/LanguageContext';
import { logger } from './utils/logger';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);

// Register service worker for mobile optimization
serviceWorker.register({
  onSuccess: () => {
    logger.info('App is ready for offline use');
  },
  onUpdate: () => {
    logger.info('New content available, please refresh');
  }
});

// Register mobile features
serviceWorker.registerInstallPrompt();
serviceWorker.registerOfflineDetection();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
