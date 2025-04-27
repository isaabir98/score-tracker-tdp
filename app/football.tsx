import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import axios from "axios";

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
    goals?: {
      home?: number | null;
      away?: number | null;
    };
  };
  teams?: {
    home?: Team;
    away?: Team;
  };
  league?: {
    name?: string;
    country?: string;
    logo?: string;
  };
}

const SoccerFixturesScreen = () => {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate 3 second delay for API response
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const response = await axios.get(
          "https://v3.football.api-sports.io/fixtures?date=2025-04-24",
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
  }, []);

  const renderItem = ({ item }: { item: Match }) => {
    const fixture = item.fixture || {};
    const league = item.league || {};
    const teams = item.teams || {};
    const homeTeam = teams.home || {};
    const awayTeam = teams.away || {};
    const goals = fixture.goals || {};

    const homeGoals = goals.home;
    const awayGoals = goals.away;

    return (
      <View style={styles.matchContainer}>
        {/* League Info */}
        {league.logo && (
          <View style={styles.leagueInfo}>
            <Image
              source={{ uri: league.logo }}
              style={styles.leagueLogo}
              resizeMode="contain"
            />
            <Text style={styles.leagueText}>
              {league.name || "Unknown League"} •{" "}
              {league.country || "Unknown Country"}
            </Text>
          </View>
        )}

        {/* Teams */}
        <View style={styles.teamsContainer}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <Image
              source={{
                uri:
                  homeTeam.logo ||
                  "https://via.placeholder.com/60x60?text=HOME",
              }}
              style={styles.teamLogo}
              resizeMode="contain"
            />
            <Text style={styles.teamName}>{homeTeam.name || "Home Team"}</Text>
          </View>

          {/* VS and Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.vsText}>VS</Text>
            {homeGoals !== null &&
              homeGoals !== undefined &&
              awayGoals !== null &&
              awayGoals !== undefined && (
                <Text style={styles.scoreText}>
                  {homeGoals} - {awayGoals}
                </Text>
              )}
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <Image
              source={{
                uri:
                  awayTeam.logo ||
                  "https://via.placeholder.com/60x60?text=AWAY",
              }}
              style={styles.teamLogo}
              resizeMode="contain"
            />
            <Text style={styles.teamName}>{awayTeam.name || "Away Team"}</Text>
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
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Matches</Text>
      <FlatList
        data={fixtures}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.fixture?.id?.toString() || `match-${index}`
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matches today</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#1a1a1a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#d9534f",
    fontSize: 16,
    textAlign: "center",
  },
  matchContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  leagueInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  leagueLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  leagueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
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
    width: 55,
    height: 55,
    marginBottom: 6,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  scoreContainer: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e88e5",
    marginTop: 6,
  },
  matchDetails: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
    marginTop: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#777",
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default SoccerFixturesScreen;
