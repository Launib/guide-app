import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatPhoneNumber } from "../../utils/phoneFormatter";

interface AccountViewProps {
  username: string;
  setUsername: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  fullName: string;
  setFullName: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  imageUri: string | null;
  isEditing: boolean;
  isLoading: boolean;
  onBack: () => void;
  onAddOrChangePhoto: () => void;
  onRemovePhoto: () => void;
  onChangePassword: () => void;
  onCancel: () => void;
  onSave: () => void;
  onEdit: () => void;
}

export default function AccountView({
  username,
  setUsername,
  email,
  setEmail,
  fullName,
  setFullName,
  phoneNumber,
  setPhoneNumber,
  location,
  setLocation,
  imageUri,
  isEditing,
  isLoading,
  onBack,
  onAddOrChangePhoto,
  onRemovePhoto,
  onChangePassword,
  onCancel,
  onSave,
  onEdit,
}: AccountViewProps) {
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
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#333" />
          <Text style={styles.backText}>Profile</Text>
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
          <TouchableOpacity style={styles.photoBtn} onPress={onAddOrChangePhoto}>
            <Text style={styles.photoBtnText}>
              {imageUri ? "Change Photo" : "Add Photo"}
            </Text>
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity
              style={[styles.photoBtn, styles.removeBtn]}
              onPress={onRemovePhoto}
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
          onPress={onChangePassword}
        >
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.updateBtn, styles.cancelBtn]}
            onPress={onCancel}
          >
            <Text style={styles.updateBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.updateBtn} onPress={onSave}>
            <Text style={styles.updateBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.updateBtn} onPress={onEdit}>
          <Text style={styles.updateBtnText}>Update Information</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
});
