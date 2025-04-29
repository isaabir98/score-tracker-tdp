import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

interface Team {
  id?: number;
  name?: string;
  logo?: string;
  winner?: boolean | null;
}

interface Match {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      long?: string;
      short?: string;
    };
    venue?: {
      name?: string;
      city?: string;
    };
  };
  league?: {
    name?: string;
    country?: string;
    logo?: string;
  };
  teams?: {
    home?: Team;
    away?: Team;
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
  score?: {
    halftime?: {
      home?: number | null;
      away?: number | null;
    };
    fulltime?: {
      home?: number | null;
      away?: number | null;
    };
    extratime?: {
      home?: number | null;
      away?: number | null;
    };
    penalty?: {
      home?: number | null;
      away?: number | null;
    };
  };
}

const SoccerFixturesScreen = () => {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const response = await axios.get(
          `https://v3.football.api-sports.io/fixtures?date=${formattedDate}`,
          {
            headers: {
              "x-rapidapi-key": "1d65b111377ba2e919cdbc2e0c31b738",
              "x-rapidapi-host": "v3.football.api-sports.io",
            },
          },
        );

        if (!response.data?.response) {
          throw new Error("Invalid API response structure");
        }

        setFixtures(response.data.response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formattedDate]);

  const renderItem = ({ item }: { item: Match }) => {
    const fixture = item.fixture || {};
    const league = item.league || {};
    const teams = item.teams || {};
    const homeTeam = teams.home || {};
    const awayTeam = teams.away || {};
    const goals = item.goals || {};
    const score = item.score || {};

    return (
      <View style={styles.matchContainer}>
        {/* League Info */}
        {league.logo && (
          <View style={styles.leagueInfo}>
            <Image source={{ uri: league.logo }} style={styles.leagueLogo} />
            <Text style={styles.leagueText}>
              {league.name} • {league.country}
            </Text>
          </View>
        )}

        {/* Teams and Score */}
        <View style={styles.teamsContainer}>
          <View style={styles.teamContainer}>
            <Image
              source={{
                uri:
                  homeTeam.logo ||
                  "https://via.placeholder.com/60x60?text=HOME",
              }}
              style={styles.teamLogo}
            />
            <Text style={styles.teamName}>{homeTeam.name || "Home"}</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.vsText}>VS</Text>
            {goals.home !== null && goals.away !== null && (
              <Text style={styles.scoreText}>
                {goals.home} - {goals.away}
              </Text>
            )}
          </View>

          <View style={styles.teamContainer}>
            <Image
              source={{
                uri:
                  awayTeam.logo ||
                  "https://via.placeholder.com/60x60?text=AWAY",
              }}
              style={styles.teamLogo}
            />
            <Text style={styles.teamName}>{awayTeam.name || "Away"}</Text>
          </View>
        </View>

        {/* Match Details */}
        <View style={styles.matchDetails}>
          <Text style={styles.detailText}>
            {fixture.date
              ? new Date(fixture.date).toLocaleString()
              : "Date not available"}
          </Text>
          <Text style={styles.detailText}>
            Status: {fixture.status?.long || "Unknown"}
          </Text>

          {/* Goals */}
          <Text style={styles.detailText}>
            Halftime: {score.halftime?.home ?? "-"} -{" "}
            {score.halftime?.away ?? "-"}
          </Text>
          <Text style={styles.detailText}>
            Venue:{" "}
            {fixture.venue?.name
              ? `${fixture.venue.name}, ${fixture.venue.city}`
              : "Unknown venue"}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading matches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: "red" }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🏆 Logo stays at the top */}
      <TouchableOpacity onPress={() => router.push("/sportscategories")}>
        <Image
          source={require("../assets/images/logo.png")} // adjust path if needed
          style={styles.topLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text style={styles.header}>Matches for {formattedDate}</Text>

      <FlatList
        data={fixtures}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.fixture?.id?.toString() || `match-${index}`
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No matches found for today</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  matchContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  leagueInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  leagueLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  leagueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  teamContainer: {
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  teamName: {
    fontSize: 13,
    textAlign: "center",
    color: "#333",
  },
  scoreContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  scoreText: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
  },
  matchDetails: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topLogo: {
    width: 120,
    height: 60,
    alignSelf: "center",
    marginBottom: 16,
  },
});

export default SoccerFixturesScreen;
