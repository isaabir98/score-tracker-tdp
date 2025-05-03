import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import axios from "axios";

const LiveMatchStatsPage = () => {
  const [fixtures, setFixtures] = useState([]);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SofaScore API endpoints
  const SOFASCORE_API = "https://api.sofascore.com/api/v1";

  // Fetch live matches from SofaScore
  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${SOFASCORE_API}/sport/football/events/live`,
      );
      setFixtures(response.data.events);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch match details
  const fetchFixtureDetails = async (fixture) => {
    try {
      setSelectedFixture(fixture);
      setLoading(true);

      const [incidentsResponse, statisticsResponse] = await Promise.all([
        axios.get(`${SOFASCORE_API}/event/${fixture.id}/incidents`),
        axios.get(`${SOFASCORE_API}/event/${fixture.id}/statistics`),
      ]);

      setCommentary(incidentsResponse.data.incidents);
      setPlayerStats(statisticsResponse.data.statistics);
    } catch (error) {
      console.error("Error fetching fixture details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMatches();
  };

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const renderMatchCard = ({ item }) => {
    const isLive = item.status.type === "inprogress";

    return (
      <TouchableOpacity
        style={[
          styles.matchCard,
          selectedFixture?.id === item.id && styles.selectedMatchCard,
          isLive && styles.liveMatchCard,
        ]}
        onPress={() => fetchFixtureDetails(item)}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.leagueName}>{item.tournament.name}</Text>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.team}>
            <Image
              source={{
                uri: `https://api.sofascore.com/api/v1/team/${item.homeTeam.id}/image`,
              }}
              style={styles.teamLogo}
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {item.homeTeam.name}
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              {item.homeScore.current || 0} - {item.awayScore.current || 0}
            </Text>
            <Text style={styles.matchTime}>{item.time.currentTime || 0}'</Text>
          </View>

          <View style={styles.team}>
            <Image
              source={{
                uri: `https://api.sofascore.com/api/v1/team/${item.awayTeam.id}/image`,
              }}
              style={styles.teamLogo}
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {item.awayTeam.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEventItem = ({ item }) => {
    const getEventIcon = () => {
      switch (item.incidentType) {
        case "goal":
          return "⚽";
        case "card":
          return "🟨";
        case "substitution":
          return "🔄";
        default:
          return "•";
      }
    };

    return (
      <View style={styles.eventItem}>
        <Text style={styles.eventTime}>{item.time}'</Text>
        <View style={styles.eventDetail}>
          <Text style={styles.eventTeam}>{item.team?.name || ""}</Text>
          <Text style={styles.eventText}>
            {getEventIcon()} {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderStatItem = ({ item }) => (
    <View style={styles.statItem}>
      <Text style={styles.statName}>{item.name}</Text>
      <View style={styles.statBarContainer}>
        <View style={[styles.statBar, { width: `${item.homeValue}%` }]} />
        <Text style={styles.statValue}>{item.homeValue}%</Text>
        <Text style={styles.statValue}>{item.awayValue}%</Text>
        <View
          style={[
            styles.statBar,
            { width: `${item.awayValue}%`, backgroundColor: "#3498db" },
          ]}
        />
      </View>
    </View>
  );

  if (loading && !fixtures.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3a7bd5" />
        <Text style={styles.loadingText}>Loading live matches...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>⚽ Live Football Matches</Text>

      {fixtures.length === 0 ? (
        <View style={styles.noMatchesContainer}>
          <Text style={styles.noMatchesText}>No live matches currently</Text>
        </View>
      ) : (
        <>
          <FlatList
            horizontal
            data={fixtures}
            renderItem={renderMatchCard}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
          />

          {selectedFixture && (
            <View style={styles.detailsContainer}>
              <View style={styles.matchSummary}>
                <View style={styles.summaryTeams}>
                  <View style={styles.summaryTeam}>
                    <Image
                      source={{
                        uri: `https://api.sofascore.com/api/v1/team/${selectedFixture.homeTeam.id}/image`,
                      }}
                      style={styles.summaryLogo}
                    />
                    <Text style={styles.summaryTeamName}>
                      {selectedFixture.homeTeam.name}
                    </Text>
                  </View>
                  <Text style={styles.summaryScore}>
                    {selectedFixture.homeScore.current || 0} -{" "}
                    {selectedFixture.awayScore.current || 0}
                  </Text>
                  <View style={styles.summaryTeam}>
                    <Image
                      source={{
                        uri: `https://api.sofascore.com/api/v1/team/${selectedFixture.awayTeam.id}/image`,
                      }}
                      style={styles.summaryLogo}
                    />
                    <Text style={styles.summaryTeamName}>
                      {selectedFixture.awayTeam.name}
                    </Text>
                  </View>
                </View>
                <Text style={styles.matchStatus}>
                  {selectedFixture.status.description} (
                  {selectedFixture.time.currentTime}')
                </Text>
              </View>

              <Text style={styles.sectionHeader}>Match Statistics</Text>
              {playerStats.length > 0 ? (
                <FlatList
                  data={playerStats[0].groups.flatMap(
                    (group) => group.statisticsItems,
                  )}
                  renderItem={renderStatItem}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.noDataText}>No statistics available</Text>
              )}

              <Text style={styles.sectionHeader}>Match Events</Text>
              {commentary.length > 0 ? (
                <FlatList
                  data={commentary}
                  renderItem={renderEventItem}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.noDataText}>No events available yet</Text>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  noMatchesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noMatchesText: {
    fontSize: 18,
    color: "#666",
  },
  matchesList: {
    paddingBottom: 10,
  },
  matchCard: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveMatchCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#e74c3c",
  },
  selectedMatchCard: {
    borderWidth: 2,
    borderColor: "#3a7bd5",
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leagueName: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    marginRight: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  team: {
    alignItems: "center",
    flex: 1,
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  scoreContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  matchTime: {
    fontSize: 12,
    color: "#666",
  },
  detailsContainer: {
    marginTop: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchSummary: {
    marginBottom: 20,
  },
  summaryTeams: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryTeam: {
    alignItems: "center",
    flex: 1,
  },
  summaryLogo: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  summaryTeamName: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  summaryScore: {
    fontSize: 28,
    fontWeight: "bold",
    paddingHorizontal: 15,
    color: "#3a7bd5",
  },
  matchStatus: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  eventItem: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  eventTime: {
    width: 30,
    fontWeight: "bold",
    color: "#3a7bd5",
  },
  eventDetail: {
    flex: 1,
  },
  eventTeam: {
    fontSize: 12,
    color: "#666",
  },
  eventText: {
    fontSize: 14,
  },
  statItem: {
    marginBottom: 10,
  },
  statName: {
    fontSize: 14,
    marginBottom: 5,
    color: "#333",
  },
  statBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statBar: {
    height: 8,
    backgroundColor: "#e74c3c",
    borderRadius: 4,
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 12,
    width: 40,
    textAlign: "center",
  },
  noDataText: {
    color: "#888",
    textAlign: "center",
    marginVertical: 10,
  },
});

export default LiveMatchStatsPage;
