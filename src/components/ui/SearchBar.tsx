"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search products...",
  className,
  onSubmit,
}: SearchBarProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn("relative", className)}
    >
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/40"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-foreground text-sm placeholder:text-muted/30 transition-all focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
      />
    </form>
  );
}
