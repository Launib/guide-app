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
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AccountView from "./account-view";
import ChangePasswordView from "./change-password-view";
import AddBusinessScreen from "./addBusinessScreen";
import BusinessProfilesView from "./business-profiles-view";

interface SettingsPageProps {
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

export default function SettingsPage({
  styleOfThePage,
  onAccountDeleted,
}: SettingsPageProps) {
  const [view, setView] = useState<
    "settings" | "account" | "changePassword" | "addBusiness" | "businessProfiles"
  >("settings");

  // User data states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");

  // Original data for cancel
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalFullName, setOriginalFullName] = useState("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalLocation, setOriginalLocation] = useState("");

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
        setFullName(data.fullName || "");
        setPhoneNumber(data.phoneNumber || "");
        setLocation(data.location || "");

        // Store original values for cancel functionality
        setOriginalUsername(data.username || "");
        setOriginalEmail(data.userEmail || "");
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
        base64: true,
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

  const handleCancel = () => {
    setUsername(originalUsername);
    setEmail(originalEmail);
    setFullName(originalFullName);
    setPhoneNumber(originalPhoneNumber);
    setLocation(originalLocation);
    setIsEditing(false);
  };

  const handleSave = async () => {
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
    return (
      <AccountView
        username={username}
        setUsername={setUsername}
        email={email}
        setEmail={setEmail}
        fullName={fullName}
        setFullName={setFullName}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        location={location}
        setLocation={setLocation}
        imageUri={imageUri}
        isEditing={isEditing}
        isLoading={isLoading}
        onBack={() => setView("settings")}
        onAddOrChangePhoto={handleAddOrChangePhoto}
        onRemovePhoto={handleRemovePhoto}
        onChangePassword={() => setView("changePassword")}
        onCancel={handleCancel}
        onSave={handleSave}
        onEdit={() => setIsEditing(true)}
      />
    );
  }

  // Change password view
  if (view === "changePassword") {
    return (
      <ChangePasswordView onBack={() => setView("settings")} />
    );
  }

  // Add business view
  if (view === "addBusiness") {
    return (
      <AddBusinessScreen
        onBack={() => setView("settings")}
        onSuccess={() => {
          // Keep user on the same screen to see the pending status
        }}
        onGoToBusinessProfiles={() => setView("businessProfiles")}
      />
    );
  }

  // Business profiles view
  if (view === "businessProfiles") {
    return (
      <BusinessProfilesView
        key={Date.now()}
        onBack={() => setView("settings")}
      />
    );
  }

  // Default settings view
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styleOfThePage.text, { fontSize: 18, marginBottom: 12 }]}>
          Profile
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

        <TouchableOpacity
          style={styles.row}
          onPress={() => setView("businessProfiles")}
        >
          <Text style={styles.rowLabel}>Business Profiles</Text>
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
  row: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 16 },
  dangerZone: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "#fee2e2",
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
