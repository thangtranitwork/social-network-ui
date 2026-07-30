import PWAManager from "@/components/ui-components/PWANotificationManager";
import "./globals.css";
import ThemeProvider from "@/providers/ThemeProvider";
import QueryProvider from "@/providers/QueryProvider";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";


export const metadata = {
  metadataBase: new URL('https://pocpoc.online'),
  title: { default: 'PocPoc', template: '%s | PocPoc' },
  description: 'Kết nối bạn bè, chia sẻ khoảnh khắc và trò chuyện thời gian thực.',
  keywords: ['mạng xã hội', 'chat', 'video call', 'kết bạn', 'pocpoc'],
  icons: { icon: '/pocpoc.png' },
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'PocPoc' },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: 'https://pocpoc.online',
    siteName: 'PocPoc',
    title: 'PocPoc - Kết nối không giới hạn',
    description: 'Kết nối bạn bè, chia sẻ khoảnh khắc và trò chuyện thời gian thực.',
    images: [{ url: '/pocpoc.png', width: 1200, height: 630, alt: 'PocPoc' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@PocPoc',
    images: ['/pocpoc.png'],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="PocPoc" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PocPoc" />
        <meta name="description" content="Mạng xã hội kết nối mọi người" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-167x167.png" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon-mask.svg" color="#000000" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* PWA Splash Screens (iOS) */}
        <link rel="apple-touch-startup-image" href="/splash-2048x2732.png" sizes="2048x2732" />
        <link rel="apple-touch-startup-image" href="/splash-1668x2224.png" sizes="1668x2224" />
        <link rel="apple-touch-startup-image" href="/splash-1536x2048.png" sizes="1536x2048" />
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png" sizes="1125x2436" />
        <link rel="apple-touch-startup-image" href="/splash-1242x2208.png" sizes="1242x2208" />
        <link rel="apple-touch-startup-image" href="/splash-750x1334.png" sizes="750x1334" />
        <link rel="apple-touch-startup-image" href="/splash-640x1136.png" sizes="640x1136" />
        
        <Script
          id="theme-switcher"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const theme = localStorage.getItem("theme");
                  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const resolved = theme === "dark" || (theme === "system" && systemDark);
                  if (resolved) {
                    document.documentElement.classList.add("dark");
                  } else {
                    document.documentElement.classList.remove("dark");
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
        
        {/* Firebase Messaging Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('serviceWorker' in navigator) {
                  // Clean up legacy sw.js if present
                  navigator.serviceWorker.getRegistration('/sw.js').then(function(oldReg) {
                    if (oldReg) {
                      oldReg.unregister();
                      console.log('🧹 Unregistered legacy sw.js');
                    }
                  });
                  // Register dedicated Firebase Service Worker
                  navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').then(function(existingReg) {
                    if (!existingReg) {
                      navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
                        .then(function(reg) {
                          console.log('🔥 Firebase Service Worker registered:', reg);
                        }).catch(function(err) {
                          console.error('❌ Firebase Service Worker registration failed:', err);
                        });
                    } else {
                      console.log('ℹ️ Firebase Service Worker already registered:', existingReg);
                    }
                  });
                }
              })();
            `
          }}
        />

      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <ThemeProvider>
              <PWAManager>
                {children}
              </PWAManager>
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}