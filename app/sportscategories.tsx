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
  FlatList,
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

interface Team {
  name: string;
  logo?: string;
  score?: string;
  homeAway?: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      name: string;
      description: string;
    };
  };
  competitions: {
    competitors: Team[];
    status: {
      type: {
        description: string;
      };
    };
  }[];
}

interface League {
  id: string;
  name: string;
  logo: string;
  events: Event[];
}

const SportsCategories = () => {
  const navigation = useNavigation();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handlePress = (route: string) => {
    navigation.navigate(route.replace("/", "") as never);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?lang=en&region=gb&calendartype=whitelist&limit=100&dates=20250420&league=eng.1",
        );
        const data = await response.json();

        const leagueData: League = {
          id: data.leagues[0].id,
          name: data.leagues[0].name,
          logo: data.leagues[0].logos[0].href,
          events: data.events.map((event: any) => ({
            id: event.id,
            name: event.name,
            date: event.date,
            status: event.status,
            competitions: event.competitions.map((comp: any) => ({
              competitors: comp.competitors.map((team: any) => ({
                name: team.team.displayName,
                logo: team.team.logos?.[0]?.href,
                score: team.score,
                homeAway: team.homeAway,
              })),
              status: comp.status,
            })),
          })),
        };

        setLeagues([leagueData]);
      } catch (err) {
        setError("Failed to fetch data from ESPN API");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderEventItem = ({ item }: { item: Event }) => {
    const competition = item.competitions[0];
    const homeTeam = competition.competitors.find((t) => t.homeAway === "home");
    const awayTeam = competition.competitors.find((t) => t.homeAway === "away");

    return (
      <View style={styles.eventContainer}>
        <Text style={styles.eventName}>{item.name}</Text>
        <Text style={styles.eventDate}>
          {new Date(item.date).toLocaleString()}
        </Text>
        <Text style={styles.eventStatus}>
          Status: {item.status.type.description}
        </Text>

        <View style={styles.teamsContainer}>
          {homeTeam && (
            <View style={styles.teamContainer}>
              {homeTeam.logo && (
                <Image
                  source={{ uri: homeTeam.logo }}
                  style={styles.teamLogo}
                />
              )}
              <Text style={styles.teamName}>{homeTeam.name}</Text>
              <Text style={styles.teamScore}>{homeTeam.score || "0"}</Text>
            </View>
          )}

          <Text style={styles.vsText}>vs</Text>

          {awayTeam && (
            <View style={styles.teamContainer}>
              {awayTeam.logo && (
                <Image
                  source={{ uri: awayTeam.logo }}
                  style={styles.teamLogo}
                />
              )}
              <Text style={styles.teamName}>{awayTeam.name}</Text>
              <Text style={styles.teamScore}>{awayTeam.score || "0"}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* News Section */}
      <View style={styles.newsPanel}>
        <Text style={styles.newsTitle}>⚽ ESPN Football Updates</Text>

        {loading ? (
          <ActivityIndicator size="small" color="#0000ff" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : leagues.length > 0 ? (
          <>
            <View style={styles.leagueHeader}>
              <Image
                source={{ uri: leagues[0].logo }}
                style={styles.leagueLogo}
              />
              <Text style={styles.leagueName}>{leagues[0].name}</Text>
            </View>

            <FlatList
              data={leagues[0].events}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.eventsList}
            />
          </>
        ) : (
          <Text style={styles.noEventsText}>No events available</Text>
        )}
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
    textAlign: "center",
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  leagueLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: "600",
  },
  eventsList: {
    paddingBottom: 20,
  },
  eventContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  eventStatus: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 10,
    color: "#555",
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  teamContainer: {
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  teamName: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 3,
  },
  teamScore: {
    fontSize: 14,
    fontWeight: "bold",
  },
  vsText: {
    fontSize: 12,
    marginHorizontal: 5,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  noEventsText: {
    textAlign: "center",
    color: "#666",
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
  },
  cardPressed: {
    backgroundColor: "#dceeff",
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
});
