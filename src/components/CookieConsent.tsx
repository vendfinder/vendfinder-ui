"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Cookie, Check, X } from "lucide-react";
import { hasConsented, acceptAll, rejectOptional, setConsent } from "@/lib/cookie-consent";

type Categories = { functional: boolean; analytics: boolean; marketing: boolean };

export default function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState<Categories>({
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    setOpen(!hasConsented());
  }, []);

  const handleAcceptAll = () => {
    acceptAll();
    setOpen(false);
  };

  const handleRejectOptional = () => {
    rejectOptional();
    setOpen(false);
  };

  const handleSaveCustom = () => {
    setConsent(categories);
    setOpen(false);
  };

  if (!mounted || !open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-[440px] z-[90]"
      >
        <div className="bg-card border border-white/[0.08] rounded-2xl p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Cookie size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground mb-1">{t("title")}</h3>
              <p className="text-[12px] text-muted leading-relaxed">
                {t("description")}{" "}
                <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                  {t("learnMore")}
                </Link>
              </p>
            </div>
          </div>

          {!expanded ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[13px] font-bold transition-colors"
                >
                  {t("acceptAll")}
                </button>
                <button
                  onClick={handleRejectOptional}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-border-hover text-foreground text-[13px] font-semibold transition-colors"
                >
                  {t("rejectOptional")}
                </button>
              </div>
              <button
                onClick={() => setExpanded(true)}
                className="text-[11px] text-muted hover:text-foreground transition-colors text-center py-1"
              >
                {t("customize")}
              </button>
            </div>
          ) : (
            <div>
              <div className="space-y-2 mb-4">
                <CategoryRow label={t("categoryNecessary")} desc={t("categoryNecessaryDesc")} checked={true} disabled alwaysOnLabel={t("alwaysOn")} />
                <CategoryRow
                  label={t("categoryFunctional")}
                  desc={t("categoryFunctionalDesc")}
                  checked={categories.functional}
                  onChange={(v) => setCategories({ ...categories, functional: v })}
                />
                <CategoryRow
                  label={t("categoryAnalytics")}
                  desc={t("categoryAnalyticsDesc")}
                  checked={categories.analytics}
                  onChange={(v) => setCategories({ ...categories, analytics: v })}
                />
                <CategoryRow
                  label={t("categoryMarketing")}
                  desc={t("categoryMarketingDesc")}
                  checked={categories.marketing}
                  onChange={(v) => setCategories({ ...categories, marketing: v })}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCustom}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[13px] font-bold transition-colors"
                >
                  {t("savePreferences")}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface border border-border hover:border-border-hover text-muted hover:text-foreground text-[13px] transition-colors"
                >
                  {t("backToOptions")}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CategoryRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
  alwaysOnLabel,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  alwaysOnLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border bg-surface/40">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted mt-0.5 leading-relaxed">{desc}</p>
      </div>
      {disabled ? (
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md shrink-0">
          {alwaysOnLabel}
        </span>
      ) : (
        <button
          onClick={() => onChange?.(!checked)}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
            checked ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all flex items-center justify-center ${
              checked ? "left-[18px]" : "left-0.5"
            }`}
          >
            {checked ? <Check size={10} className="text-primary" /> : <X size={10} className="text-muted" />}
          </span>
        </button>
      )}
    </div>
  );
}
