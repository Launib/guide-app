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
    password: ""
  });

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.username ||
      !form.password
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      // TODO: Call login API with form data
      console.log("Login form submitted:", form);

      // For now, simulate successful login by storing a token
      await AsyncStorage.setItem("userToken", form.username);
      Alert.alert("Success", "Logged in successfully");

      // Trigger the success callback to navigate to main app
      onSuccess?.();
    } catch {
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

        {/* <Text style={styles.sectionTitle}>Address Information</Text>

        <Text style={styles.label}>Street Address *</Text> */}
        {/* <TextInput
          style={styles.input}
          placeholder="Enter street address"
          value={form.street}
          onChangeText={(text) => handleInputChange("street", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Apt Number (if applicable)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter apartment number"
          value={form.apt}
          onChangeText={(text) => handleInputChange("apt", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Zip Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter zip code"
          value={form.zipCode}
          onChangeText={(text) => handleInputChange("zipCode", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>State *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter state"
          value={form.state}
          onChangeText={(text) => handleInputChange("state", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter city"
          value={form.city}
          onChangeText={(text) => handleInputChange("city", text)}
          placeholderTextColor="#999"
        /> */}

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
