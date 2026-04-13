import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomTabBar from '@/components/layout/BottomTabBar';
import CartDrawer from '@/components/cart/CartDrawer';
import ChatInitializer from '@/components/chat/ChatInitializer';
import SupportChatButton from '@/components/chat/SupportChatButton';
import CookieConsent from '@/components/CookieConsent';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import RouterErrorBoundary from '@/components/RouterErrorBoundary';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#0B0B0F',
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('title'),
    description: t('description'),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'VendFinder',
    },
    icons: { apple: '/logo.png' },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${playfair.variable} ${outfit.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <ChatInitializer />
              <Navbar />
              <main className="min-h-screen pb-[var(--tab-bar-height)]">
                <RouterErrorBoundary>{children}</RouterErrorBoundary>
              </main>
              <Footer />
              <CartDrawer />
              <SupportChatButton />
              <CookieConsent />
              <BottomTabBar />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
