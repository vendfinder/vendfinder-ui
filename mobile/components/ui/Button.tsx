import { Pressable, Text, ActivityIndicator } from "react-native";
import { cn } from "@/lib/cn";
import { useHaptics } from "@/hooks/useHaptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  const baseClasses = "flex-row items-center justify-center rounded-xl";

  const variantClasses = {
    primary: "bg-primary active:bg-primary-dark",
    secondary: "bg-card active:bg-card-hover",
    outline: "border border-border active:border-primary",
    ghost: "active:bg-card",
    danger: "bg-error active:bg-accent-dark",
  };

  const sizeClasses = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4",
  };

  const textVariantClasses = {
    primary: "text-background font-semibold",
    secondary: "text-foreground font-medium",
    outline: "text-foreground font-medium",
    ghost: "text-foreground font-medium",
    danger: "text-white font-semibold",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        (disabled || loading) && "opacity-50"
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#0B0B0F" : "#EEEAE4"}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            className={cn(
              textVariantClasses[variant],
              textSizeClasses[size],
              icon && "ml-2"
            )}
            style={{ fontFamily: "Outfit-SemiBold" }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
