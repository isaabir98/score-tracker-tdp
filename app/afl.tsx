import React, { useEffect, useState } from "react";
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
  id: number;
  name: string;
  logo: string;
}

interface Game {
  game: {
    id: number;
  };
  league: {
    id: number;
    season: number;
  };
  date: string;
  time: string;
  status: {
    long: string;
    short: string;
  };
  venue?: string;
  teams: {
    home: Team;
    away: Team;
  };
  scores: {
    home: {
      score: number;
    };
    away: {
      score: number;
    };
  };
}

const SoccerFixturesScreen = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        await new Promise((res) => setTimeout(res, 2000)); // simulate delay

        const response = await axios.get(
          "https://v1.afl.api-sports.io/games?date=2025-04-26",
          {
            headers: {
              "x-rapidapi-key": "1d65b111377ba2e919cdbc2e0c31b738",
              "x-rapidapi-host": "v1.afl.api-sports.io",
            },
          },
        );

        if (!response.data?.response) {
          throw new Error("Invalid API response structure");
        }

        setGames(response.data.response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const renderItem = ({ item }: { item: Game }) => {
    const { teams, date, status, scores } = item;

    return (
      <View style={styles.matchCard}>
        <View style={styles.teamRow}>
          <View style={styles.team}>
            <Image source={{ uri: teams.home.logo }} style={styles.logo} />
            <Text style={styles.name}>{teams.home.name}</Text>
          </View>

          <View style={styles.score}>
            <Text style={styles.vs}>VS</Text>
            <Text style={styles.scoreText}>
              {scores.home.score} - {scores.away.score}
            </Text>
          </View>

          <View style={styles.team}>
            <Image source={{ uri: teams.away.logo }} style={styles.logo} />
            <Text style={styles.name}>{teams.away.name}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailText}>
            {new Date(date).toLocaleString()}
          </Text>
          <Text style={styles.detailText}>Status: {status.long}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading AFL games...</Text>
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
      <Text style={styles.header}>AFL Fixtures - 26 April 2025</Text>
      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.game.id.toString()}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No games found for today</Text>
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
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  teamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  team: {
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    textAlign: "center",
  },
  score: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  vs: {
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
  details: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#555",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SoccerFixturesScreen;
