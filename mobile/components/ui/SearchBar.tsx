import { View, TextInput, Pressable } from "react-native";
import { Search, X } from "lucide-react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search products...",
  onSubmit,
}: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-2">
      <Search size={20} color="#7A7A8A" />
      <TextInput
        className="flex-1 text-foreground ml-3 text-base"
        style={{ fontFamily: "Outfit", fontSize: 16 }}
        placeholder={placeholder}
        placeholderTextColor="#7A7A8A"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")}>
          <X size={20} color="#7A7A8A" />
        </Pressable>
      )}
    </View>
  );
}
