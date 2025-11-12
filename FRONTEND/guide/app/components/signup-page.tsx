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
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

enum UserAccountType {
  regularUser = "Regular",
  admin = "Admin",
  business = "Business",
  cityAdmin = "City",
  subManager = "Sub Manager",
}

type AccountType =
  | UserAccountType.regularUser
  | UserAccountType.admin
  | UserAccountType.business
  | UserAccountType.cityAdmin
  | "";

interface SignUpFormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: AccountType;
  // Admin-specific questions
  departmentName?: string;
  // Business-specific questions
  businessName?: string;
  businessLicense?: string;
  // City Admin-specific questions
  cityName?: string;
  governmentId?: string;
  // Address information
  street?: string;
  apt?: string;
  zipCode?: string;
  state?: string;
  city?: string;
}

export default function SignUpPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<SignUpFormData>({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    accountType: "",
  });
  const [pickerVisible, setPickerVisible] = useState(false);

  const pickerOptions = [
    { label: "Regular User", value: UserAccountType.regularUser },
    { label: "Admin", value: UserAccountType.admin },
    { label: "Business", value: UserAccountType.business },
    { label: "City Admin", value: UserAccountType.cityAdmin },
    { label: "Sub Manager", value: UserAccountType.subManager },
  ];

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAccountTypeChange = (type: AccountType) => {
    setForm((prev) => ({
      ...prev,
      accountType: type,
      // Clear account-type-specific fields when changing type
      departmentName: "",
      businessName: "",
      businessLicense: "",
      cityName: "",
      governmentId: "",
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.username ||
      !form.password ||
      !form.firstName ||
      !form.lastName ||
      !form.accountType
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    // Validate account-type-specific fields
    if (form.accountType === UserAccountType.admin && !form.departmentName) {
      Alert.alert("Error", "Please enter your department name.");
      return;
    }
    if (
      form.accountType === UserAccountType.business &&
      (!form.businessName || !form.businessLicense)
    ) {
      Alert.alert("Error", "Please fill in all business information.");
      return;
    }
    if (
      form.accountType === UserAccountType.cityAdmin &&
      (!form.cityName || !form.governmentId)
    ) {
      Alert.alert("Error", "Please fill in all city admin information.");
      return;
    }

    try {
      // TODO: Call sign-up API with form data
      console.log("Sign up form submitted:", form);

      // For now, simulate successful sign-up by storing a token
      await AsyncStorage.setItem("userToken", form.username);
      Alert.alert("Success", "Account created successfully");

      // Trigger the success callback to navigate to main app
      onSuccess?.();
    } catch {
      Alert.alert("Error", "Sign up failed. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sign Up</Text>
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

        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter first name"
          value={form.firstName}
          onChangeText={(text) => handleInputChange("firstName", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter last name"
          value={form.lastName}
          onChangeText={(text) => handleInputChange("lastName", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Account Type *</Text>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.8}
        >
          <Text
            style={{ padding: 12, color: form.accountType ? "#111" : "#999" }}
          >
            {form.accountType ? form.accountType : "Select an account type"}
          </Text>
        </TouchableOpacity>

        <Modal visible={pickerVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setPickerVisible(false)}
          >
            <View style={styles.modalContent}>
              {pickerOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.modalItem}
                  onPress={() => {
                    handleAccountTypeChange(opt.value as AccountType);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Text style={styles.sectionTitle}>Address Information</Text>

        <Text style={styles.label}>Street Address *</Text>
        <TextInput
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
        />

        {/* Admin-specific fields */}
        {form.accountType === UserAccountType.admin && (
          <>
            <Text style={styles.sectionTitle}>Admin Information</Text>
            <Text style={styles.label}>Department Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter department name"
              value={form.departmentName || ""}
              onChangeText={(text) => handleInputChange("departmentName", text)}
              placeholderTextColor="#999"
            />
          </>
        )}

        {/* Business-specific fields */}
        {form.accountType === UserAccountType.business && (
          <>
            <Text style={styles.sectionTitle}>Business Information</Text>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              value={form.businessName || ""}
              onChangeText={(text) => handleInputChange("businessName", text)}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Business License *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business license number"
              value={form.businessLicense || ""}
              onChangeText={(text) =>
                handleInputChange("businessLicense", text)
              }
              placeholderTextColor="#999"
            />
          </>
        )}

        {/* City Admin-specific fields */}
        {form.accountType === UserAccountType.cityAdmin && (
          <>
            <Text style={styles.sectionTitle}>City Admin Information</Text>
            <Text style={styles.label}>City Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city name"
              value={form.cityName || ""}
              onChangeText={(text) => handleInputChange("cityName", text)}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Government ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter government ID"
              value={form.governmentId || ""}
              onChangeText={(text) => handleInputChange("governmentId", text)}
              placeholderTextColor="#999"
            />
          </>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Sign Up</Text>
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 8,
    paddingVertical: 8,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    fontSize: 16,
    color: "#111",
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
