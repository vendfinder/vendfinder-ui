import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useHaptics } from "@/hooks/useHaptics";
import { categories } from "@vendfinder/shared";

const conditions = [
  { value: "new", label: "New / Deadstock" },
  { value: "used_like_new", label: "Used - Like New" },
  { value: "used_good", label: "Used - Good" },
  { value: "used_fair", label: "Used - Fair" },
];

export default function NewListingScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    condition: "new",
    size: "",
    askPrice: "",
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
      haptics.light();
    }
  };

  const handleSubmit = () => {
    haptics.success();
    Alert.alert("Listing Created", "Your listing has been submitted for review.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl flex-1" style={{ fontFamily: "Outfit-Bold" }}>
          New Listing
        </Text>
        <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
          Step {step}/3
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="flex-row px-5 gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <View key={s} className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-card"}`} />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <>
              <Text className="text-foreground text-lg mb-4" style={{ fontFamily: "Outfit-SemiBold" }}>
                Add Photos
              </Text>
              <View className="flex-row flex-wrap gap-3 mb-6">
                {images.map((uri, i) => (
                  <View key={i} className="w-[100px] h-[100px] bg-surface rounded-xl overflow-hidden">
                    <Pressable
                      onPress={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 z-10 w-6 h-6 bg-background/80 rounded-full items-center justify-center"
                    >
                      <X size={14} color="#EEEAE4" />
                    </Pressable>
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-2xl">📷</Text>
                    </View>
                  </View>
                ))}
                {images.length < 5 && (
                  <Pressable
                    onPress={pickImage}
                    className="w-[100px] h-[100px] bg-card border border-dashed border-border rounded-xl items-center justify-center"
                  >
                    <Camera size={24} color="#7A7A8A" />
                    <Text className="text-muted text-xs mt-1" style={{ fontFamily: "Outfit" }}>
                      Add Photo
                    </Text>
                  </Pressable>
                )}
              </View>

              <Input
                label="Product Name"
                placeholder="e.g., Air Jordan 4 Retro Bred"
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
                autoCapitalize="words"
              />
              <Input
                label="Description"
                placeholder="Describe the item condition, includes, etc."
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
              />

              <Button
                title="Next: Details"
                onPress={() => { haptics.light(); setStep(2); }}
                fullWidth
                size="lg"
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text className="text-foreground text-lg mb-4" style={{ fontFamily: "Outfit-SemiBold" }}>
                Item Details
              </Text>

              <Text className="text-foreground text-sm mb-2" style={{ fontFamily: "Outfit-Medium" }}>
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {categories.map((cat) => (
                  <Pressable
                    key={cat.slug}
                    onPress={() => {
                      haptics.selection();
                      setForm({ ...form, category: cat.slug });
                    }}
                    className={`px-4 py-2 rounded-xl border ${
                      form.category === cat.slug ? "bg-primary border-primary" : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={form.category === cat.slug ? "text-background text-sm" : "text-foreground text-sm"}
                      style={{ fontFamily: "Outfit-Medium" }}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-foreground text-sm mb-2" style={{ fontFamily: "Outfit-Medium" }}>
                Condition
              </Text>
              <View className="gap-2 mb-4">
                {conditions.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => {
                      haptics.selection();
                      setForm({ ...form, condition: c.value });
                    }}
                    className={`px-4 py-3 rounded-xl border ${
                      form.condition === c.value ? "bg-primary border-primary" : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={form.condition === c.value ? "text-background" : "text-foreground"}
                      style={{ fontFamily: "Outfit-Medium", fontSize: 14 }}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Size (optional)"
                placeholder="e.g., US 10, L, One Size"
                value={form.size}
                onChangeText={(t) => setForm({ ...form, size: t })}
              />

              <View className="flex-row gap-3 mt-2">
                <View className="flex-1">
                  <Button title="Back" onPress={() => setStep(1)} variant="secondary" fullWidth />
                </View>
                <View className="flex-1">
                  <Button title="Next: Pricing" onPress={() => { haptics.light(); setStep(3); }} fullWidth />
                </View>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text className="text-foreground text-lg mb-4" style={{ fontFamily: "Outfit-SemiBold" }}>
                Set Your Price
              </Text>

              <Input
                label="Ask Price ($)"
                placeholder="0.00"
                value={form.askPrice}
                onChangeText={(t) => setForm({ ...form, askPrice: t })}
                keyboardType="numeric"
              />

              <View className="bg-card rounded-2xl p-4 mb-6">
                <Text className="text-muted text-sm mb-2" style={{ fontFamily: "Outfit" }}>
                  Fee Breakdown
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Seller Fee (9%)</Text>
                  <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit" }}>
                    -${(Number(form.askPrice || 0) * 0.09).toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>Processing</Text>
                  <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit" }}>
                    -$3.00
                  </Text>
                </View>
                <View className="flex-row justify-between pt-2 border-t border-border mt-2">
                  <Text className="text-foreground text-sm" style={{ fontFamily: "Outfit-SemiBold" }}>You Earn</Text>
                  <Text className="text-success text-base" style={{ fontFamily: "Outfit-Bold" }}>
                    ${(Number(form.askPrice || 0) * 0.91 - 3).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button title="Back" onPress={() => setStep(2)} variant="secondary" fullWidth />
                </View>
                <View className="flex-1">
                  <Button title="Submit Listing" onPress={handleSubmit} fullWidth />
                </View>
              </View>
            </>
          )}

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
