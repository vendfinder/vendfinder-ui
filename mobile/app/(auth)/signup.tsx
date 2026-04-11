import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, User, Mail, Lock } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();
  const haptics = useHaptics();

  const handleSignup = async () => {
    const newErrors: Record<string, string> = {};
    if (!name || name.length < 2) newErrors.name = "Name must be at least 2 characters";
    if (!email) newErrors.email = "Email is required";
    if (!password || password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords don't match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      haptics.error();
      return;
    }

    setLoading(true);
    const success = await signup(name, email, password);
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
              Get Started
            </Text>
            <Text
              className="text-foreground text-3xl"
              style={{ fontFamily: "PlayfairDisplay" }}
            >
              Create Account
            </Text>
          </View>

          <Input
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: "" })); }}
            error={errors.name}
            autoCapitalize="words"
            icon={<User size={20} color="#7A7A8A" />}
          />

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
            placeholder="At least 8 characters"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: "" })); }}
            error={errors.password}
            secureTextEntry
            icon={<Lock size={20} color="#7A7A8A" />}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: "" })); }}
            error={errors.confirmPassword}
            secureTextEntry
            icon={<Lock size={20} color="#7A7A8A" />}
          />

          <View className="mt-4">
            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View className="flex-row items-center justify-center mt-6 mb-8">
            <Text className="text-muted text-sm" style={{ fontFamily: "Outfit" }}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-primary text-sm" style={{ fontFamily: "Outfit-SemiBold" }}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
