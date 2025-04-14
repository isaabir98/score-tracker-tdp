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

// Define the types for the API response
interface Team {
  name: string;
  logo?: string;
}

interface Fixture {
  id: number;
  date: string;
  status: {
    long: string;
    short: string;
  };
  timezone: string;
  referee: string | null;
  venue: {
    name: string;
    city: string;
  };
  league: {
    name: string;
    logo?: string;
    country: string;
    flag?: string;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface Match {
  fixture: Fixture;
  teams: {
    home: Team;
    away: Team;
  };
}

const SoccerFixturesScreen = () => {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFixtures = async () => {
      try {
        const response = await axios.get(
          "https://v3.football.api-sports.io/fixtures?date=2025-04-13",
          {
            headers: {
              "x-rapidapi-key": "1d65b111377ba2e919cdbc2e0c31b738",
              "x-rapidapi-host": "v3.football.api-sports.io",
            },
          },
        );
        setFixtures(response.data.response);
      } catch (error) {
        console.error("Error fetching live fixtures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFixtures();
  }, []);

  const renderItem = ({ item }: { item: Match }) => (
    <View style={styles.fixtureItem}>
      {/* League Logo */}
      {item.fixture.league.logo ? (
        <Image
          source={{ uri: item.fixture.league.logo }}
          style={styles.leagueLogo}
        />
      ) : (
        <Text>No League Logo</Text>
      )}

      <Text style={styles.fixtureTitle}>
        {item.teams.home.name} vs {item.teams.away.name}
      </Text>

      {/* Country Flag */}
      {item.fixture.league.flag ? (
        <Image
          source={{ uri: item.fixture.league.flag }}
          style={styles.countryFlag}
        />
      ) : (
        <Text>No Country Flag</Text>
      )}

      <Text style={styles.leagueName}>
        {item.fixture.league.name} - {item.fixture.league.country}
      </Text>

      {/* Match Date and Time */}
      <Text style={styles.fixtureDate}>
        Date: {new Date(item.fixture.date).toLocaleString()}
      </Text>

      {/* Referee */}
      {item.fixture.referee ? (
        <Text style={styles.fixtureReferee}>
          Referee: {item.fixture.referee}
        </Text>
      ) : (
        <Text>No Referee Info</Text>
      )}

      {/* Match Status */}
      <Text style={styles.fixtureStatus}>
        Status: {item.fixture.status.long}
      </Text>

      {/* Match Goals */}
      <Text style={styles.fixtureGoals}>
        Score:{" "}
        {item.fixture.goals.home !== null ? item.fixture.goals.home : "N/A"} -{" "}
        {item.fixture.goals.away !== null ? item.fixture.goals.away : "N/A"}
      </Text>

      {/* Venue Info */}
      <Text style={styles.fixtureVenue}>
        Venue: {item.fixture.venue.name}, {item.fixture.venue.city}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Soccer Fixtures</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={fixtures}
          renderItem={renderItem}
          keyExtractor={(item) => item.fixture.id.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  fixtureItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 4,
  },
  fixtureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fixtureDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  fixtureStatus: {
    fontSize: 14,
    color: "#007BFF",
  },
  fixtureGoals: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: "bold",
  },
  fixtureVenue: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  leagueName: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  leagueLogo: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  countryFlag: {
    width: 30,
    height: 20,
    marginBottom: 8,
  },
  fixtureReferee: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default SoccerFixturesScreen;
