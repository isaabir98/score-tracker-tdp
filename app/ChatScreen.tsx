import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/constants/firebaseConfig";

interface Message {
  id: string;
  text: string;
  createdAt: Date;
}

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs
        .map((doc) => {
          const data = doc.data() as DocumentData;
          const createdAt = data.createdAt?.toDate?.();
          if (!createdAt) return null;
          return {
            id: doc.id,
            text: data.text,
            createdAt,
          };
        })
        .filter(Boolean) as Message[];

      setMessages(fetched);
    });

    return unsubscribe;
  }, []);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: trimmed,
        createdAt: serverTimestamp(), // uses Firestore server time
      });
      setText(""); // Clear input
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={styles.messageWrapper}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          inverted
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesContainer}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#aaa"
          />
          <Pressable style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0f24",
  },
  container: {
    flex: 1,
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 80,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: "flex-start",
  },
  messageBubble: {
    backgroundColor: "#1e90ff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1f3c",
    padding: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#2a2f4c",
    color: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#ffcc00",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
});
