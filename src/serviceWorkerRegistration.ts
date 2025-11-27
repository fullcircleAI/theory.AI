// 📱 Service Worker Registration for Mobile Optimization

import { logger } from './utils/logger';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          logger.debug('Service Worker: Ready in localhost');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      logger.debug('Service Worker: Registered successfully');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              logger.info('Service Worker: New content available');
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              logger.info('Service Worker: Content cached for offline use');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      logger.error('Service Worker: Registration failed', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      logger.warn('Service Worker: No internet connection found');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        logger.error('Service Worker: Unregistration failed', error);
      });
  }
}

// Install prompt for PWA
let deferredPrompt: any;

export function registerInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    logger.debug('PWA: Install prompt triggered');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
              logger.info('PWA: User accepted install');
            } else {
              logger.debug('PWA: User dismissed install');
            }
            deferredPrompt = null;
          });
        }
      });
    }
  });

  window.addEventListener('appinstalled', () => {
    logger.info('PWA: App installed successfully');
    deferredPrompt = null;
  });
}

// Offline detection
export function registerOfflineDetection() {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    const statusElement = document.getElementById('offline-status');
    
    if (statusElement) {
      if (isOnline) {
        statusElement.style.display = 'none';
        statusElement.textContent = '';
      } else {
        statusElement.style.display = 'block';
        statusElement.textContent = '📱 You are offline. Some features may be limited.';
      }
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

// Haptic feedback for mobile
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    
    navigator.vibrate(patterns[type]);
  }
}

// Touch feedback for buttons
export function addTouchFeedback(element: HTMLElement) {
  element.addEventListener('touchstart', () => {
    element.style.transform = 'scale(0.95)';
    triggerHapticFeedback('light');
  });
  
  element.addEventListener('touchend', () => {
    element.style.transform = 'scale(1)';
  });
  
  element.addEventListener('touchcancel', () => {
    element.style.transform = 'scale(1)';
  });
}

// Pull-to-refresh detection
export function registerPullToRefresh(callback: () => void) {
  let startY = 0;
  let currentY = 0;
  let isPulling = false;
  
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  });
  
  document.addEventListener('touchmove', (e) => {
    if (isPulling) {
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 100) {
        // Trigger pull-to-refresh
        callback();
        isPulling = false;
        triggerHapticFeedback('medium');
      }
    }
  });
  
  document.addEventListener('touchend', () => {
    isPulling = false;
  });
}