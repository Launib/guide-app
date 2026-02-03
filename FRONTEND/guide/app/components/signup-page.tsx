import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

enum UserAccountType {
  admin = "Admin",
  business = "Business",
  cityAdmin = "CityAdmin",
  regular = "RegularUser",
}

type AccountType =
  | UserAccountType.admin
  | UserAccountType.business
  | UserAccountType.cityAdmin
  | UserAccountType.regular
  | "";

interface BaseFormData {
  email: string;
  username: string;
  password: string;
  userFullName: string;
  phoneNumber: string;
  location: string;
}

interface AdminFormData extends BaseFormData {
  departmentName: string;
}

interface BusinessFormData extends BaseFormData {
  businessName: string;
  businessLicense: string;
  businessPhoneNumber: string;
  businessAddress: string;
}

interface CityAdminFormData extends BaseFormData {
  cityName: string;
  governmentId: string;
}

interface RegularFormData extends BaseFormData {}

type FormData =
  | AdminFormData
  | BusinessFormData
  | CityAdminFormData
  | RegularFormData;

export default function SignUpPage({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedType, setSelectedType] = useState<AccountType>("");
  const [form, setForm] = useState<any>({});

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const handleTypeSelect = (type: AccountType) => {
    setSelectedType(type);
    setForm({
      email: "",
      username: "",
      password: "",
      userFullName: "",
      phoneNumber: "",
      location: "",
      ...(type === UserAccountType.admin && { departmentName: "" }),
      ...(type === UserAccountType.business && {
        businessName: "",
        businessLicense: "",
        businessPhoneNumber: "",
        businessAddress: "",
      }),
      ...(type === UserAccountType.cityAdmin && {
        cityName: "",
        governmentId: "",
      }),
    });
    setStep("form");
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));

    // Update password validation checks
    if (field === "password") {
      setPasswordChecks({
        minLength: value.length >= 6,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecialChar: /[^A-Za-z0-9]/.test(value),
      });
    }
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    const baseFieldsFilled =
      form.email &&
      form.username &&
      form.password &&
      form.userFullName &&
      form.phoneNumber &&
      form.location;

    const passwordValid =
      passwordChecks.minLength &&
      passwordChecks.hasUppercase &&
      passwordChecks.hasLowercase &&
      passwordChecks.hasNumber &&
      passwordChecks.hasSpecialChar;

    if (!baseFieldsFilled || !passwordValid) return false;

    if (selectedType === UserAccountType.admin && !form.departmentName)
      return false;
    if (
      selectedType === UserAccountType.business &&
      (!form.businessName ||
        !form.businessLicense ||
        !form.businessPhoneNumber ||
        !form.businessAddress)
    )
      return false;
    if (
      selectedType === UserAccountType.cityAdmin &&
      (!form.cityName || !form.governmentId)
    )
      return false;

    return true;
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !form.email ||
      !form.username ||
      !form.password ||
      !form.userFullName ||
      !form.phoneNumber ||
      !form.location
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    if (selectedType === UserAccountType.admin && !form.departmentName) {
      Alert.alert("Error", "Please enter your department name.");
      return;
    }
    if (
      selectedType === UserAccountType.business &&
      (!form.businessName ||
        !form.businessLicense ||
        !form.businessPhoneNumber ||
        !form.businessAddress)
    ) {
      Alert.alert("Error", "Please fill in all business information.");
      return;
    }
    if (
      selectedType === UserAccountType.cityAdmin &&
      (!form.cityName || !form.governmentId)
    ) {
      Alert.alert("Error", "Please fill in all city admin information.");
      return;
    }

    try {
      const payload: any = {
        userEmail: form.email,
        password: form.password,
        username: form.username,
        userFullName: form.userFullName,
        userPhoneNumber: form.phoneNumber,
        location: form.location,
        accountType: selectedType,
        ...(selectedType === UserAccountType.admin && {
          DepartmentName: form.departmentName,
        }),
        ...(selectedType === UserAccountType.business && {
          BusinessName: form.businessName,
          BusinessLicense: form.businessLicense,
          BusinessPhoneNumber: form.businessPhoneNumber,
          BusinessAddress: form.businessAddress,
        }),
        ...(selectedType === UserAccountType.cityAdmin && {
          CityName: form.cityName,
          GovernmentId: form.governmentId,
        }),
      };

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/auth"
          : "http://localhost:5162/api/auth";

      const resp = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.log("Signup error - Status:", resp.status, "Message:", txt);

        if (resp.status === 409) {
          // Check if it's email or username conflict
          if (txt.toLowerCase().includes("email")) {
            Alert.alert(
              "Email Already Registered",
              "This email address is already in use. Please use a different email or log in to your existing account."
            );
          } else if (txt.toLowerCase().includes("username")) {
            Alert.alert(
              "Username Already Taken",
              "This username is already in use. Please choose a different username."
            );
          } else {
            // Generic conflict message
            Alert.alert("Already Registered", txt);
          }
        } else {
          Alert.alert("Error", txt || `Sign up failed: ${resp.status}`);
        }
        return;
      }

      const data = await resp.json();
      const token = data.token;
      const user = data.user;

      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("authUser", JSON.stringify(user));
      await AsyncStorage.setItem("username", user?.userName ?? form.username);
      await AsyncStorage.setItem("userRole", user?.roles?.[0] ?? selectedType);

      Alert.alert("Success", "Account created successfully");
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", "Sign up failed. Please try again.");
    }
  };

  if (step === "select") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Choose Your Account Type</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.typeButton}
            onPress={() => handleTypeSelect(UserAccountType.admin)}
          >
            <Text style={styles.typeButtonText}>Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.typeButton}
            onPress={() => handleTypeSelect(UserAccountType.business)}
          >
            <Text style={styles.typeButtonText}>Business</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.typeButton}
            onPress={() => handleTypeSelect(UserAccountType.cityAdmin)}
          >
            <Text style={styles.typeButtonText}>City Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.typeButton}
            onPress={() => handleTypeSelect(UserAccountType.regular)}
          >
            <Text style={styles.typeButtonText}>Regular</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedTypeLabel = (type: AccountType) => {
    switch (type) {
      case "Business":
        return "a Business User";
      case "Admin":
        return "An Admin User";
      case "CityAdmin":
        return "a City Admin";
      case "RegularUser":
        return "a Regular User";
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep("select")}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sign Up as {selectedTypeLabel(selectedType)}</Text>
      </View>
      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          value={form.email}
          onChangeText={(text) => handleInputChange("email", text)}
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Username *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          value={form.username}
          onChangeText={(text) => handleInputChange("username", text)}
          placeholderTextColor="#999"
          autoCapitalize="none"
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
        <View style={styles.passwordRequirements}>
          <Text
            style={[
              styles.requirementText,
              passwordChecks.minLength && styles.requirementMet,
            ]}
          >
            {passwordChecks.minLength ? "✓" : "○"} At least 6 characters
          </Text>
          <Text
            style={[
              styles.requirementText,
              passwordChecks.hasUppercase && styles.requirementMet,
            ]}
          >
            {passwordChecks.hasUppercase ? "✓" : "○"} One uppercase letter (A-Z)
          </Text>
          <Text
            style={[
              styles.requirementText,
              passwordChecks.hasLowercase && styles.requirementMet,
            ]}
          >
            {passwordChecks.hasLowercase ? "✓" : "○"} One lowercase letter (a-z)
          </Text>
          <Text
            style={[
              styles.requirementText,
              passwordChecks.hasNumber && styles.requirementMet,
            ]}
          >
            {passwordChecks.hasNumber ? "✓" : "○"} One number (0-9)
          </Text>
          <Text
            style={[
              styles.requirementText,
              passwordChecks.hasSpecialChar && styles.requirementMet,
            ]}
          >
            {passwordChecks.hasSpecialChar ? "✓" : "○"} One special character
          </Text>
        </View>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter full name"
          value={form.userFullName}
          onChangeText={(text) => handleInputChange("userFullName", text)}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={form.phoneNumber}
          onChangeText={(text) => handleInputChange("phoneNumber", text)}
          placeholderTextColor="#999"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter location"
          value={form.location}
          onChangeText={(text) => handleInputChange("location", text)}
          placeholderTextColor="#999"
        />

        {selectedType === UserAccountType.admin && (
          <>
            <Text style={styles.label}>Department Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter department name"
              value={form.departmentName}
              onChangeText={(text) => handleInputChange("departmentName", text)}
              placeholderTextColor="#999"
            />
          </>
        )}

        {selectedType === UserAccountType.business && (
          <>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              value={form.businessName}
              onChangeText={(text) => handleInputChange("businessName", text)}
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Business License *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business license"
              value={form.businessLicense}
              onChangeText={(text) =>
                handleInputChange("businessLicense", text)
              }
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Business Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business phone number"
              value={form.businessPhoneNumber}
              onChangeText={(text) =>
                handleInputChange("businessPhoneNumber", text)
              }
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Business Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business address"
              value={form.businessAddress}
              onChangeText={(text) =>
                handleInputChange("businessAddress", text)
              }
              placeholderTextColor="#999"
            />
          </>
        )}

        {selectedType === UserAccountType.cityAdmin && (
          <>
            <Text style={styles.label}>City Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city name"
              value={form.cityName}
              onChangeText={(text) => handleInputChange("cityName", text)}
              placeholderTextColor="#999"
            />
            <Text style={styles.label}>Government ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter government ID"
              value={form.governmentId}
              onChangeText={(text) => handleInputChange("governmentId", text)}
              placeholderTextColor="#999"
            />
          </>
        )}

        {!isFormValid() && (
          <Text style={styles.helperText}>
            All fields must be filled and password requirements must be met
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid() && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid()}
        >
          <Text style={styles.submitButtonText}>Sign Up</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: { color: "#0066cc", fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  typeButton: {
    backgroundColor: "#006400",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 8,
    width: "80%",
    alignItems: "center",
  },
  typeButtonText: { color: "#fff", fontWeight: "600", fontSize: 18 },
  formContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 6 },
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
    backgroundColor: "#999",
    opacity: 0.5,
  },
  submitButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  passwordRequirements: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  requirementMet: {
    color: "#006400",
    fontWeight: "600",
  },
  helperText: {
    fontSize: 13,
    color: "#dc2626",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
  },
});
