import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Mail, Lock } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const haptics = useHaptics();

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (password && password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      haptics.error();
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      haptics.success();
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row justify-end pt-4">
            <Pressable onPress={() => router.back()} className="p-2">
              <X size={24} color="#EEEAE4" />
            </Pressable>
          </View>

          <View className="mt-8 mb-8">
            <Text
              className="text-primary text-sm tracking-widest uppercase mb-2"
              style={{ fontFamily: "Outfit-SemiBold" }}
            >
              Welcome Back
            </Text>
            <Text
              className="text-foreground text-3xl"
              style={{ fontFamily: "PlayfairDisplay" }}
            >
              Sign In
            </Text>
          </View>

          <Input
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: "" })); }}
            error={errors.email}
            keyboardType="email-address"
            icon={<Mail size={20} color="#7A7A8A" />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: "" })); }}
            error={errors.password}
            secureTextEntry
            icon={<Lock size={20} color="#7A7A8A" />}
          />

          <View className="mt-4">
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View className="flex-row items-center justify-center mt-6">
            <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
              Don't have an account?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/signup")}>
              <Text className="text-primary text-sm" style={{ fontFamily: "Outfit-SemiBold" }}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
