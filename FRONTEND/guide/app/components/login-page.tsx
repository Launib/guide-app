import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    // DEV shortcut: simulate successful login when running in development
    if (typeof __DEV__ !== "undefined" && __DEV__ && form.username === "dev") {
      const fakeToken = "dev-token";
      const fakeUser = {
        id: "dev-user",
        email: form.username,
        userName: form.username,
        firstName: "Dev",
        lastName: "User",
        roles: ["Admin"],
      };
      await AsyncStorage.setItem("authToken", fakeToken);
      await AsyncStorage.setItem("userToken", fakeToken);
      await AsyncStorage.setItem("authUser", JSON.stringify(fakeUser));
      await AsyncStorage.setItem("username", form.username);
      await AsyncStorage.setItem("userRole", "Admin");
      Alert.alert("Dev", "Simulated login as App Admin (dev mode).");
      onSuccess?.();
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        email: form.username,
        password: form.password,
      };

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/auth"
          : "http://localhost:5162/api/auth";

      console.log("Attempting login for:", form.username);

      const resp = await fetch(`${API_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Login response status:", resp.status);

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Login failed:", resp.status, txt);
        Alert.alert(
          "Error",
          "Invalid credentials. Please check your email and password."
        );
        return;
      }

      const data = await resp.json();
      console.log("Login response data:", { ...data, token: "[REDACTED]" });

      const token = data.token;
      const user = data.user;

      if (!token) {
        Alert.alert("Error", "Login failed: no token returned");
        return;
      }

      // Save token
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userToken", token);

      // Save user data
      if (user) {
        await AsyncStorage.setItem("authUser", JSON.stringify(user));
        await AsyncStorage.setItem("username", user.username || form.username);

        // Save role
        if (user.roles && user.roles.length > 0) {
          await AsyncStorage.setItem("userRole", user.roles[0]);
          console.log("Saved user role:", user.roles[0]);
        }

        // Save profile photo if available
        if (user.profilePicture) {
          const imageDataUri = `data:image/jpeg;base64,${user.profilePicture}`;
          await AsyncStorage.setItem("userProfilePhoto", imageDataUri);
        }
      }

      console.log("Login successful, calling onSuccess");
      Alert.alert("Success", "Logged in successfully");
      onSuccess?.();
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert(
        "Error",
        `Login failed: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} disabled={isLoading}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log In</Text>
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          value={form.username}
          onChangeText={(text) => handleInputChange("username", text)}
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={form.password}
          onChangeText={(text) => handleInputChange("password", text)}
          secureTextEntry
          placeholderTextColor="#999"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    color: "#0066cc",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  submitButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
