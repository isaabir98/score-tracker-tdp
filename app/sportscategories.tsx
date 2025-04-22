import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const sports = [
  {
    name: "Football",
    route: "/football",
    image: require("../assets/images/football.png"),
  },
  { name: "AFL", route: "/afl", image: require("../assets/images/afl.png") },
  {
    name: "Baseball",
    route: "/baseball",
    image: require("../assets/images/baseball.png"),
  },
  {
    name: "Basketball",
    route: "/basketball",
    image: require("../assets/images/basketball.png"),
  },
  {
    name: "Formula-1",
    route: "/formula-1",
    image: require("../assets/images/f1.png"),
  },
  {
    name: "Handball",
    route: "/handball",
    image: require("../assets/images/handball.png"),
  },
  {
    name: "Hockey",
    route: "/hockey",
    image: require("../assets/images/hockey.png"),
  },
  { name: "MMA", route: "/mma", image: require("../assets/images/mma.png") },
  { name: "NBA", route: "/nba", image: require("../assets/images/nba.png") },
  { name: "NFL", route: "/nfl", image: require("../assets/images/nfl.png") },
  {
    name: "Rugby",
    route: "/rugby",
    image: require("../assets/images/rugby.png"),
  },
  {
    name: "Volleyball",
    route: "/volleyball",
    image: require("../assets/images/volleyball.png"),
  },
];

const newsHeadlines = [
  "⚽ Real Madrid secures La Liga title!",
  "🏀 LeBron James hits 40 in Lakers win!",
  "🏎️ Max Verstappen dominates Grand Prix!",
];

const SportsCategories = () => {
  const navigation = useNavigation();

  const handlePress = (route: string) => {
    navigation.navigate(route.replace("/", "") as never);
  };

  return (
    <View style={styles.container}>
      {/* News Section */}
      <View style={styles.newsPanel}>
        <Text style={styles.newsTitle}>📰 Sports News</Text>
        {newsHeadlines.map((headline, index) => (
          <Text key={index} style={styles.newsItem}>
            • {headline}
          </Text>
        ))}
      </View>

      {/* Sports Categories Grid */}
      <ScrollView contentContainerStyle={styles.grid}>
        {sports.map((sport, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handlePress(sport.route)}
          >
            <Image source={sport.image} style={styles.image} />
            <Text style={styles.label}>{sport.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default SportsCategories;

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#eaf0f6",
  },
  newsPanel: {
    width: width * 0.3,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  newsItem: {
    fontSize: 14,
    marginBottom: 10,
    color: "#444",
  },
  grid: {
    flexGrow: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 10,
  },
  card: {
    width: width * 0.28,
    margin: 10,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    alignItems: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    transitionDuration: "150ms",
  },
  cardPressed: {
    backgroundColor: "#dceeff",
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: 150, // was 80
    height: 150, // was 80
    resizeMode: "contain",
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
});
