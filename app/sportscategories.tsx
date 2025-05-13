import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Linking,
  Modal,
  TouchableOpacity,
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

const SportsCategories = () => {
  const navigation = useNavigation();
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);

  const handlePress = (route: string) => {
    navigation.navigate(route.replace("/", "") as never);
  };

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://newsdata.io/api/1/news?apikey=pub_86626b9ca953ed8804e99caea2e91f42e6c45&category=sports&language=en",
        );
        const data = await response.json();
        const uniqueNews =
          data.results?.filter(
            (item: any, index: number, self: any[]) =>
              self.findIndex((t) => t.title === item.title) === index,
          ) || [];
        setHeadlines(uniqueNews);
      } catch (err) {
        setError("Failed to load news.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <View style={styles.container}>
      {/* News Modal */}
      <Modal visible={showNewsModal} animationType="slide" transparent={false}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🗞️ Sports News</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              headlines.map((article, index) => (
                <View key={index} style={styles.articleContainer}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  {article.image_url && (
                    <Image
                      source={{ uri: article.image_url }}
                      style={styles.articleImage}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={styles.articleDescription}>
                    {article.description}
                  </Text>
                  {article.link && (
                    <Text
                      style={styles.articleLink}
                      onPress={() => Linking.openURL(article.link)}
                    >
                      Read more
                    </Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowNewsModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Open News Button */}
      <Pressable
        style={styles.newsButton}
        onPress={() => setShowNewsModal(true)}
      >
        <Text style={styles.newsButtonText}>🗞️ News</Text>
      </Pressable>

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

      {/* Floating Chat Button */}
      <Pressable
        style={styles.chatButton}
        onPress={() => navigation.navigate("ChatScreen" as never)}
      >
        <Text style={styles.chatButtonText}>💬</Text>
      </Pressable>
    </View>
  );
};

export default SportsCategories;

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf0f6",
    paddingTop: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 10,
  },
  card: {
    width: width * 0.4,
    margin: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cardPressed: {
    backgroundColor: "#dceeff",
    transform: [{ scale: 0.97 }],
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  chatButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007bff",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatButtonText: {
    fontSize: 24,
    color: "#fff",
  },
  newsButton: {
    alignSelf: "center",
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 10,
  },
  newsButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  articleContainer: {
    marginBottom: 20,
  },
  articleTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 5,
  },
  articleImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  articleDescription: {
    fontSize: 12,
    color: "#444",
    marginTop: 4,
  },
  articleLink: {
    fontSize: 12,
    color: "#007bff",
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
});
