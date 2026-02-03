import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";

type ApprovalStatus = "Pending" | "Approved" | "Denied";

type Business = {
  id: number;
  name: string;
  phoneNumber?: string;
  licenseNumber?: string;
  address?: string;
  status: ApprovalStatus;
  ownerId: string;
  owner?: {
    userName: string;
    userEmail: string;
    userFullName?: string;
    userPhoneNumber?: string;
    location?: string;
  };
};

type User = {
  id: string;
  userName: string;
  email: string;
  userEmail?: string;
  userFullName?: string;
  userPhoneNumber?: string;
  location?: string;
  address?: string;
  accountType?: string;
  roles: string[];
};

export default function UserManagementPage() {
  const route = useRoute();
  const params = route.params as { initialTab?: string } | undefined;

  const [activeTab, setActiveTab] = useState<"allUsers" | "businessRequests">(
    params?.initialTab === "businessRequests" ? "businessRequests" : "allUsers"
  );
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    // Load pending count for badge regardless of active tab
    loadPendingCount();
    const pendingCountInterval = setInterval(loadPendingCount, 10000);

    if (activeTab === "businessRequests") {
      loadPendingBusinesses();
      // Auto-refresh business list every 5 seconds when on business requests tab
      const businessRefreshInterval = setInterval(loadPendingBusinesses, 5000);
      return () => {
        clearInterval(pendingCountInterval);
        clearInterval(businessRefreshInterval);
      };
    } else {
      loadAllUsers();
    }

    return () => clearInterval(pendingCountInterval);
  }, [activeTab]);

  useEffect(() => {
    // Update active tab if navigation params change
    if (params?.initialTab === "businessRequests") {
      console.log("Navigation param received: switching to business requests tab");
      setActiveTab("businessRequests");
    }
  }, [params?.initialTab]);

  const loadPendingCount = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      const resp = await fetch(`${API_BASE}/pending`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        setPendingCount(data.length);
      }
    } catch (err) {
      console.error("Error loading pending count:", err);
    }
  };

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/appadmin"
          : "http://localhost:5162/api/appadmin";

      const resp = await fetch(`${API_BASE}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        setUsers(data);
      } else {
        const errorText = await resp.text();
        console.error("Failed to load users:", resp.status, errorText);
        if (resp.status !== 404) {
          Alert.alert("Error", `Failed to load users: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Error loading users:", err);
      Alert.alert(
        "Error",
        `Failed to load users: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPendingBusinesses = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      const resp = await fetch(`${API_BASE}/pending`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        setBusinesses(data);
      } else {
        const errorText = await resp.text();
        console.error("Failed to load businesses:", resp.status, errorText);
        if (resp.status !== 404) {
          Alert.alert("Error", `Failed to load pending businesses: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Error loading businesses:", err);
      Alert.alert(
        "Error",
        `Failed to load pending businesses: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessPress = (business: Business) => {
    setSelectedBusiness(business);
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedBusiness) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      console.log(`Approving business ${selectedBusiness.id}`);

      const resp = await fetch(`${API_BASE}/${selectedBusiness.id}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`Approve response status: ${resp.status}`);

      if (resp.ok) {
        const responseData = await resp.json();
        console.log("Approve response data:", responseData);

        // Close modal and clear selection first
        setShowModal(false);
        setSelectedBusiness(null);

        // Update the business status in the local state
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === selectedBusiness.id ? { ...b, status: "Approved" } : b
          )
        );

        // Show success message
        if (Platform.OS === "web") {
          window.alert("Business approved successfully");
        } else {
          Alert.alert("Success", "Business approved successfully");
        }

        // Reload to ensure data is in sync
        loadPendingBusinesses();
        loadPendingCount();
      } else {
        const errorText = await resp.text();
        console.error(`Approve failed: ${resp.status} - ${errorText}`);
        if (Platform.OS === "web") {
          window.alert(`Failed to approve business: ${errorText}`);
        } else {
          Alert.alert("Error", `Failed to approve business: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Error approving business:", err);
      if (Platform.OS === "web") {
        window.alert(`Failed to approve business: ${err instanceof Error ? err.message : "Unknown error"}`);
      } else {
        Alert.alert(
          "Error",
          `Failed to approve business: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }
  };

  const handleDeny = async () => {
    if (!selectedBusiness) return;

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const API_BASE =
        Platform.OS === "android"
          ? "http://10.0.2.2:5162/api/business"
          : "http://localhost:5162/api/business";

      console.log(`Denying business ${selectedBusiness.id}`);

      const resp = await fetch(`${API_BASE}/${selectedBusiness.id}/deny`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`Deny response status: ${resp.status}`);

      if (resp.ok) {
        const responseData = await resp.json();
        console.log("Deny response data:", responseData);

        // Close modal and clear selection first
        setShowModal(false);
        setSelectedBusiness(null);

        // Update the business status in the local state
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === selectedBusiness.id ? { ...b, status: "Denied" } : b
          )
        );

        // Show success message
        if (Platform.OS === "web") {
          window.alert("Business denied");
        } else {
          Alert.alert("Success", "Business denied");
        }

        // Reload to ensure data is in sync
        loadPendingBusinesses();
        loadPendingCount();
      } else {
        const errorText = await resp.text();
        console.error(`Deny failed: ${resp.status} - ${errorText}`);
        if (Platform.OS === "web") {
          window.alert(`Failed to deny business: ${errorText}`);
        } else {
          Alert.alert("Error", `Failed to deny business: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Error denying business:", err);
      if (Platform.OS === "web") {
        window.alert(`Failed to deny business: ${err instanceof Error ? err.message : "Unknown error"}`);
      } else {
        Alert.alert(
          "Error",
          `Failed to deny business: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedBusiness(null);
  };

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async () => {
    console.log("DELETE BUTTON CLICKED - handleDeleteUser called");

    if (!selectedUser) {
      console.log("No selected user");
      return;
    }

    console.log("Selected user:", selectedUser.id, selectedUser.userName);

    // Handle web platform differently
    if (Platform.OS === "web") {
      console.log("Platform is web, using window.confirm");
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedUser.userFullName || selectedUser.userName}? This action cannot be undone.`
      );

      if (!confirmed) {
        console.log("Delete user cancelled (web)");
        return;
      }

      console.log("DELETE USER CONFIRMED (web) - Starting deletion process");
      await performDeleteUser();
    } else {
      // Mobile platform - use Alert.alert with buttons
      Alert.alert(
        "Delete User",
        `Are you sure you want to delete ${selectedUser.userFullName || selectedUser.userName}? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => console.log("Delete cancelled")
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              console.log("DELETE CONFIRMED - Starting deletion process");
              await performDeleteUser();
            },
          },
        ]
      );
    }
  };

  const performDeleteUser = async () => {
    if (!selectedUser) return;

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
          ? "http://10.0.2.2:5162/api/appadmin"
          : "http://localhost:5162/api/appadmin";

      const deleteUrl = `${API_BASE}/users/${selectedUser.id}`;
      console.log("DELETE URL:", deleteUrl);

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
        console.log("Delete successful");
        setShowUserModal(false);
        setSelectedUser(null);
        loadAllUsers();

        if (Platform.OS === "web") {
          window.alert("User deleted successfully");
        } else {
          Alert.alert("Success", "User deleted successfully");
        }
      } else {
        const errorText = await resp.text();
        console.log("Delete failed:", errorText);
        if (Platform.OS === "web") {
          window.alert(`Failed to delete user: ${errorText}`);
        } else {
          Alert.alert("Error", `Failed to delete user: ${errorText}`);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (Platform.OS === "web") {
        window.alert(`Failed to delete user: ${err instanceof Error ? err.message : "Unknown error"}`);
      } else {
        Alert.alert(
          "Error",
          `Failed to delete user: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }
  };

  const handleCancelUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const getStatusBadgeStyle = (status: ApprovalStatus) => {
    switch (status) {
      case "Approved":
        return styles.badgeApproved;
      case "Denied":
        return styles.badgeDenied;
      default:
        return styles.badgePending;
    }
  };

  const getStatusBadgeIcon = (status: ApprovalStatus) => {
    switch (status) {
      case "Approved":
        return "checkmark-circle";
      case "Denied":
        return "close-circle";
      default:
        return "alert-circle";
    }
  };

  const getStatusBadgeText = (status: ApprovalStatus) => {
    switch (status) {
      case "Approved":
        return "Approved";
      case "Denied":
        return "Denied";
      default:
        return "Needs Approval";
    }
  };

  const getStatusBadgeColor = (status: ApprovalStatus) => {
    switch (status) {
      case "Approved":
        return "#10b981";
      case "Denied":
        return "#ef4444";
      default:
        return "#f97316";
    }
  };

  const renderItem = ({ item }: { item: Business }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleBusinessPress(item)}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={getStatusBadgeStyle(item.status)}>
            <Ionicons
              name={getStatusBadgeIcon(item.status)}
              size={14}
              color={getStatusBadgeColor(item.status)}
            />
            <Text
              style={[
                styles.badgeTextPending,
                { color: getStatusBadgeColor(item.status) },
              ]}
            >
              {getStatusBadgeText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.email}>
          {item.owner?.userEmail || "No email provided"}
        </Text>
        <Text style={styles.role}>
          Owner: {item.owner?.userFullName || item.owner?.userName || "Unknown"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderAllUsersTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006400" />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Users will appear here once registered
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => handleUserPress(item)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.userFullName || item.userName || "Unknown User"}
                </Text>
                <Text style={styles.email}>
                  {item.email || item.userEmail || "No email"}
                </Text>
                <Text style={styles.role}>
                  Role: {item.roles.length > 0 ? item.roles.join(", ") : "No role"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );

  const renderBusinessRequestsTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#006400" />
        </View>
      ) : businesses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No pending approvals</Text>
          <Text style={styles.emptySubtext}>
            All business applications have been processed
          </Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(i) => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "allUsers" && styles.activeTab]}
          onPress={() => setActiveTab("allUsers")}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === "allUsers" ? "#006400" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "allUsers" && styles.activeTabText,
            ]}
          >
            All Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "businessRequests" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("businessRequests")}
        >
          <Ionicons
            name="briefcase-outline"
            size={20}
            color={activeTab === "businessRequests" ? "#006400" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "businessRequests" && styles.activeTabText,
            ]}
          >
            Business Requests
          </Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "allUsers"
        ? renderAllUsersTab()
        : renderBusinessRequestsTab()}

      {/* User Profile Modal */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelUserModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity onPress={handleCancelUserModal}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedUser && (
                <>
                  <Text style={styles.sectionTitle}>User Details</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Full Name:</Text>
                    <Text style={styles.value}>
                      {selectedUser.userFullName || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Username:</Text>
                    <Text style={styles.value}>
                      {selectedUser.userName || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>
                      {selectedUser.email || selectedUser.userEmail || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone Number:</Text>
                    <Text style={styles.value}>
                      {selectedUser.userPhoneNumber || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Location:</Text>
                    <Text style={styles.value}>
                      {selectedUser.location || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>
                      {selectedUser.address || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Account Type:</Text>
                    <Text style={styles.value}>
                      {selectedUser.accountType || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Roles:</Text>
                    <Text style={styles.value}>
                      {selectedUser.roles.length > 0
                        ? selectedUser.roles.join(", ")
                        : "No roles assigned"}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDeny]}
                onPress={handleDeleteUser}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Delete Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCancel]}
                onPress={handleCancelUserModal}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Business Profile Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Business Profile</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedBusiness && (
                <>
                  <Text style={styles.sectionTitle}>Business Details</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Business Name:</Text>
                    <Text style={styles.value}>{selectedBusiness.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Business Address:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.address || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Business License:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.licenseNumber || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Business Phone:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.phoneNumber || "N/A"}
                    </Text>
                  </View>

                  <Text style={styles.sectionTitle}>Owner Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Owner Name:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.owner?.userFullName ||
                        selectedBusiness.owner?.userName ||
                        "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Owner Email:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.owner?.userEmail || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Owner Phone:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.owner?.userPhoneNumber || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Owner Location:</Text>
                    <Text style={styles.value}>
                      {selectedBusiness.owner?.location || "N/A"}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnApprove]}
                onPress={handleApprove}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Approve Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnDeny]}
                onPress={handleDeny}
              >
                <Ionicons name="close" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>Deny Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnCancel]}
                onPress={handleCancel}
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
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", padding: 12, paddingBottom: 8 },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#006400",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#006400",
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
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
    textAlign: "center",
  },
  item: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "600" },
  email: { fontSize: 13, color: "#666", marginTop: 4 },
  role: { fontSize: 12, color: "#888", marginTop: 4 },

  // Approval badges
  badgePending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#fed7aa",
  },
  badgeApproved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
  },
  badgeDenied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
  },
  badgeTextPending: {
    fontSize: 12,
    fontWeight: "600",
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
    height: "95%",
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
    color: "#333",
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
    marginLeft: 0,
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
  btnDeny: {
    backgroundColor: "#ef4444",
  },
  btnCancel: {
    backgroundColor: "#e5e7eb",
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
});
