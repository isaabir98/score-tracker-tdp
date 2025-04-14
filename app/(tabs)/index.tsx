import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Link } from "expo-router";

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Score Tracker</Text>
      <Text style={styles.subtitle}>Welcome to the Home Screen</Text>

      <Link href="/about" style={styles.button}>
        Go to About Screen
      </Link>
      <Link href="/login" style={styles.button}>
        Go to Login Screen
      </Link>
      <Link href="/signup" style={styles.button}>
        Go to Sign Up Screen
      </Link>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001F3F", // deep navy blue
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    color: "#FFD700", // gold
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#7FDBFF", // light blue
    fontSize: 20,
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#FF4136", // vibrant red
    color: "white",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 10,
    fontSize: 16,
    textAlign: "center",
    textTransform: "uppercase",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
