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

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    try {
      const payload = {
        email: form.username,
        password: form.password,
      };

      const API_BASE = "http://localhost:5162/api/auth";

      const resp = await fetch(`${API_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Login failed:", resp.status, txt);
        Alert.alert("Error", "Invalid credentials");
        return;
      }

      const data = await resp.json();
      const token = data.token;
      if (!token) {
        Alert.alert("Error", "Login failed: no token returned");
        return;
      }

      // Save token
      await AsyncStorage.setItem("authToken", token);

      // Fetch user profile using the token
      const meResp = await fetch(`${API_BASE}/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meResp.ok) {
        const user = await meResp.json();
        await AsyncStorage.setItem("authUser", JSON.stringify(user));
      } else {
        console.warn("Failed to fetch /me after login", meResp.status);
      }

      Alert.alert("Success", "Logged in successfully");

      //needed to add this for the app admin view:
      await AsyncStorage.setItem("userRole","App Admin");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Login failed. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log In</Text>
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Username *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          value={form.username}
          onChangeText={(text) => handleInputChange("username", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          value={form.password}
          onChangeText={(text) => handleInputChange("password", text)}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Log In</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginTop: 20,
    marginBottom: 12,
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
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
