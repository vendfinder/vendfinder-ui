"use client";

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useFormattedPrice } from "@/hooks/useFormattedPrice";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function CartDrawer() {
  const {
    items,
    totalItems,
    totalPrice,
    drawerOpen,
    setDrawerOpen,
    removeItem,
    updateQuantity,
  } = useCart();
  const t = useTranslations();
  const formatPrice = useFormattedPrice();

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setDrawerOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {t("cart.title", { count: totalItems })}
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 text-muted hover:text-foreground cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag size={48} className="text-border mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              {t("cart.emptyTitle")}
            </p>
            <p className="text-sm text-muted mb-6">
              {t("cart.emptyDesc")}
            </p>
            <Button href="/products" onClick={() => setDrawerOpen(false)}>
              {t("common.startShopping")}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size || "default"}`}
                  className="flex gap-4 p-3 rounded-lg border border-border bg-card"
                >
                  <div className="w-20 h-20 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag size={24} className="text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {item.product.name}
                    </h3>
                    {item.size && (
                      <p className="text-xs text-muted mt-0.5">
                        {t("cart.size", {
                          size: item.product.category === "sneakers"
                            ? t("cart.sizeUS", { size: item.size })
                            : item.size,
                        })}
                      </p>
                    )}
                    <p className="text-sm font-bold text-primary mt-1">
                      {formatPrice(item.product.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity - 1,
                            item.size
                          )
                        }
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                            item.size
                          )
                        }
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.size)
                        }
                        className="ml-auto text-xs text-muted hover:text-error cursor-pointer"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t("cart.subtotal")}</span>
                <span className="font-semibold text-foreground">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <p className="text-xs text-muted">
                {t("cart.shippingNote")}
              </p>
              <Link
                href="/checkout"
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
              >
                {t("cart.checkout")}
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="block w-full text-center text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {t("common.continueShopping")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
