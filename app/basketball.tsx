import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import axios from "axios";

const API_KEY = "1d65b111377ba2e919cdbc2e0c31b738";

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface Score {
  total: number | null;
}

interface Game {
  id: number;
  date: string;
  time: string;
  status: { long: string };
  country: { name: string; flag: string };
  league: { name: string; logo: string; season: number };
  teams: { home: Team; away: Team };
  scores: { home: Score; away: Score };
}

interface PlayerStat {
  player: {
    firstname: string;
    lastname: string;
    photo: string;
  };
  statistics: {
    points: number;
    assists: number;
    rebounds: number;
    minutes: string;
  };
}

const BasketballLiveScreen = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState<Record<number, PlayerStat[]>>(
    {},
  );
  const [matchStats, setMatchStats] = useState<Record<number, any>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await axios.get(
        `https://v1.basketball.api-sports.io/games?date=${today}`,
        {
          headers: {
            "x-rapidapi-host": "v1.basketball.api-sports.io",
            "x-rapidapi-key": API_KEY,
          },
        },
      );

      const gameList: Game[] = data.response;
      setGames(gameList);

      for (let game of gameList) {
        fetchPlayerStats(game.id);
        fetchMatchStats(game.id);
      }
    } catch (err) {
      setError("Failed to fetch games.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerStats = async (gameId: number) => {
    try {
      const { data } = await axios.get(
        `https://v1.basketball.api-sports.io/players?game=${gameId}`,
        {
          headers: {
            "x-rapidapi-host": "v1.basketball.api-sports.io",
            "x-rapidapi-key": API_KEY,
          },
        },
      );

      const stats: PlayerStat[] = data.response.map((item: any) => ({
        player: item.player,
        statistics: item.statistics[0],
      }));

      setPlayerStats((prev) => ({ ...prev, [gameId]: stats }));
    } catch (err) {
      console.error("Failed to fetch player stats for game", gameId, err);
    }
  };

  const fetchMatchStats = async (gameId: number) => {
    try {
      const { data } = await axios.get(
        `https://v1.basketball.api-sports.io/statistics?game=${gameId}`,
        {
          headers: {
            "x-rapidapi-host": "v1.basketball.api-sports.io",
            "x-rapidapi-key": API_KEY,
          },
        },
      );

      setMatchStats((prev) => ({ ...prev, [gameId]: data.response }));
    } catch (err) {
      console.error("Failed to fetch match stats for game", gameId, err);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading matches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  }

  const renderGame = ({ item }: { item: Game }) => {
    const stats = matchStats[item.id] || [];
    const players = playerStats[item.id] || [];

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Image source={{ uri: item.league.logo }} style={styles.logo} />
          <Text style={styles.headerText}>{item.league.name}</Text>
        </View>

        <Text style={styles.subHeader}>
          {item.teams.home.name} vs {item.teams.away.name}
        </Text>
        <Text style={styles.score}>
          {item.scores.home.total ?? "-"} - {item.scores.away.total ?? "-"}
        </Text>
        <Text style={styles.status}>{item.status.long}</Text>

        <Text style={styles.sectionTitle}>Match Stats</Text>
        {stats.length > 0 ? (
          stats.map((stat: any, idx: number) => (
            <Text key={idx} style={styles.statLine}>
              {stat.team.name}:{" "}
              {stat.statistics
                .map((s: any) => `${s.type}: ${s.value}`)
                .join(", ")}
            </Text>
          ))
        ) : (
          <Text style={styles.infoText}>No match stats available.</Text>
        )}

        <Text style={styles.sectionTitle}>Top Players</Text>
        {players.length > 0 ? (
          players.slice(0, 4).map((p, i) => (
            <View key={i} style={styles.playerCard}>
              <Image
                source={{ uri: p.player.photo }}
                style={styles.playerImage}
              />
              <View>
                <Text style={styles.playerName}>
                  {p.player.firstname} {p.player.lastname}
                </Text>
                <Text style={styles.playerStats}>
                  Pts: {p.statistics.points}, Reb: {p.statistics.rebounds}, Ast:{" "}
                  {p.statistics.assists}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.infoText}>No player stats available.</Text>
        )}

        <Text style={styles.sectionTitle}>Win Probability</Text>
        <Text style={styles.probability}>Home: 48% | Away: 52%</Text>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FlatList
        data={games}
        renderItem={renderGame}
        keyExtractor={(item) => item.id.toString()}
      />
    </ScrollView>
  );
};

export default BasketballLiveScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f2f2f2",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
  },
  subHeader: {
    fontSize: 14,
    fontWeight: "500",
    marginVertical: 4,
  },
  score: {
    fontSize: 20,
    fontWeight: "800",
    color: "#673AB7",
  },
  status: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  statLine: {
    fontSize: 12,
    color: "#333",
  },
  infoText: {
    fontSize: 12,
    color: "#777",
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  playerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  playerName: {
    fontWeight: "500",
  },
  playerStats: {
    fontSize: 12,
    color: "#555",
  },
  probability: {
    fontSize: 13,
    color: "#009688",
    fontWeight: "600",
    marginTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
