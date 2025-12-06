import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TextStyle,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface appAdminSettingsProps {
  styleOfThePage: {
    container: StyleProp<ViewStyle>;
    header: StyleProp<ViewStyle>;
    icon: StyleProp<ImageStyle>;
    username: StyleProp<TextStyle>;
    role: StyleProp<TextStyle>;
    screen: StyleProp<ViewStyle>;
    text: StyleProp<TextStyle>;
  };
}

export default function AppAdminSettingsPage({
  styleOfThePage,
}: appAdminSettingsProps) {
  const [view, setView] = useState<"settings" | "account" | "changePassword">(
    "settings"
  );

  // Mocked user data
  const [username] = useState("admin_user");
  const [email] = useState("admin@example.com");
  const [address, setAddress] = useState("123 Admin St, City, Country");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  // Change-password form state (top level to obey Hooks rules)
  const [current] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  // Image picker state
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Load saved profile photo from AsyncStorage on mount
  useEffect(() => {
    const loadProfilePhoto = async () => {
      try {
        const savedPhoto = await AsyncStorage.getItem("userProfilePhoto");
        if (savedPhoto) {
          setImageUri(savedPhoto);
        }
      } catch (err) {
        console.error("Error loading profile photo:", err);
      }
    };
    loadProfilePhoto();
  }, []);

  const handleAddOrChangePhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Permission to access photos is required."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      // result may be { cancelled } or { canceled, assets } depending on SDK; handle both
      if (
        (result as any).canceled === false &&
        (result as any).assets &&
        (result as any).assets.length > 0
      ) {
        const pickedUri = (result as any).assets[0].uri;
        setImageUri(pickedUri);
        // Save to AsyncStorage for persistence
        await AsyncStorage.setItem("userProfilePhoto", pickedUri);
      } else if ((result as any).uri) {
        setImageUri((result as any).uri);
        await AsyncStorage.setItem("userProfilePhoto", (result as any).uri);
      }
    } catch (err) {
      console.error("Image pick error", err);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const handleRemovePhoto = async () => {
    setImageUri(null);
    await AsyncStorage.removeItem("userProfilePhoto");
  };

  // Account view
  if (view === "account") {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setView("settings")}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#333" />
            <Text style={styles.backText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.profileRight}>
            <Text style={styles.username}>{username}</Text>

            <View style={styles.photoButtonsRow}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={handleAddOrChangePhoto}
              >
                <Text style={styles.photoBtnText}>
                  {imageUri ? "Change Photo" : "Add Photo"}
                </Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity
                  style={[styles.photoBtn, styles.removeBtn]}
                  onPress={handleRemovePhoto}
                >
                  <Text style={[styles.photoBtnText, { color: "#fff" }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{username}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <Text style={styles.value}>
              {showPassword ? newPass || "(visible)" : "••••••••"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color="#333"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changePasswordInline}
            onPress={() => setView("changePassword")}
          >
            <Text style={styles.changePasswordText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() =>
            Alert.alert("Update", "Update Account Information (UI only)")
          }
        >
          <Text style={styles.updateBtnText}>Update Account Information</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Change password view
  if (view === "changePassword") {
    return (
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setView("settings")}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color="#333" />
            <Text style={styles.backText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <Text style={styles.label}>Current Password</Text>
          <View style={styles.passwordRow}>
            <Text style={styles.value}>
              {showCurrent ? current || "(Visible)" : "••••••••"}
            </Text>
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
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <View style={{ height: 20 }} />
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() =>
              Alert.alert("Change Password", "Change Password (UI only)")
            }
          >
            <Text style={styles.updateBtnText}>Change Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Default settings view (full-screen rows)
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styleOfThePage.text, { fontSize: 18, marginBottom: 12 }]}>
          Settings
        </Text>

        <TouchableOpacity style={styles.row} onPress={() => setView("account")}>
          <Text style={styles.rowLabel}>Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setView("changePassword")}
        >
          <Text style={styles.rowLabel}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
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
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  profileLeft: { marginRight: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  profileRight: { flex: 1 },
  username: { fontSize: 18, fontWeight: "700" },
  photoButtonsRow: { flexDirection: "row", marginTop: 8 },
  photoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    marginRight: 8,
  },
  removeBtn: { backgroundColor: "#ef4444" },
  photoBtnText: { color: "#2563eb", fontWeight: "600" },
  section: { marginBottom: 12 },
  label: { fontSize: 14, color: "#666", marginBottom: 6 },
  value: { fontSize: 16, color: "#111" },
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
  changePasswordInline: { marginTop: 8 },
  changePasswordText: { color: "#2563eb", fontWeight: "600" },
  updateBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  updateBtnText: { color: "#fff", fontWeight: "700" },
  row: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
});
