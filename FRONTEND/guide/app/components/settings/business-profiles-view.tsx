import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface BusinessProfilesViewProps {
  onBack: () => void;
}

interface Business {
  id: number;
  name: string;
  status: string;
  phoneNumber?: string;
  licenseNumber?: string;
  address?: string;
  hasAccount?: boolean;
  businessUsername?: string;
}

export default function BusinessProfilesView({ onBack }: BusinessProfilesViewProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [businessUsername, setBusinessUsername] = useState("");
  const [businessPassword, setBusinessPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    loadBusinessProfiles();
  }, []);

  const loadBusinessProfiles = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "No authentication token found");
        setIsLoading(false);
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      console.log("Fetching businesses from:", `${API_BASE}/my-businesses`);

      const resp = await fetch(`${API_BASE}/my-businesses`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Business profiles response status:", resp.status);

      if (resp.ok) {
        const data = await resp.json();
        console.log("Business profiles data:", data);
        console.log("Number of businesses:", data.length);
        setBusinesses(data);
      } else {
        const errorText = await resp.text();
        console.error("Failed to load businesses:", resp.status, errorText);
        // Don't show alert if it's just empty list
        if (resp.status !== 404) {
          Alert.alert("Error", `Failed to load business profiles: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Error loading business profiles:", err);
      Alert.alert(
        "Error",
        `Failed to load business profiles: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "approved") return "#10b981";
    if (normalized === "denied" || normalized === "rejected") return "#ef4444";
    return "#f59e0b"; // pending
  };

  const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "approved") return "checkmark-circle";
    if (normalized === "denied" || normalized === "rejected") return "close-circle";
    return "time"; // pending
  };

  const handleBusinessLogin = async (username: string, password: string) => {
    try {
      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/auth"
          : "http://localhost:5162/api/auth";

      console.log("Attempting business login for:", username);

      const resp = await fetch(`${API_BASE}/business-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      console.log("Business login response status:", resp.status);

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Business login failed:", resp.status, txt);
        Alert.alert("Error", "Failed to log in to business account");
        return false;
      }

      const data = await resp.json();
      console.log("Business login response data:", { ...data, token: "[REDACTED]" });

      const token = data.token;
      const user = data.user;

      if (!token) {
        Alert.alert("Error", "Login failed: no token returned");
        return false;
      }

      // Save token
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("userToken", token);

      // Save user data
      if (user) {
        await AsyncStorage.setItem("authUser", JSON.stringify(user));
        await AsyncStorage.setItem("username", user.username || username);

        // Save role
        if (user.roles && user.roles.length > 0) {
          await AsyncStorage.setItem("userRole", user.roles[0]);
          console.log("Saved user role:", user.roles[0]);
        }

        // Save profile photo if available
        if (user.profilePicture) {
          const imageDataUri = `data:image/jpeg;base64,${user.profilePicture}`;
          await AsyncStorage.setItem("userProfilePhoto", imageDataUri);
        }
      }

      console.log("Business login successful");
      return true;
    } catch (err) {
      console.error("Business login error:", err);
      Alert.alert(
        "Error",
        `Failed to log in: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  const handleBusinessPress = (business: Business) => {
    setSelectedBusiness(business);
    const normalized = business.status.toLowerCase();
    if (normalized === "approved") {
      // If business already has an account, show login modal
      if (business.hasAccount) {
        setShowLoginModal(true);
      } else {
        // No account yet, show setup modal
        setShowSetupModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleBusinessLoginSubmit = async () => {
    if (!selectedBusiness || !selectedBusiness.businessUsername) return;

    if (!loginPassword.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    try {
      setIsLoggingIn(true);
      const success = await handleBusinessLogin(
        selectedBusiness.businessUsername,
        loginPassword
      );

      if (success) {
        handleCloseModal();
        // The app will automatically switch to business view via polling in _layout.tsx
        if (Platform.OS === "web") {
          window.alert(`Logged in to ${selectedBusiness.name}. The app will switch to your business account momentarily.`);
        } else {
          Alert.alert(
            "Success",
            `Logged in to ${selectedBusiness.name}.`
          );
        }
      }
    } catch (err) {
      console.error("Login submit error:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDeleteBusiness = async () => {
    console.log("DELETE BUSINESS BUTTON CLICKED - handleDeleteBusiness called");

    if (!selectedBusiness) {
      console.log("No selected business");
      return;
    }

    console.log("Selected business:", selectedBusiness.id, selectedBusiness.name);

    // Handle web platform differently
    if (Platform.OS === "web") {
      console.log("Platform is web, using window.confirm");
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedBusiness.name}? This action cannot be undone.`
      );

      if (!confirmed) {
        console.log("Delete business cancelled (web)");
        return;
      }

      console.log("DELETE BUSINESS CONFIRMED (web) - Starting deletion process");
      await performDeleteBusiness();
    } else {
      // Mobile platform - use Alert.alert
      Alert.alert(
        "Delete Business Request",
        `Are you sure you want to delete ${selectedBusiness.name}? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => console.log("Delete business cancelled")
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              console.log("DELETE BUSINESS CONFIRMED - Starting deletion process");
              await performDeleteBusiness();
            },
          },
        ]
      );
    }
  };

  const performDeleteBusiness = async () => {
    if (!selectedBusiness) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      console.log("Token retrieved:", token ? "yes" : "no");

      if (!token) {
        console.log("No token - showing error");
        if (Platform.OS === "web") {
          window.alert("No authentication token found");
        } else {
          Alert.alert("Error", "No authentication token found");
        }
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      const deleteUrl = `${API_BASE}/${selectedBusiness.id}`;
      console.log("DELETE BUSINESS URL:", deleteUrl);

      const resp = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", resp.status);
      console.log("Response ok:", resp.ok);

      if (resp.ok) {
        console.log("Delete business successful");
        if (Platform.OS === "web") {
          window.alert("Business deleted successfully");
        } else {
          Alert.alert("Success", "Business deleted successfully");
        }
        setShowModal(false);
        setSelectedBusiness(null);
        loadBusinessProfiles(); // Reload the list
      } else {
        const errorText = await resp.text();
        console.log("Delete business failed:", errorText);
        if (Platform.OS === "web") {
          window.alert(`Failed to delete business: ${errorText}`);
        } else {
          Alert.alert("Error", `Failed to delete business: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Delete business error:", err);
      const errorMsg = `Failed to delete business: ${
        err instanceof Error ? err.message : "Unknown error"
      }`;
      if (Platform.OS === "web") {
        window.alert(errorMsg);
      } else {
        Alert.alert("Error", errorMsg);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowSetupModal(false);
    setShowLoginModal(false);
    setSelectedBusiness(null);
    setBusinessUsername("");
    setBusinessPassword("");
    setConfirmPassword("");
    setLoginPassword("");
    // Reset password checks
    setPasswordChecks({
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    });
  };

  // Check if all password requirements are met
  const isPasswordValid =
    passwordChecks.minLength &&
    passwordChecks.hasUppercase &&
    passwordChecks.hasLowercase &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSpecialChar;

  // Check if form is complete and valid
  const isFormValid =
    businessUsername.trim() !== "" &&
    businessPassword.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    businessPassword === confirmPassword &&
    isPasswordValid;

  const handleCreateBusinessAccount = async () => {
    console.log("CREATE ACCOUNT BUTTON CLICKED");

    if (!selectedBusiness) {
      console.log("No selected business");
      return;
    }

    console.log("Selected business:", selectedBusiness.id, selectedBusiness.name);
    console.log("Username:", businessUsername);
    console.log("Password length:", businessPassword.length);

    // Validation
    if (!businessUsername.trim()) {
      console.log("Validation failed: Username empty");
      if (Platform.OS === "web") {
        window.alert("Please enter a username");
      } else {
        Alert.alert("Error", "Please enter a username");
      }
      return;
    }

    if (!businessPassword.trim()) {
      console.log("Validation failed: Password empty");
      if (Platform.OS === "web") {
        window.alert("Please enter a password");
      } else {
        Alert.alert("Error", "Please enter a password");
      }
      return;
    }

    if (businessPassword !== confirmPassword) {
      console.log("Validation failed: Passwords don't match");
      if (Platform.OS === "web") {
        window.alert("Passwords do not match");
      } else {
        Alert.alert("Error", "Passwords do not match");
      }
      return;
    }

    if (businessPassword.length < 6) {
      console.log("Validation failed: Password too short");
      if (Platform.OS === "web") {
        window.alert("Password must be at least 6 characters");
      } else {
        Alert.alert("Error", "Password must be at least 6 characters");
      }
      return;
    }

    console.log("Validation passed, creating account...");

    try {
      setIsCreatingAccount(true);
      const token = await AsyncStorage.getItem("authToken");
      console.log("Token retrieved:", token ? "yes" : "no");

      if (!token) {
        console.log("No authentication token found");
        if (Platform.OS === "web") {
          window.alert("No authentication token found");
        } else {
          Alert.alert("Error", "No authentication token found");
        }
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      const createAccountUrl = `${API_BASE}/${selectedBusiness.id}/create-account`;
      console.log("CREATE ACCOUNT URL:", createAccountUrl);
      console.log("Sending request...");

      const resp = await fetch(createAccountUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: businessUsername,
          password: businessPassword,
        }),
      });

      console.log("Response status:", resp.status);
      console.log("Response ok:", resp.ok);

      if (resp.ok) {
        const responseData = await resp.json();
        console.log("Business account created successfully:", responseData);

        // Account created successfully, now log in automatically
        console.log("Logging in automatically with username:", businessUsername);
        const loginSuccess = await handleBusinessLogin(businessUsername, businessPassword);

        if (loginSuccess) {
          // Close modal immediately
          handleCloseModal();

          // Show success message
          // The app will automatically switch to business view via polling in _layout.tsx
          if (Platform.OS === "web") {
            setTimeout(() => {
              window.alert(`Business account created! You are now logged in to ${selectedBusiness.name}. The app will switch to your business account momentarily.`);
            }, 100);
          } else {
            Alert.alert(
              "Success",
              `Business account created and logged in successfully! You are now logged in to ${selectedBusiness.name}.`
            );
          }
        } else {
          // Account created but auto-login failed
          if (Platform.OS === "web") {
            window.alert("Business account created successfully! Please log in manually.");
            handleCloseModal();
            loadBusinessProfiles();
          } else {
            Alert.alert(
              "Success",
              "Business account created successfully! Please log in manually.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    handleCloseModal();
                    loadBusinessProfiles();
                  },
                },
              ]
            );
          }
        }
      } else {
        const errorText = await resp.text();
        if (Platform.OS === "web") {
          window.alert(`Failed to create business account: ${errorText}`);
        } else {
          Alert.alert("Error", `Failed to create business account: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Error creating business account:", err);
      Alert.alert(
        "Error",
        `Failed to create business account: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#333" />
          <Text style={styles.backText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Business Profiles</Text>
        <Text style={styles.subtitle}>
          View all your business applications and their status
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#006400" />
            <Text style={styles.loadingText}>Loading businesses...</Text>
          </View>
        ) : businesses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No business profiles yet</Text>
            <Text style={styles.emptySubtext}>
              Add a business to get started
            </Text>
          </View>
        ) : (
          <View style={styles.businessList}>
            {businesses.map((business) => (
              <TouchableOpacity
                key={business.id}
                style={styles.businessCard}
                onPress={() => handleBusinessPress(business)}
                activeOpacity={0.7}
              >
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{business.name}</Text>
                  <View style={styles.statusRow}>
                    <Ionicons
                      name={getStatusIcon(business.status)}
                      size={16}
                      color={getStatusColor(business.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(business.status) },
                      ]}
                    >
                      {business.status}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Business Detail Modal (for Pending/Denied) */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Business Details</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedBusiness && (
                <>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name={getStatusIcon(selectedBusiness.status)}
                      size={20}
                      color={getStatusColor(selectedBusiness.status)}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(selectedBusiness.status) },
                      ]}
                    >
                      {selectedBusiness.status}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Business Name:</Text>
                    <Text style={styles.value}>{selectedBusiness.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone Number:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.phoneNumber || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>License Number:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.licenseNumber || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.address || "N/A"}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDelete]}
                onPress={handleDeleteBusiness}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Delete Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCancel]}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Setup Modal (for Approved) */}
      <Modal
        visible={showSetupModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Up Business Account</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedBusiness && (
                <>
                  <Text style={styles.setupDescription}>
                    Your business "{selectedBusiness.name}" has been approved! Create
                    a username and password to access your business account.
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Business Username</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter username"
                      autoCapitalize="none"
                      value={businessUsername}
                      onChangeText={setBusinessUsername}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password"
                      secureTextEntry
                      autoCapitalize="none"
                      value={businessPassword}
                      onChangeText={(value) => {
                        setBusinessPassword(value);
                        setPasswordChecks({
                          minLength: value.length >= 6,
                          hasUppercase: /[A-Z]/.test(value),
                          hasLowercase: /[a-z]/.test(value),
                          hasNumber: /[0-9]/.test(value),
                          hasSpecialChar: /[^A-Za-z0-9]/.test(value),
                        });
                      }}
                    />

                    {/* Password Requirements */}
                    <View style={styles.passwordRequirements}>
                      <Text style={styles.requirementsTitle}>Password must contain:</Text>
                      <View style={styles.requirementRow}>
                        <Ionicons
                          name={passwordChecks.minLength ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={passwordChecks.minLength ? "#10b981" : "#ef4444"}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordChecks.minLength && styles.requirementMet,
                          ]}
                        >
                          At least 6 characters
                        </Text>
                      </View>
                      <View style={styles.requirementRow}>
                        <Ionicons
                          name={passwordChecks.hasUppercase ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={passwordChecks.hasUppercase ? "#10b981" : "#ef4444"}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordChecks.hasUppercase && styles.requirementMet,
                          ]}
                        >
                          One uppercase letter
                        </Text>
                      </View>
                      <View style={styles.requirementRow}>
                        <Ionicons
                          name={passwordChecks.hasLowercase ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={passwordChecks.hasLowercase ? "#10b981" : "#ef4444"}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordChecks.hasLowercase && styles.requirementMet,
                          ]}
                        >
                          One lowercase letter
                        </Text>
                      </View>
                      <View style={styles.requirementRow}>
                        <Ionicons
                          name={passwordChecks.hasNumber ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={passwordChecks.hasNumber ? "#10b981" : "#ef4444"}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordChecks.hasNumber && styles.requirementMet,
                          ]}
                        >
                          One number
                        </Text>
                      </View>
                      <View style={styles.requirementRow}>
                        <Ionicons
                          name={passwordChecks.hasSpecialChar ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={passwordChecks.hasSpecialChar ? "#10b981" : "#ef4444"}
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            passwordChecks.hasSpecialChar && styles.requirementMet,
                          ]}
                        >
                          One special character
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm password"
                      secureTextEntry
                      autoCapitalize="none"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.btnApprove,
                  (!isFormValid || isCreatingAccount) && styles.btnDisabled
                ]}
                onPress={handleCreateBusinessAccount}
                disabled={!isFormValid || isCreatingAccount}
              >
                {isCreatingAccount ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Create Account</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCancel]}
                onPress={handleCloseModal}
                disabled={isCreatingAccount}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log In to Business</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedBusiness && (
                <>
                  <Text style={styles.setupDescription}>
                    Log in to {selectedBusiness.name} using your business credentials.
                  </Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Business Username:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.businessUsername || "N/A"}
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your business password"
                      secureTextEntry
                      autoCapitalize="none"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                    />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.btnApprove,
                  isLoggingIn && styles.btnDisabled,
                ]}
                onPress={handleBusinessLoginSubmit}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="log-in" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Log In</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCancel]}
                onPress={handleCloseModal}
                disabled={isLoggingIn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  headerRow: { padding: 12 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 8, fontSize: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  businessList: {
    gap: 12,
  },
  businessCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "85%",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
  setupDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  modalActions: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnApprove: {
    backgroundColor: "#22c55e",
  },
  btnDelete: {
    backgroundColor: "#ef4444",
  },
  btnCancel: {
    backgroundColor: "#e5e7eb",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cancelBtnText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
  },
  passwordRequirements: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
    color: "#666",
  },
  requirementMet: {
    color: "#10b981",
    fontWeight: "500",
  },
});
