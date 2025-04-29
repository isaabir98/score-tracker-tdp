import React, { useEffect, useState } from "react";
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
  id: number;
  name: string;
  logo: string;
}

interface PeriodScore {
  home: number | null;
  away: number | null;
}

interface Game {
  id: number;
  date: string;
  time: string;
  status: {
    long: string;
    short: string;
  };
  country: {
    name: string;
    flag: string;
  };
  league: {
    name: string;
    logo: string;
    season: number;
  };
  teams: {
    home: Team;
    away: Team;
  };
  scores: {
    home: number | null;
    away: number | null;
  };
  periods: {
    first?: PeriodScore;
    second?: PeriodScore;
  };
}

const HandballFixturesScreen = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

  useEffect(() => {
    const fetchGames = async () => {
      try {
        await new Promise((res) => setTimeout(res, 1500));

        const response = await axios.get(
          `https://v1.handball.api-sports.io/games?date=${formattedDate}`,
          {
            headers: {
              "x-rapidapi-key": "1d65b111377ba2e919cdbc2e0c31b738",
              "x-rapidapi-host": "v1.handball.api-sports.io",
            },
          },
        );

        if (!response.data?.response) {
          throw new Error("Invalid API response structure");
        }

        setGames(response.data.response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [formattedDate]);

  const renderItem = ({ item }: { item: Game }) => {
    const { teams, league, country, scores, periods, date, status } = item;

    return (
      <View style={styles.matchContainer}>
        {/* League Info */}
        <View style={styles.leagueInfo}>
          {league.logo && (
            <Image source={{ uri: league.logo }} style={styles.leagueLogo} />
          )}
          <Text style={styles.leagueText}>
            {league.name} ({league.season})
          </Text>
        </View>

        {/* Country Info */}
        <View style={styles.countryInfo}>
          <Image source={{ uri: country.flag }} style={styles.countryFlag} />
          <Text style={styles.countryText}>{country.name}</Text>
        </View>

        {/* Teams and Scores */}
        <View style={styles.teamsContainer}>
          <View style={styles.teamContainer}>
            <Image source={{ uri: teams.home.logo }} style={styles.teamLogo} />
            <Text style={styles.teamName}>{teams.home.name}</Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.scoreText}>
              {scores.home ?? "-"} - {scores.away ?? "-"}
            </Text>
          </View>

          <View style={styles.teamContainer}>
            <Image source={{ uri: teams.away.logo }} style={styles.teamLogo} />
            <Text style={styles.teamName}>{teams.away.name}</Text>
          </View>
        </View>

        {/* Match Details */}
        <View style={styles.matchDetails}>
          <Text style={styles.detailText}>
            {new Date(date).toLocaleString()}
          </Text>
          <Text style={styles.detailText}>Status: {status.long}</Text>

          {/* Period Scores */}
          {periods.first && periods.second && (
            <View style={styles.periodContainer}>
              <Text style={styles.periodText}>
                1st Half: {periods.first.home ?? "-"} -{" "}
                {periods.first.away ?? "-"}
              </Text>
              <Text style={styles.periodText}>
                2nd Half: {periods.second.home ?? "-"} -{" "}
                {periods.second.away ?? "-"}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading handball games...</Text>
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
      {/* Logo + Navigation */}
      <TouchableOpacity onPress={() => router.push("/sportscategories")}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.topLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text style={styles.header}>Handball Games - {formattedDate}</Text>

      <FlatList
        data={games}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
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
  topLogo: {
    width: 120,
    height: 60,
    alignSelf: "center",
    marginBottom: 16,
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
    marginBottom: 8,
  },
  leagueLogo: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  leagueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  countryFlag: {
    width: 20,
    height: 14,
    marginRight: 6,
  },
  countryText: {
    fontSize: 13,
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
    color: "#4CAF50",
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
  periodContainer: {
    marginTop: 6,
  },
  periodText: {
    fontSize: 12,
    color: "#777",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HandballFixturesScreen;
