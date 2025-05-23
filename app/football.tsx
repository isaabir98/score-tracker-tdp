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
  TextInput,
} from "react-native";
import axios from "axios";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/constants/firebaseConfig";

const LiveMatchStatsPage = () => {
  const [fixtures, setFixtures] = useState([]);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pastMatches, setPastMatches] = useState([]);

  const SOFASCORE_API = "https://api.sofascore.com/api/v1";

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${SOFASCORE_API}/sport/football/events/live`,
        {
          headers: {
            "User-Agent": "YourApp/1.0",
          },
        },
      );
      setFixtures(response.data.events || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching fixtures:", error);
      setError("Failed to load live matches. Please try again.");
      setFixtures([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPastMatches = async () => {
    try {
      // Fetch recent past matches (last 7 days)
      const date = new Date();
      date.setDate(date.getDate() - 7);
      const formattedDate = date.toISOString().split("T")[0];

      const response = await axios.get(
        `${SOFASCORE_API}/sport/football/scheduled-events/${formattedDate}`,
        {
          headers: {
            "User-Agent": "YourApp/1.0",
          },
        },
      );
      setPastMatches(response.data.events || []);
    } catch (error) {
      console.error("Error fetching past matches:", error);
    }
  };

  const searchMatches = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search in past matches first
      const filtered = pastMatches.filter(
        (match) =>
          match.homeTeam.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          match.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setSearchResults(filtered);

      // If not enough results, try API search
      if (filtered.length < 5) {
        const response = await axios.get(
          `${SOFASCORE_API}/search/${searchQuery}`,
          {
            headers: {
              "User-Agent": "YourApp/1.0",
            },
          },
        );

        // Filter for team results and get their matches
        const teams = response.data?.teams || [];
        if (teams.length > 0) {
          const teamId = teams[0].id;
          const teamMatches = await axios.get(
            `${SOFASCORE_API}/team/${teamId}/events/last/0`,
            {
              headers: {
                "User-Agent": "YourApp/1.0",
              },
            },
          );
          setSearchResults((prev) => [...prev, ...teamMatches.data.events]);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchFixtureDetails = async (fixture) => {
    try {
      setSelectedFixture(fixture);
      setLoading(true);
      setError(null);

      const [incidentsResponse, statisticsResponse, lineupsResponse] =
        await Promise.all([
          axios
            .get(`${SOFASCORE_API}/event/${fixture.id}/incidents`)
            .catch(() => ({ data: { incidents: [] } })),
          axios
            .get(`${SOFASCORE_API}/event/${fixture.id}/statistics`)
            .catch(() => ({ data: { statistics: [] } })),
          axios
            .get(`${SOFASCORE_API}/event/${fixture.id}/lineups`)
            .catch(() => ({
              data: {
                home: { players: [] },
                away: { players: [] },
              },
            })),
        ]);

      setCommentary(incidentsResponse.data.incidents || []);

      const stats = statisticsResponse.data.statistics || [];
      if (stats.length > 0 && stats[0].groups) {
        const allStats = stats[0].groups.flatMap(
          (group) => group.statisticsItems || [],
        );
        setPlayerStats(allStats);
      } else {
        setPlayerStats([]);
      }

      // Process players data to ensure consistent structure
      const processPlayers = (players) => {
        return players.map((player) => ({
          id: player.player?.id || Math.random().toString(36).substring(7),
          name: player.player?.shortName || player.player?.name || "Unknown",
          number: player.player?.shirtNumber || 0,
          position: player.position || "Unknown",
          rating: player.statistics?.rating || 0,
          statistics: player.statistics || {},
          captain: player.player?.captain || false,
          substitute: player.substitute || false,
        }));
      };

      setHomePlayers(processPlayers(lineupsResponse.data.home?.players || []));
      setAwayPlayers(processPlayers(lineupsResponse.data.away?.players || []));
    } catch (error) {
      console.error("Error fetching fixture details:", error);
      setError("Failed to load match details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveMatches();
  };

  useEffect(() => {
    if (selectedFixture) {
      const chatQuery = query(
        collection(db, `match_chats_${selectedFixture.id}`),
        orderBy("createdAt", "desc"),
      );

      const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
        const msgs = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate?.();
            if (!createdAt || typeof data.text !== "string") return null;
            return {
              id: doc.id,
              text: data.text,
              createdAt,
            };
          })
          .filter(Boolean);
        setChatMessages(msgs);
      });

      return unsubscribe;
    }
  }, [selectedFixture]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMatches();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchLiveMatches();
    fetchPastMatches();
    const interval = setInterval(fetchLiveMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendChatMessage = async () => {
    const trimmed = chatText.trim();
    if (!trimmed || !selectedFixture) return;

    try {
      await addDoc(collection(db, `match_chats_${selectedFixture.id}`), {
        text: trimmed,
        createdAt: serverTimestamp(),
      });
      setChatText("");
    } catch (err) {
      console.error("Chat send error:", err);
    }
  };

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

  const renderSearchResultCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.matchCard,
          selectedFixture?.id === item.id && styles.selectedMatchCard,
        ]}
        onPress={() => fetchFixtureDetails(item)}
      >
        <View style={styles.matchHeader}>
          <Text style={styles.leagueName}>
            {item.tournament?.name || "Match"}
          </Text>
          <Text style={styles.matchDate}>
            {new Date(item.startTimestamp * 1000).toLocaleDateString()}
          </Text>
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
              {item.homeScore?.current || 0} - {item.awayScore?.current || 0}
            </Text>
            <Text style={styles.matchStatusText}>
              {item.status?.description || "Finished"}
            </Text>
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
    const rating = item.rating ? parseFloat(item.rating) : 0;
    const ratingPercentage = (rating / 10) * 100;

    const commonStats = {
      G: item.statistics?.goals ?? 0,
      A: item.statistics?.assists ?? 0,
      SH: item.statistics?.totalShots ?? 0,
      ST: item.statistics?.shotsOnTarget ?? 0,
      PS: `${item.statistics?.accuratePasses ?? 0}/${
        item.statistics?.totalPasses ?? 1
      }`,
      DR: item.statistics?.dribbles ?? 0,
      TK: item.statistics?.tackles ?? 0,
      INT: item.statistics?.interceptions ?? 0,
    };

    return (
      <View
        style={[styles.playerItem, item.substitute && styles.substitutePlayer]}
      >
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

  const renderPlayerSection = ({ title, data }) => {
    const startingPlayers = data.filter((player) => !player.substitute);

    return (
      <View style={styles.playerSection}>
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.sectionStatsLegend}>
            <Text style={styles.legendText}>G: Goals</Text>
            <Text style={styles.legendText}>A: Assists</Text>
            <Text style={styles.legendText}>PS: Passes</Text>
            <Text style={styles.legendText}>DR: Dribbles</Text>
          </View>
        </View>

        <View style={styles.playerPositionsContainer}>
          {/* Goalkeepers */}
          {startingPlayers.filter((p) => p.position === "G").length > 0 && (
            <>
              <Text style={styles.positionTitle}>Goalkeepers</Text>
              <FlatList
                data={startingPlayers.filter((p) => p.position === "G")}
                renderItem={renderPlayerItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </>
          )}

          {/* Defenders */}
          {startingPlayers.filter((p) =>
            ["D", "DC", "DL", "DR"].includes(p.position),
          ).length > 0 && (
            <>
              <Text style={styles.positionTitle}>Defenders</Text>
              <FlatList
                data={startingPlayers.filter((p) =>
                  ["D", "DC", "DL", "DR"].includes(p.position),
                )}
                renderItem={renderPlayerItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </>
          )}

          {/* Midfielders */}
          {startingPlayers.filter((p) =>
            ["M", "MC", "ML", "MR", "AM", "DM"].includes(p.position),
          ).length > 0 && (
            <>
              <Text style={styles.positionTitle}>Midfielders</Text>
              <FlatList
                data={startingPlayers.filter((p) =>
                  ["M", "MC", "ML", "MR", "AM", "DM"].includes(p.position),
                )}
                renderItem={renderPlayerItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </>
          )}

          {/* Forwards */}
          {startingPlayers.filter((p) => ["F", "FW", "ST"].includes(p.position))
            .length > 0 && (
            <>
              <Text style={styles.positionTitle}>Forwards</Text>
              <FlatList
                data={startingPlayers.filter((p) =>
                  ["F", "FW", "ST"].includes(p.position),
                )}
                renderItem={renderPlayerItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.header}>⚽ Live Football Matches</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search past matches by team name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching && (
          <ActivityIndicator style={styles.searchLoading} color="#3a7bd5" />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {searchQuery ? (
        <>
          <Text style={styles.sectionHeader}>
            Search Results for "{searchQuery}"
          </Text>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3a7bd5" />
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              horizontal
              data={searchResults}
              renderItem={renderSearchResultCard}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchesList}
            />
          ) : (
            <Text style={styles.noDataText}>No matches found</Text>
          )}
        </>
      ) : loading && !fixtures.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3a7bd5" />
          <Text style={styles.loadingText}>Loading live matches...</Text>
        </View>
      ) : fixtures.length === 0 ? (
        <View style={styles.noMatchesContainer}>
          <Text style={styles.noMatchesText}>No live matches currently</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionHeader}>Live Matches</Text>
          <FlatList
            horizontal
            data={fixtures}
            renderItem={renderMatchCard}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesList}
          />
        </>
      )}

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
              style={[styles.tab, activeTab === "stats" && styles.activeTab]}
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
              style={[styles.tab, activeTab === "events" && styles.activeTab]}
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
              style={[styles.tab, activeTab === "players" && styles.activeTab]}
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
                  data={playerStats}
                  renderItem={renderStatItem}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.noDataText}>
                  No statistics available for this match
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
                <Text style={styles.noDataText}>No events available yet</Text>
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
                <Text style={styles.noDataText}>Player data not available</Text>
              )}
            </>
          )}

          {/* Chat Section */}
          <View style={styles.chatSection}>
            <Text style={styles.chatHeader}>💬 Fan Chat</Text>
            <FlatList
              data={chatMessages}
              inverted
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.chatBubble}>
                  <Text style={styles.chatText}>{item.text}</Text>
                </View>
              )}
              style={{ maxHeight: 200 }}
            />
            <View style={styles.chatInputContainer}>
              <TextInput
                value={chatText}
                onChangeText={setChatText}
                placeholder="Type your message..."
                placeholderTextColor="#aaa"
                style={styles.chatInput}
              />
              <TouchableOpacity
                style={styles.chatSendButton}
                onPress={sendChatMessage}
              >
                <Text style={styles.chatSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  searchContainer: {
    marginBottom: 15,
    position: "relative",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchLoading: {
    position: "absolute",
    right: 15,
    top: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
  matchDate: {
    fontSize: 11,
    color: "#999",
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
  matchStatusText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
  substitutePlayer: {
    opacity: 0.7,
    backgroundColor: "#f9f9f9",
  },
  playerInfo: {
    width: 140,
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
    width: "23%",
    alignItems: "center",
    marginBottom: 5,
    padding: 3,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
  },
  chatSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#1a1f3c",
    borderRadius: 12,
  },
  chatHeader: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
    fontWeight: "bold",
  },
  chatBubble: {
    backgroundColor: "#2a2f4c",
    padding: 10,
    borderRadius: 15,
    marginBottom: 8,
    maxWidth: "90%",
  },
  chatText: {
    color: "#fff",
    fontSize: 14,
  },
  chatInputContainer: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#2a2f4c",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
  },
  chatSendButton: {
    backgroundColor: "#ffcc00",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chatSendText: {
    fontWeight: "bold",
    color: "#000",
  },
});

export default LiveMatchStatsPage;
