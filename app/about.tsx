import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons, FontAwesome5, Feather } from "@expo/vector-icons";

export default function AboutScreen() {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.title}>Score Tracker</Text>
      </View>

      <Text style={styles.sectionTitle}>About</Text>

      <View style={styles.descriptionBox}>
        <Text style={styles.description}>
          Score Tracker provides real-time football match updates, comprehensive
          statistics, and personalized notifications to keep you connected to
          every moment of the game.
        </Text>
        <Text style={styles.description}>
          Never miss a goal, card, or key play with our reliable live tracking
          features.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Live Football Features</Text>

      {features.map((feature, index) => (
        <View key={index} style={styles.featureCard}>
          <View style={styles.iconWrapper}>{feature.icon}</View>
          <View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.contact}>Contact: support@scoretracker.app</Text>
      </View>
    </ScrollView>
  );
}

const features = [
  {
    title: "Real-Time Updates",
    description: "Live scores with instant updates for all major leagues.",
    icon: <Feather name="clock" size={24} color="#f87171" />,
  },
  {
    title: "Match Statistics",
    description: "Comprehensive stats including possession, shots, and more.",
    icon: <Feather name="pie-chart" size={24} color="#f87171" />,
  },
  {
    title: "Live Commentary",
    description: "Play-by-play commentary and key match moments.",
    icon: <Feather name="radio" size={24} color="#f87171" />,
  },
  {
    title: "Team Lineups",
    description: "Starting XI, formations, and bench players for every match.",
    icon: <Feather name="users" size={24} color="#f87171" />,
  },
  {
    title: "Fixture Calendar",
    description: "Upcoming matches with reminders.",
    icon: <Feather name="calendar" size={24} color="#f87171" />,
  },
];

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#facc15",
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#93c5fd",
    marginBottom: 16,
  },
  descriptionBox: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  description: {
    color: "#e2e8f0",
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  iconWrapper: {
    marginRight: 12,
  },
  featureTitle: {
    color: "#facc15",
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 4,
  },
  featureDescription: {
    color: "#cbd5e1",
    fontSize: 14,
  },
  footer: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 16,
  },
  version: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 8,
  },
  contact: {
    fontSize: 14,
    color: "#93c5fd",
  },
});
