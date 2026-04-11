import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const haptics = useHaptics();

  const [form, setForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    instagram: user?.socialLinks?.instagram || "",
    twitter: user?.socialLinks?.twitter || "",
    website: user?.socialLinks?.website || "",
  });

  const handleSave = async () => {
    haptics.success();
    await updateProfile({
      name: form.name,
      username: form.username,
      bio: form.bio,
      location: form.location,
      socialLinks: {
        instagram: form.instagram,
        twitter: form.twitter,
        website: form.website,
      },
    });
    Alert.alert("Success", "Profile updated successfully");
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-5 py-3 gap-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-card rounded-full items-center justify-center">
          <ArrowLeft size={20} color="#EEEAE4" />
        </Pressable>
        <Text className="text-foreground text-xl flex-1" style={{ fontFamily: "Outfit-Bold" }}>
          Edit Profile
        </Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View className="items-center my-6">
            <View className="w-24 h-24 bg-primary rounded-full items-center justify-center">
              <Text className="text-background text-3xl" style={{ fontFamily: "Outfit-Bold" }}>
                {form.name.charAt(0) || "U"}
              </Text>
            </View>
          </View>

          <Input label="Display Name" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} autoCapitalize="words" />
          <Input label="Username" value={form.username} onChangeText={(t) => setForm({ ...form, username: t })} />
          <Input label="Bio" value={form.bio} onChangeText={(t) => setForm({ ...form, bio: t })} multiline numberOfLines={3} autoCapitalize="sentences" />
          <Input label="Location" value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} autoCapitalize="words" />

          <Text className="text-foreground text-base mb-3 mt-2" style={{ fontFamily: "Outfit-SemiBold" }}>
            Social Links
          </Text>
          <Input label="Instagram" value={form.instagram} onChangeText={(t) => setForm({ ...form, instagram: t })} placeholder="username" />
          <Input label="Twitter" value={form.twitter} onChangeText={(t) => setForm({ ...form, twitter: t })} placeholder="username" />
          <Input label="Website" value={form.website} onChangeText={(t) => setForm({ ...form, website: t })} placeholder="https://" keyboardType="default" />

          <View className="mt-4 mb-8">
            <Button title="Save Changes" onPress={handleSave} fullWidth size="lg" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
