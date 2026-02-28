"use client";

import { X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItems, siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-72 bg-surface border-l border-border shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="VendFinder"
              width={28}
              height={28}
              className="rounded-sm"
            />
            <span className="text-lg font-bold text-foreground">{siteConfig.name}</span>
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-card hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/login"
            onClick={onClose}
            className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-primary border border-primary hover:bg-primary/10 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            onClick={onClose}
            className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
