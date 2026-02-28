"use client";

import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";
import { valueProps } from "@/data/site";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/MotionWrapper";

const iconMap: Record<string, React.ReactNode> = {
  Truck: <Truck size={22} />,
  Shield: <Shield size={22} />,
  RotateCcw: <RotateCcw size={22} />,
  Headphones: <Headphones size={22} />,
};

export default function ValueProps() {
  return (
    <section className="border-y border-border bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {valueProps.map((prop) => (
            <StaggerItem
              key={prop.title}
              className="flex items-center gap-3 text-center lg:text-left lg:flex-row flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                {iconMap[prop.icon]}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {prop.title}
                </p>
                <p className="text-xs text-muted">{prop.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
