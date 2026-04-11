"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { totalItems, setDrawerOpen } = useCart();
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("tabBar");

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface/95 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[60px]">
        {/* Home */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            isActive("/") ? "text-primary" : "text-muted"
          )}
        >
          <House size={22} strokeWidth={isActive("/") ? 2.2 : 1.5} />
          <span className="text-[10px] font-medium">{t("home")}</span>
        </Link>

        {/* Browse */}
        <Link
          href="/products"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            isActive("/products") || isActive("/categories")
              ? "text-primary"
              : "text-muted"
          )}
        >
          <Search
            size={22}
            strokeWidth={
              isActive("/products") || isActive("/categories") ? 2.2 : 1.5
            }
          />
          <span className="text-[10px] font-medium">{t("browse")}</span>
        </Link>

        {/* Cart */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors cursor-pointer",
            "text-muted"
          )}
        >
          <div className="relative">
            <ShoppingCart size={22} strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-[18px] h-[18px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">{t("cart")}</span>
        </button>

        {/* Me */}
        <Link
          href={isAuthenticated ? "/dashboard" : "/login"}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            isActive("/dashboard") || isActive("/profile")
              ? "text-primary"
              : "text-muted"
          )}
        >
          {isAuthenticated && user?.avatar ? (
            <div
              className={cn(
                "w-6 h-6 rounded-full overflow-hidden border-2",
                isActive("/dashboard") || isActive("/profile")
                  ? "border-primary"
                  : "border-transparent"
              )}
            >
              <img
                src={user.avatar}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <User
              size={22}
              strokeWidth={
                isActive("/dashboard") || isActive("/profile") ? 2.2 : 1.5
              }
            />
          )}
          <span className="text-[10px] font-medium">{t("me")}</span>
        </Link>
      </div>
    </nav>
  );
}
