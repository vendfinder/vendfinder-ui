"use client";

import { BadgeCheck, Lock, ShieldCheck, Headphones } from "lucide-react";
import { valuePropKeys } from "@/data/site";
import { useTranslations } from "next-intl";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionWrapper";

const iconMap: Record<string, React.ReactNode> = {
  BadgeCheck: <BadgeCheck size={22} />,
  Lock: <Lock size={22} />,
  ShieldCheck: <ShieldCheck size={22} />,
  Headphones: <Headphones size={22} />,
};

export default function ValueProps() {
  const t = useTranslations("valueProps");

  return (
    <section className="border-y border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {valuePropKeys.map((prop) => (
            <StaggerItem
              key={prop.titleKey}
              className="flex items-center gap-3 text-center lg:text-left lg:flex-row flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                {iconMap[prop.icon]}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t(prop.titleKey)}
                </p>
                <p className="text-xs text-muted">{t(prop.descKey)}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
