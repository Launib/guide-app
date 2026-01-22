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
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ChangePasswordViewProps {
  onBack: () => void;
}

export default function ChangePasswordView({ onBack }: ChangePasswordViewProps) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleChangePassword = async () => {
    if (!current || !newPass || !confirm) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (newPass !== confirm) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/auth"
          : "http://localhost:5162/api/auth";

      const resp = await fetch(`${API_BASE}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newPass,
        }),
      });

      if (resp.ok) {
        Alert.alert("Success", "Password changed successfully");
        setCurrent("");
        setNewPass("");
        setConfirm("");
        onBack();
      } else {
        const txt = await resp.text();
        console.error("Password change failed:", resp.status, txt);
        Alert.alert("Error", txt || "Change failed");
      }
    } catch (err) {
      console.error("Password change error:", err);
      Alert.alert(
        "Error",
        `Change failed: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#333" />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        <Text style={styles.label}>Current Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry={!showCurrent}
            placeholder="Enter current password"
          />
          <TouchableOpacity
            onPress={() => setShowCurrent((s) => !s)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showCurrent ? "eye" : "eye-off"}
              size={20}
              color="#333"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          value={newPass}
          onChangeText={setNewPass}
          secureTextEntry
          placeholder="Enter new password"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="Confirm new password"
        />

        <View style={{ height: 20 }} />
        <TouchableOpacity style={styles.updateBtn} onPress={handleChangePassword}>
          <Text style={styles.updateBtnText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  headerRow: { padding: 12 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 8, fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  label: { fontSize: 14, color: "#666", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyeBtn: { padding: 8 },
  updateBtn: {
    backgroundColor: "#006400",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  updateBtnText: { color: "#fff", fontWeight: "700" },
});
