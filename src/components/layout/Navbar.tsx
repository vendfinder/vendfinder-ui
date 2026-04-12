'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Menu, Search, MessageCircle } from 'lucide-react';
import { navItemHrefs } from '@/data/site';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useTotalUnread } from '@/stores/chat';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import MobileMenu from './MobileMenu';
import ChatInboxDrawer from '@/components/chat/ChatInboxDrawer';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, setDrawerOpen } = useCart();
  const { isAuthenticated, user } = useAuth();
  const totalUnread = useTotalUnread();
  const t = useTranslations();

  return (
    <>
      <header className="sticky top-0 z-40 bg-dark/70 backdrop-blur-xl border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt={t('common.appName')}
                width={36}
                height={36}
                className="rounded-md transition-transform group-hover:scale-105"
              />
              <span className="text-lg font-bold text-foreground tracking-tight">
                {t('common.appName')}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItemHrefs.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-primary bg-primary-50'
                      : 'text-muted hover:text-foreground hover:bg-surface'
                  )}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/products"
                className="p-2 text-muted hover:text-primary transition-colors lg:hidden"
              >
                <Search size={20} />
              </Link>

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setChatDrawerOpen(true)}
                    className="relative p-2 text-muted hover:text-primary transition-colors cursor-pointer"
                  >
                    <MessageCircle size={20} />
                    {totalUnread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-dark" />
                    )}
                  </button>
                  <Link
                    href="/dashboard"
                    className="p-2 text-muted hover:text-primary transition-colors"
                  >
                    {user?.avatar ? (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/60">
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <User size={20} />
                    )}
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  {t('nav.logIn')}
                </Link>
              )}

              {!isAuthenticated && (
                <Link
                  href="/signup"
                  className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                >
                  {t('nav.signUp')}
                </Link>
              )}

              <button
                onClick={() => setDrawerOpen(true)}
                className="relative p-2 text-muted hover:text-primary transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 text-muted hover:text-foreground transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <ChatInboxDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
      />
    </>
  );
}
