import { View, TextInput, Text } from "react-native";
import { cn } from "@/lib/cn";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  numberOfLines?: number;
  icon?: React.ReactNode;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  multiline,
  numberOfLines,
  icon,
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text
          className="text-foreground text-sm mb-2"
          style={{ fontFamily: "Outfit-Medium" }}
        >
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center bg-surface border rounded-xl px-4",
          error ? "border-error" : "border-border"
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className={cn(
            "flex-1 text-foreground py-3",
            multiline && "min-h-[100px]"
          )}
          style={{ fontFamily: "Outfit", fontSize: 16 }}
          placeholder={placeholder}
          placeholderTextColor="#7A7A8A"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
      {error && (
        <Text className="text-error text-xs mt-1" style={{ fontFamily: "Outfit" }}>
          {error}
        </Text>
      )}
    </View>
  );
}
