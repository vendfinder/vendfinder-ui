import { View, Pressable } from "react-native";
import { cn } from "@/lib/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

export function Card({ children, className, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn("bg-card rounded-2xl overflow-hidden active:bg-card-hover", className)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cn("bg-card rounded-2xl overflow-hidden", className)}>
      {children}
    </View>
  );
}
