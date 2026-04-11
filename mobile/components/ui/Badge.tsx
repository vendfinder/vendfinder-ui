import { View, Text } from "react-native";
import { cn } from "@/lib/cn";

interface BadgeProps {
  children: string;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const variantClasses = {
    default: "bg-surface",
    primary: "bg-primary-50",
    success: "bg-success/10",
    warning: "bg-warning/10",
    error: "bg-error/10",
  };

  const textClasses = {
    default: "text-muted",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
  };

  return (
    <View
      className={cn(
        "rounded-full",
        variantClasses[variant],
        size === "sm" ? "px-2 py-0.5" : "px-3 py-1"
      )}
    >
      <Text
        className={cn(textClasses[variant], size === "sm" ? "text-xs" : "text-sm")}
        style={{ fontFamily: "Outfit-Medium" }}
      >
        {children}
      </Text>
    </View>
  );
}
