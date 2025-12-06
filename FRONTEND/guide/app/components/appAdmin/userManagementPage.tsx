import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ApprovalStatus = "pending" | "approved" | "denied";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  approvalStatus?: ApprovalStatus;
};

type BusinessProfile = {
  businessName: string;
  businessAddress: string;
  businessLicense: string;
  businessNumber: string;
  ownerName: string;
  ownerNumber: string;
  ownerAddress: string;
};

export default function UserManagementPage() {
  const [loading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@example.com",
      role: "User",
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob@example.com",
      role: "Business",
      approvalStatus: "pending",
    },
    {
      id: "3",
      name: "Carol Lee",
      email: "carol@example.com",
      role: "Admin",
    },
    {
      id: "4",
      name: "Diana Martinez",
      email: "diana@example.com",
      role: "Business",
      approvalStatus: "pending",
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Mock business data for each user
  const businessDataMap: Record<string, BusinessProfile> = {
    "2": {
      businessName: "Bob's Tech Solutions",
      businessAddress: "123 Main St, Tech City, CA 90001",
      businessLicense: "BL-2024-001234",
      businessNumber: "(555) 123-4567",
      ownerName: "Bob Smith",
      ownerNumber: "(555) 123-4567",
      ownerAddress: "456 Oak Ave, Tech City, CA 90002",
    },
    "4": {
      businessName: "Diana's Consulting Group",
      businessAddress: "789 Business Blvd, Corporate Town, NY 10001",
      businessLicense: "BL-2024-005678",
      businessNumber: "(555) 987-6543",
      ownerName: "Diana Martinez",
      ownerNumber: "(555) 987-6543",
      ownerAddress: "321 Pine Ln, Corporate Town, NY 10002",
    },
  };

  const getBusinessData = (userId: string): BusinessProfile | null => {
    return businessDataMap[userId] || null;
  };

  const handleUserPress = (user: UserItem) => {
    if (user.role === "Business" && user.approvalStatus === "pending") {
      setSelectedUser(user);
      setShowModal(true);
    }
  };

  const handleApprove = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, approvalStatus: "approved" } : u
      )
    );
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleDeny = () => {
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id ? { ...u, approvalStatus: "denied" } : u
      )
    );
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const getApprovalBadge = (status?: ApprovalStatus) => {
    if (!status) return null;
    if (status === "pending") {
      return (
        <View style={styles.badgePending}>
          <Ionicons name="alert-circle" size={14} color="#f97316" />
          <Text style={styles.badgeTextPending}>Need Approval</Text>
        </View>
      );
    }
    if (status === "approved") {
      return (
        <View style={styles.badgeApproved}>
          <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
          <Text style={styles.badgeTextApproved}>Approved</Text>
        </View>
      );
    }
    if (status === "denied") {
      return (
        <View style={styles.badgeDenied}>
          <Ionicons name="close-circle" size={14} color="#ef4444" />
          <Text style={styles.badgeTextDenied}>Denied</Text>
        </View>
      );
    }
  };

  const renderItem = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleUserPress(item)}
      activeOpacity={item.approvalStatus === "pending" ? 0.7 : 1}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.name}>{item.name}</Text>
          {getApprovalBadge(item.approvalStatus)}
        </View>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>{item.role}</Text>
      </View>
      {item.role === "Business" && item.approvalStatus === "pending" && (
        <Ionicons name="chevron-forward" size={20} color="#999" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      )}

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
              {selectedUser && (
                <>
                  <Text style={styles.sectionTitle}>User Information</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>{selectedUser.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{selectedUser.email}</Text>
                  </View>

                  {getBusinessData(selectedUser.id) && (
                    <>
                      <Text style={styles.sectionTitle}>Business Details</Text>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Business Name:</Text>
                        <Text style={styles.value}>
                          {getBusinessData(selectedUser.id)?.businessName}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Business Address:</Text>
                        <Text style={styles.value}>
                          {getBusinessData(selectedUser.id)?.businessAddress}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Business License:</Text>
                        <Text style={styles.value}>
                          {getBusinessData(selectedUser.id)?.businessLicense}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Business Number:</Text>
                        <Text style={styles.value}>
                          {getBusinessData(selectedUser.id)?.businessNumber}
                        </Text>
                      </View>

                      <Text style={styles.sectionTitle}>Owner Information</Text>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Owner Name:</Text>
                        <Text style={styles.value}>
                          {getBusinessData(selectedUser.id)?.ownerName}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Owner Number:</Text>
                        <Text style={styles.value}>
                          {getBusinessData(selectedUser.id)?.ownerNumber}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Owner Address:</Text>
                        <Text style={styles.value}>
                          {getBusinessData(selectedUser.id)?.ownerAddress}
                        </Text>
                      </View>
                    </>
                  )}
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
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700", padding: 12 },
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
  email: { fontSize: 13, color: "#666" },
  role: { fontSize: 12, color: "#888", marginTop: 4 },
  actions: { flexDirection: "row", gap: 8 },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#eef2ff",
    marginLeft: 8,
  },
  btnDanger: { backgroundColor: "#ef4444" },
  btnText: { color: "#2563eb", fontWeight: "600" },

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
  badgeTextPending: {
    fontSize: 12,
    color: "#f97316",
    fontWeight: "600",
  },
  badgeApproved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
  },
  badgeTextApproved: {
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "600",
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
  badgeTextDenied: {
    fontSize: 12,
    color: "#ef4444",
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
