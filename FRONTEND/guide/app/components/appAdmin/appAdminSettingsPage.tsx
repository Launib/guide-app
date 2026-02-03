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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AddBusinessScreen from "./addBusinessScreen";
import { formatPhoneNumber } from "../../utils/phoneFormatter";

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
  onAccountDeleted?: () => void;
}

export default function AppAdminSettingsPage({
  styleOfThePage,
  onAccountDeleted,
}: appAdminSettingsProps) {
  const [view, setView] = useState<
    "settings" | "account" | "changePassword" | "addBusiness"
  >("settings");

  // User data states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");

  // Original data for cancel
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalAddress, setOriginalAddress] = useState("");
  const [originalFullName, setOriginalFullName] = useState("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalLocation, setOriginalLocation] = useState("");

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);

  // Change-password form state
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  // Image picker state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from backend
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        console.error("No auth token found");
        Alert.alert(
          "Error",
          "No authentication token found. Please log in again."
        );
        setIsLoading(false);
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/auth"
          : "http://localhost:5162/api/auth";

      const resp = await fetch(`${API_BASE}/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (resp.ok) {
        const data = await resp.json();

        // Set user data from backend
        setUsername(data.username || "");
        setEmail(data.userEmail || "");
        setAddress(data.address || "");
        setFullName(data.fullName || "");
        setPhoneNumber(data.phoneNumber || "");
        setLocation(data.location || "");

        // Store original values for cancel functionality
        setOriginalUsername(data.username || "");
        setOriginalEmail(data.userEmail || "");
        setOriginalAddress(data.address || "");
        setOriginalFullName(data.fullName || "");
        setOriginalPhoneNumber(data.phoneNumber || "");
        setOriginalLocation(data.location || "");

        // Handle profile picture
        if (data.profilePicture) {
          const base64Image = data.profilePicture;
          setImageBase64(base64Image);
          const imageDataUri = `data:image/jpeg;base64,${base64Image}`;
          setImageUri(imageDataUri);
          // Save to AsyncStorage for header display
          await AsyncStorage.setItem("userProfilePhoto", imageDataUri);
        } else {
          setImageUri(null);
          setImageBase64(null);
        }
      } else {
        const errorText = await resp.text();
        console.error(
          "Failed to load user data. Status:",
          resp.status,
          "Error:",
          errorText
        );
        Alert.alert(
          "Error",
          `Failed to load user data: ${errorText || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      Alert.alert(
        "Error",
        `Failed to load user data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when returning to account view
  useEffect(() => {
    if (view === "account") {
      loadUserData();
    }
  }, [view]);

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
        base64: true, // Request base64 directly from ImagePicker
      });

      if (
        (result as any).canceled === false &&
        (result as any).assets &&
        (result as any).assets.length > 0
      ) {
        const pickedUri = (result as any).assets[0].uri;
        const base64 = (result as any).assets[0].base64;

        setImageUri(pickedUri);
        setImageBase64(base64);
      } else if ((result as any).uri) {
        const pickedUri = (result as any).uri;
        const base64 = (result as any).base64;

        setImageUri(pickedUri);
        setImageBase64(base64);
      }
    } catch (err) {
      console.error("Image pick error", err);
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const handleRemovePhoto = async () => {
    setImageUri(null);
    setImageBase64(null);
  };

  const performDelete = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "No authentication token found. Please log in again.");
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/auth"
          : "http://localhost:5162/api/auth";

      const resp = await fetch(`${API_BASE}/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (resp.ok) {
        if (Platform.OS === "web") {
          window.alert("Your account has been successfully deleted.");
          onAccountDeleted?.();
        } else {
          Alert.alert(
            "Account Deleted",
            "Your account has been successfully deleted.",
            [
              {
                text: "OK",
                onPress: () => {
                  onAccountDeleted?.();
                },
              },
            ]
          );
        }
      } else {
        const txt = await resp.text();
        if (resp.status === 401) {
          if (Platform.OS === "web") {
            if (window.confirm("Your session has expired. Would you like to log out and try again?")) {
              onAccountDeleted?.();
            }
          } else {
            Alert.alert(
              "Session Expired",
              "Your session has expired. Please log out and log in again.",
              [
                {
                  text: "Log Out",
                  onPress: () => onAccountDeleted?.(),
                },
                {
                  text: "Cancel",
                  style: "cancel",
                },
              ]
            );
          }
        } else {
          Alert.alert("Error", txt || "Failed to delete account");
        }
      }
    } catch (err) {
      Alert.alert(
        "Error",
        `Failed to delete account: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Are you sure you want to permanently delete your account? This action cannot be undone."
        )
      ) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Account",
        "Are you sure you want to permanently delete your account? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: performDelete,
          },
        ]
      );
    }
  };

  // Account view
  if (view === "account") {
    if (isLoading) {
      return (
        <View
          style={[
            styles.screen,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text>Loading...</Text>
        </View>
      );
    }

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

        <View style={styles.profileSection}>
          <Text style={styles.username}>{username || "No username"}</Text>
          <View style={styles.avatarContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color="#fff" />
              </View>
            )}
          </View>
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

        <View style={styles.section}>
          <Text style={styles.label}>Username</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
            />
          ) : (
            <Text style={styles.value}>{username || "Not set"}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Full Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter full name"
            />
          ) : (
            <Text style={styles.value}>{fullName || "Not set"}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{email || "Not set"}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Phone Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{phoneNumber || "Not set"}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
            />
          ) : (
            <Text style={styles.value}>{location || "Not set"}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Password</Text>
          <Text style={styles.value}>••••••••</Text>

          <TouchableOpacity
            style={styles.changePasswordInline}
            onPress={() => setView("changePassword")}
          >
            <Text style={styles.changePasswordText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.updateBtn, styles.cancelBtn]}
              onPress={() => {
                setUsername(originalUsername);
                setEmail(originalEmail);
                setAddress(originalAddress);
                setFullName(originalFullName);
                setPhoneNumber(originalPhoneNumber);
                setLocation(originalLocation);
                setIsEditing(false);
              }}
            >
              <Text style={styles.updateBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={async () => {
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

                  const payload: any = {
                    username,
                    userEmail: email,
                    address,
                    userFullName: fullName,
                    userPhoneNumber: phoneNumber,
                    location,
                  };

                  if (imageBase64) {
                    payload.profilePictureBase64 = imageBase64;
                  }

                  const resp = await fetch(`${API_BASE}/me`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                  });

                  if (resp.ok) {
                    await resp.json();
                    Alert.alert("Success", "Account updated successfully");

                    // Update original values
                    setOriginalUsername(username);
                    setOriginalEmail(email);
                    setOriginalAddress(address);
                    setOriginalFullName(fullName);
                    setOriginalPhoneNumber(phoneNumber);
                    setOriginalLocation(location);
                    setIsEditing(false);

                    // Save profile photo to AsyncStorage for header
                    if (imageUri) {
                      await AsyncStorage.setItem("userProfilePhoto", imageUri);
                    } else {
                      await AsyncStorage.removeItem("userProfilePhoto");
                    }

                    // Reload data to ensure sync
                    await loadUserData();
                  } else {
                    const txt = await resp.text();
                    console.error("Update failed:", resp.status, txt);
                    Alert.alert("Error", txt || "Update failed");
                  }
                } catch (err) {
                  console.error("Update error:", err);
                  Alert.alert(
                    "Error",
                    `Update failed: ${
                      err instanceof Error ? err.message : "Please try again."
                    }`
                  );
                }
              }}
            >
              <Text style={styles.updateBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.updateBtnText}>Update Information</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // Change password view
  if (view === "changePassword") {
    return (
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              setView("settings");
              setCurrent("");
              setNewPass("");
              setConfirm("");
            }}
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
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={async () => {
              if (!current || !newPass || !confirm) {
                Alert.alert("Error", "Please fill in all fields");
                return;
              }
              if (newPass !== confirm) {
                Alert.alert("Error", "New passwords do not match");
                return;
              }
              if (newPass.length < 6) {
                Alert.alert(
                  "Error",
                  "Password must be at least 6 characters long"
                );
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
                  setView("settings");
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
            }}
          >
            <Text style={styles.updateBtnText}>Change Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Add business view
  if (view === "addBusiness") {
    return (
      <AddBusinessScreen
        onBack={() => setView("settings")}
        onSuccess={() => {
          setView("settings");
          loadUserData(); // Reload to get updated business data
        }}
      />
    );
  }

  // Default settings view
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

        <TouchableOpacity
          style={styles.row}
          onPress={() => setView("addBusiness")}
        >
          <Text style={styles.rowLabel}>Add a Business</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  headerRow: { padding: 12 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 8, fontSize: 16 },
  profileSection: { alignItems: "center", marginBottom: 16 },
  avatarContainer: { marginVertical: 10 },
  avatar: { width: 150, height: 150, borderRadius: 75 },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  username: { fontSize: 18, fontWeight: "700" },
  photoButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
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
    backgroundColor: "#006400",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
    flex: 1,
  },
  cancelBtn: {
    marginRight: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  dangerZone: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "#fee2e2",
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 12,
  },
  deleteAccountButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteAccountText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
