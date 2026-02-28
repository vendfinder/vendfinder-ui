"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  ShoppingBag,
  Heart,
  Briefcase,
  Wallet,
  Settings,
  LogOut,
  User,
  Plus,
  Star,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sellerStats } from "@/data/seller";
import { cn } from "@/lib/utils";

const sidebarSections = [
  {
    label: "Dashboard",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/profile", label: "My Profile", icon: User },
    ],
  },
  {
    label: "Selling",
    items: [
      { href: "/dashboard/selling", label: "Selling", icon: Tag },
      { href: "/dashboard/listings/new", label: "New Listing", icon: Plus },
      { href: "/dashboard/payouts", label: "Payouts", icon: Wallet },
    ],
  },
  {
    label: "Buying",
    items: [
      { href: "/dashboard/buying", label: "Buying", icon: ShoppingBag },
      { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
      { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="space-y-1">
      {/* Profile card */}
      <Link
        href={`/profile/${user?.username || "me"}`}
        className="block px-4 py-4 mb-4 rounded-2xl bg-gradient-to-br from-primary/[0.08] to-violet-500/[0.04] border border-primary/15 hover:border-primary/30 transition-all group relative overflow-hidden"
      >
        {/* Subtle shimmer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(232,136,58,0.06),transparent_60%)] pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary font-bold text-sm shadow-[0_0_15px_rgba(232,136,58,0.1)]">
              {user?.name?.charAt(0) || "?"}
            </div>
            {user?.verified && (
              <CheckCircle2
                size={12}
                className="absolute -bottom-0.5 -right-0.5 text-primary fill-primary bg-background rounded-full"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {user?.name}
            </p>
            <p className="text-[11px] text-muted truncate">@{user?.username || "user"}</p>
          </div>
          <ChevronRight
            size={14}
            className="text-muted/40 group-hover:text-primary/60 transition-colors shrink-0"
          />
        </div>

        {/* Mini stats */}
        <div className="relative flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-1">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[11px] font-semibold text-foreground">{sellerStats.sellerRating}</span>
          </div>
          <div className="w-px h-3 bg-white/[0.06]" />
          <span className="text-[11px] text-muted">
            <span className="font-semibold text-foreground">{sellerStats.totalSales}</span> sales
          </span>
          <div className="w-px h-3 bg-white/[0.06]" />
          <span className="text-[11px] text-muted">
            Lvl <span className="font-semibold text-primary">{user?.sellerLevel || 1}</span>
          </span>
        </div>
      </Link>

      {/* Navigation sections */}
      {sidebarSections.map((section) => (
        <div key={section.label} className="pt-4 first:pt-0">
          <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/50">
            {section.label}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all relative group",
                  isActive
                    ? "bg-primary/[0.1] text-primary"
                    : "text-muted hover:bg-surface/80 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
                )}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-transparent text-muted group-hover:bg-surface group-hover:text-foreground"
                  )}
                >
                  <Icon size={16} />
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Logout */}
      <div className="pt-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-muted hover:bg-red-500/[0.08] hover:text-error transition-all w-full group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
            <LogOut size={16} />
          </div>
          Log Out
        </button>
      </div>
    </nav>
  );
}
