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
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("stats"); // 'stats', 'events', 'players'

  const SOFASCORE_API = "https://api.sofascore.com/api/v1";

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

  const fetchFixtureDetails = async (fixture) => {
    try {
      setSelectedFixture(fixture);
      setLoading(true);

      const incidentsRequest = axios.get(
        `${SOFASCORE_API}/event/${fixture.id}/incidents`,
      );

      const statisticsRequest = axios
        .get(`${SOFASCORE_API}/event/${fixture.id}/statistics`)
        .catch((err) => {
          if (err.response?.status === 404) {
            console.warn(
              "⚠️ Statistics not available for fixture:",
              fixture.id,
            );
            return null;
          }
          throw err;
        });

      const lineupsRequest = axios
        .get(`${SOFASCORE_API}/event/${fixture.id}/lineups`)
        .catch((err) => {
          if (err.response?.status === 404) {
            console.warn("⚠️ Lineups not available for fixture:", fixture.id);
            return null;
          }
          throw err;
        });

      const [incidentsResponse, statisticsResponse, lineupsResponse] =
        await Promise.all([
          incidentsRequest,
          statisticsRequest,
          lineupsRequest,
        ]);

      setCommentary(incidentsResponse.data.incidents);

      setPlayerStats(statisticsResponse?.data?.statistics || []);
      setHomePlayers(lineupsResponse?.data?.home?.players || []);
      setAwayPlayers(lineupsResponse?.data?.away?.players || []);
    } catch (error) {
      console.error("❌ Error fetching fixture details:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMatches();
  };

  useEffect(() => {
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRatingColor = (rating) => {
    if (rating >= 7.5) return "#4CAF50";
    if (rating >= 6.0) return "#FFC107";
    if (rating >= 4.5) return "#FF9800";
    return "#F44336";
  };

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
          if (item.incidentClass === "red") return "🟥";
          return "🟨";
        case "substitution":
          return "🔄";
        case "penalty":
          return "🎯";
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

  const renderPlayerItem = ({ item }) => {
    const rating = item.rating ? item.rating : 0;
    const ratingPercentage = (rating / 10) * 100;

    const commonStats = {
      G: item.statistics?.goals ?? 0,
      A: item.statistics?.assists ?? 0,
      SH: item.statistics?.totalShots ?? 0,
      ST: item.statistics?.shotsOnTarget ?? 0,
      PS: item.statistics?.accuratePasses ?? 0,
      DR: item.statistics?.dribbles ?? 0,
      TK: item.statistics?.tackles ?? 0,
      INT: item.statistics?.interceptions ?? 0,
    };

    return (
      <View style={styles.playerItem}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerNumber}>{item.number}</Text>
          <Text style={styles.playerName} numberOfLines={1}>
            {item.name}
            {item.captain && <Text style={styles.captainBadge}> (C)</Text>}
          </Text>
        </View>

        <View style={styles.playerStatsContainer}>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <View style={styles.ratingBarBackground}>
              <View
                style={[
                  styles.ratingBarFill,
                  {
                    width: `${ratingPercentage}%`,
                    backgroundColor: getRatingColor(rating),
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.statsGrid}>
            {Object.entries(commonStats).map(([key, value]) => (
              <View key={key} style={styles.statCell}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{key}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderPlayerSection = ({ title, data }) => (
    <View style={styles.playerSection}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionStatsLegend}>
          <Text style={styles.legendText}>G: Goals</Text>
          <Text style={styles.legendText}>A: Assists</Text>
          <Text style={styles.legendText}>SH: Shots</Text>
          <Text style={styles.legendText}>ST: On Target</Text>
        </View>
      </View>

      <View style={styles.playerPositionsContainer}>
        {data.filter((p) => p.position === "G").length > 0 && (
          <>
            <Text style={styles.positionTitle}>Goalkeepers</Text>
            <FlatList
              data={data.filter((p) => p.position === "G")}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </>
        )}

        {data.filter((p) => ["D", "DC", "DL", "DR"].includes(p.position))
          .length > 0 && (
          <>
            <Text style={styles.positionTitle}>Defenders</Text>
            <FlatList
              data={data.filter((p) =>
                ["D", "DC", "DL", "DR"].includes(p.position),
              )}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </>
        )}

        {data.filter((p) =>
          ["M", "MC", "ML", "MR", "AM", "DM"].includes(p.position),
        ).length > 0 && (
          <>
            <Text style={styles.positionTitle}>Midfielders</Text>
            <FlatList
              data={data.filter((p) =>
                ["M", "MC", "ML", "MR", "AM", "DM"].includes(p.position),
              )}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </>
        )}

        {data.filter((p) => ["F", "FW", "ST"].includes(p.position)).length >
          0 && (
          <>
            <Text style={styles.positionTitle}>Forwards</Text>
            <FlatList
              data={data.filter((p) => ["F", "FW", "ST"].includes(p.position))}
              renderItem={renderPlayerItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </>
        )}
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

              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "stats" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("stats")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "stats" && styles.activeTabText,
                    ]}
                  >
                    Stats
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "events" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("events")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "events" && styles.activeTabText,
                    ]}
                  >
                    Events
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "players" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("players")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "players" && styles.activeTabText,
                    ]}
                  >
                    Players
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === "stats" && (
                <>
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
                    <Text style={styles.noDataText}>
                      No statistics available
                    </Text>
                  )}
                </>
              )}

              {activeTab === "events" && (
                <>
                  <Text style={styles.sectionHeader}>Match Events</Text>
                  {commentary.length > 0 ? (
                    <FlatList
                      data={commentary}
                      renderItem={renderEventItem}
                      keyExtractor={(item, index) => index.toString()}
                      scrollEnabled={false}
                    />
                  ) : (
                    <Text style={styles.noDataText}>
                      No events available yet
                    </Text>
                  )}
                </>
              )}

              {activeTab === "players" && (
                <>
                  <Text style={styles.sectionHeader}>Player Statistics</Text>
                  {homePlayers.length > 0 || awayPlayers.length > 0 ? (
                    <View style={styles.playersContainer}>
                      {renderPlayerSection({
                        title: selectedFixture.homeTeam.name,
                        data: homePlayers,
                      })}
                      {renderPlayerSection({
                        title: selectedFixture.awayTeam.name,
                        data: awayPlayers,
                      })}
                    </View>
                  ) : (
                    <Text style={styles.noDataText}>
                      Player data not available
                    </Text>
                  )}
                </>
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
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#3a7bd5",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#3a7bd5",
    fontWeight: "bold",
  },
  playersContainer: {
    marginBottom: 20,
  },
  playerSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionStatsLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    maxWidth: "60%",
  },
  legendText: {
    fontSize: 10,
    color: "#666",
    marginRight: 8,
  },
  playerPositionsContainer: {
    marginTop: 10,
  },
  positionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a7bd5",
    marginTop: 10,
    marginBottom: 5,
    paddingLeft: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#3a7bd5",
  },
  playerItem: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    alignItems: "center",
  },
  playerInfo: {
    width: 120,
    flexDirection: "row",
    alignItems: "center",
  },
  playerNumber: {
    width: 24,
    textAlign: "center",
    fontWeight: "bold",
    color: "#666",
    fontSize: 14,
  },
  playerName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  captainBadge: {
    color: "#e74c3c",
    fontSize: 12,
  },
  playerStatsContainer: {
    flex: 1,
    marginLeft: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    width: 30,
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  ratingBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
    marginLeft: 8,
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCell: {
    width: "22%",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
});

export default LiveMatchStatsPage;
