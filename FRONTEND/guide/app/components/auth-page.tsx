import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import LoginPage from "./login-page";
import SignUpPage from "./signup-page";

export default function AuthPage({
  onAuthSuccess,
}: {
  onAuthSuccess?: () => void;
}) {
  const [mode, setMode] = useState<"initial" | "login" | "signup">("initial");

  if (mode === "login") {
    return (
      <LoginPage onBack={() => setMode("initial")} onSuccess={onAuthSuccess} />
    );
  }

  if (mode === "signup") {
    return (
      <SignUpPage onBack={() => setMode("initial")} onSuccess={onAuthSuccess} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Get started with Guide</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => setMode("login")}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => setMode("signup")}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  loginButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  signupButtonText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 16,
  },
});
