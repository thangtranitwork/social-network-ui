// components/PWAManager.js - Simple wrapper component
"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function PWAManager({ children }) {
  const t = useTranslations('common.pwa');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Check online status
    setIsOnline(navigator.onLine);

    // Setup event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup service worker listeners
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      checkForSWUpdate();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  // Handle service worker messages
  const handleSWMessage = (event) => {
    const { type, action, data } = event.data;

    if (type === 'NOTIFICATION_ACTION') {
      handleNotificationAction(action, data);
    }
  };

  // Handle notification actions
  const handleNotificationAction = (action, data) => {
    switch (action) {
      case 'reply':
        if (data.chatId) {
          window.location.href = `/chat/${data.chatId}`;
        }
        break;
      
      case 'answer':
        if (data.callId) {
          window.location.href = `/call/${data.callId}`;
        }
        break;
      
      case 'decline':
        console.log('Call declined:', data.callId);
        break;
      
      case 'view':
        if (data.url) {
          window.location.href = data.url;
        }
        break;
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Show success notification
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(t('permissionTitle'), {
              body: t('permissionBody'),
              icon: '/pocpoc.png',
              tag: 'permission-granted'
            });
          });
        }
      }
    }
  };

  // Check for service worker updates
  const checkForSWUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      }
    }
  };

  // Update app
  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Test notification function
  const sendTestNotification = () => {
    if ('serviceWorker' in navigator && notificationPermission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        // Test message notification
        registration.showNotification(t('testTitle'), {
          body: t('testBody'),
          icon: '/pocpoc.png',
          badge: '/pocpoc.png',
          tag: 'test-message',
          data: { 
            type: 'message',
            chatId: '123',
            sender: 'Test User',
            message: 'Hello from PWA!'
          },
          requireInteraction: true,
          actions: [
            { action: 'reply', title: t('reply') },
            { action: 'view', title: t('view') }
          ]
        });
      });
    }
  };

  return (
    <>
      {/* Main app content */}
      {children}

      {/* <div className="fixed bottom-4 right-4 z-50">
        {notificationPermission === 'default' && (
          <div className="bg-blue-500 text-white p-1 rounded-lg mb-2 max-w-sm shadow-lg">
            <p className="text-sm mb-2">
              {t('permissionPrompt')}
            </p>
            <button
              onClick={requestNotificationPermission}
              className="bg-white text-blue-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
            >
              {t('allow')}
            </button>
          </div>
        )}
        {updateAvailable && (
          <div className="bg-green-500 text-white p-3 rounded-lg mb-2 shadow-lg">
            <p className="text-sm mb-2">{t('updateAvailable')}</p>
            <button
              onClick={updateApp}
              className="bg-white text-green-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
            >
              {t('updateNow')}
            </button>
          </div>
        )}
      </div> */}
    </>
  );
}