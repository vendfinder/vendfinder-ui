"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Menu, Search } from "lucide-react";
import { navItems, siteConfig } from "@/data/site";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, setDrawerOpen } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 bg-dark/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="VendFinder"
                width={36}
                height={36}
                className="rounded-md transition-transform group-hover:scale-105"
              />
              <span className="text-lg font-bold text-foreground tracking-tight">
                {siteConfig.name}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "text-primary bg-primary-50"
                      : "text-muted hover:text-foreground hover:bg-surface"
                  )}
                >
                  {item.label}
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
                <Link
                  href="/dashboard"
                  className="p-2 text-muted hover:text-primary transition-colors"
                >
                  <User size={20} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Log In
                </Link>
              )}

              {!isAuthenticated && (
                <Link
                  href="/signup"
                  className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                >
                  Sign Up
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
    </>
  );
}
