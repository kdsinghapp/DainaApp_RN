import React, { useState } from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StatusBarComponent from "../../../compoent/StatusBarCompoent";
import CustomHeader from "../../../compoent/CustomHeader";
import font from "../../../theme/font";
import imageIndex from "../../../assets/imageIndex";
import strings from "../../../localization/Localization";

const WalletScreen = () => {
  const [balance, setBalance] = useState(12256.0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");

  const transactions: any = [

  ];

  const handleConfirm = () => {
    const enteredAmount = parseFloat(amount);
    if (!enteredAmount || enteredAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (modalType === "add") {
      setBalance((prev) => prev + enteredAmount);
      // 👉 Add API call here
    } else if (modalType === "withdraw") {
      if (enteredAmount > balance) {
        alert("Insufficient balance!");
        return;
      }
      setBalance((prev) => prev - enteredAmount);
      // 👉 Withdraw API call here
    }

    setModalVisible(false);
    setAmount("");
    setModalType(null);
  };

  const renderTransaction = ({ item }: any) => (
    <View style={styles.transactionRow}>
      <View>
        <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Image
          source={item.type === "in" ? imageIndex.Iconreceiv : imageIndex.IconRed}
          style={{ width: 24, height: 24 }}
        />
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarComponent />
      <CustomHeader label={strings.Wallet} />
      <View style={{
        marginHorizontal: 15
      }}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceText}>{strings.AvailableBalance}</Text>
          <Text style={styles.balanceAmount}>$ 00</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => {
                setModalType("withdraw");
                setModalVisible(true);
              }}
            >
              <Text style={styles.btnText}>{strings.Withdraw}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setModalType("add");
                setModalVisible(true);
              }}
            >
              <Text style={styles.btnText}>{strings.AddAmount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions List */}
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
      {/* Custom Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {modalType === "add" ? `💳 ${strings.AddMoney}` : `🏧 ${strings.WithdrawMoney}`}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={strings.EnterAmount}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#E0E0E0" }]}
                onPress={() => {
                  setModalVisible(false);
                  setAmount("");
                }}
              >
                <Text style={[styles.modalBtnText, { color: "#333" }]}>
                  {strings.Cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#FFCC00" }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.modalBtnText, { color: "#000" }]}>
                  {strings.Confirm}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  balanceCard: {
    backgroundColor: "#FFCC00",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  balanceText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 5,
    fontFamily: font.MonolithRegular,
  },
  balanceAmount: {
    fontSize: 30,
    color: "#2F4858",
    marginBottom: 15,
    fontFamily: font.MonolithRegular,
  },
  buttonRow: { flexDirection: "row", gap: 10 },
  withdrawBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    borderWidth: 1.6,
    borderColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#000",
    fontFamily: font.MonolithRegular,
    fontSize: 15,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  amount: { fontSize: 18, fontFamily: font.MonolithRegular, color: "black" },
  name: { color: "#666", fontFamily: font.MonolithRegular, marginTop: 5 },
  date: {
    color: "#888",
    fontSize: 12,
    textAlign: "right",
    fontFamily: font.MonolithRegular,
    marginTop: 5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 15,
    fontFamily: font.MonolithRegular,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    width: "100%",
    marginBottom: 20,
    textAlign: "center",
    fontSize: 16,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: {
    fontFamily: font.MonolithRegular,
    fontSize: 15,
  },
});

export default WalletScreen;
