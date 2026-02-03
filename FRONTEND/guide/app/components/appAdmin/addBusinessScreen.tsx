import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { formatPhoneNumber } from "../../utils/phoneFormatter";

interface AddBusinessScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export default function AddBusinessScreen({
  onBack,
  onSuccess,
}: AddBusinessScreenProps) {
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddBusiness = async () => {
    if (!name || !licenseNumber || !phoneNumber || !address) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert(
          "Error",
          "No authentication token found. Please log in again."
        );
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      console.log("Creating business with data:", {
        name,
        licenseNumber,
        phoneNumber,
        address,
      });

      const resp = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          licenseNumber,
          phoneNumber,
          address,
        }),
      });

      console.log("Business creation response status:", resp.status);

      if (resp.ok) {
        const businessData = await resp.json();
        console.log("Business created successfully:", businessData);
        setSubmitted(true);

        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000); // Give user time to see success message
        }
      } else {
        const txt = await resp.text();
        console.error("Failed to create business:", resp.status, txt);
        Alert.alert("Error", txt || "Failed to add business");
      }
    } catch (err) {
      console.error("Error creating business:", err);
      Alert.alert(
        "Error",
        `Failed to add business: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#333" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          <Text style={styles.successTitle}>Business Request Sent</Text>
          <Text style={styles.successText}>
            Your business request has been submitted and is currently pending
            approval from an administrator.
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Status: Pending</Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={onBack}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#333" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Add a Business</Text>

      <Text style={styles.explanation}>
        To add a business to your account, please fill in the details below.
        Your request will be reviewed by an administrator.
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter business name"
          editable={!isLoading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>License Number *</Text>
        <TextInput
          style={styles.input}
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          placeholder="Enter license number"
          editable={!isLoading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          editable={!isLoading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter address"
          multiline
          numberOfLines={3}
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={[styles.addButton, isLoading && styles.addButtonDisabled]}
        onPress={handleAddBusiness}
        disabled={isLoading}
      >
        <Text style={styles.addButtonText}>
          {isLoading ? "Adding Business..." : "Add Business"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  headerRow: { padding: 12, marginBottom: 8 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 8, fontSize: 16, color: "#333" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  explanation: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  section: { marginBottom: 16 },
  label: { fontSize: 14, color: "#666", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#006400",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 60,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    lineHeight: 24,
  },
  statusBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: { fontSize: 16, fontWeight: "600", color: "#f59e0b" },
  doneButton: {
    backgroundColor: "#006400",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 32,
  },
  doneButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
