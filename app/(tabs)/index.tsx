import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Link } from "expo-router";

const app = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Score Tracker</Text>{" "}
      <Text style={styles.text}>Home screen</Text>
      <Link href="/about" style={styles.button}>
        Go to About screen
      </Link>{" "}
      <Link href="/login" style={styles.button}>
        Go to Login Screen
      </Link>
    </View>
  );
};

export default app;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
  text: {
    color: "white",
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
  },
  button: {
    color: "red",
  },
});
