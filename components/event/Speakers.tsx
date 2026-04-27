import { searchSpeakers } from "@/services/api/speakerService";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Card, IconButton, Text, ActivityIndicator } from "react-native-paper";
import { useTranslation } from "@/src/i18n";
import { getCountryFlag, formatCountryLabel } from "@/src/utils/countries";

interface Speaker {
  _id: string;
  names: string;
  description: string;
  imageUrl: string;
  location: string;
  country: string;
}

export default function Speakers() {
  const { eventId, tab } = useLocalSearchParams();
  const { i18n } = useTranslation();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchSpeakers = async (pageNum: number, reset: boolean = false) => {
    if (pageNum > 1 && !hasMore) return;

    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await searchSpeakers({ 
        eventId: eventId, 
        pageSize: 10, 
        current: pageNum 
      });
      const newSpeakers = response.data.items || [];

      if (reset) {
        setSpeakers(newSpeakers);
      } else {
        setSpeakers((prev) => [...prev, ...newSpeakers]);
      }

      setHasMore(newSpeakers.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching speakers:", error);
      if (reset) {
        setSpeakers([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchSpeakers(1, true);
    }
  }, [eventId]);

  const loadMoreSpeakers = () => {
    if (!loadingMore && hasMore) {
      fetchSpeakers(page + 1, false);
    }
  };

  const renderConferencista = ({ item }: { item: Speaker }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/${tab}/components/speakerdetail?speakerId=${item._id}&eventId=${eventId}`
          )
        }
      >
        <View style={styles.cardContent}>
          <View style={styles.mediaWrap}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          </View>

          <View style={styles.infoWrap}>
            <Text style={styles.name} numberOfLines={2}>
              {item.names}
            </Text>

            {!!item.country && (
              <Text style={styles.country} numberOfLines={1}>
                {getCountryFlag(item.country)}{' '}
                {formatCountryLabel(item.country, i18n?.language || 'es')}
              </Text>
            )}

            {!!item.description && (
              <Text style={styles.description} numberOfLines={3}>
                {item.description}
              </Text>
            )}
          </View>

          <IconButton
            icon="eye"
            iconColor="white"
            size={12}
            style={styles.iconButton}
            onPress={() =>
              router.push(
                `/${tab}/components/speakerdetail?speakerId=${item._id}&eventId=${eventId}`
              )
            }
          />
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#b4d352" />
        <Text>Cargando conferencistas...</Text>
      </View>
    );
  }

  if (speakers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No hay conferencistas disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={speakers}
        renderItem={renderConferencista}
        keyExtractor={(item) => item._id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreSpeakers}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator animating={true} size="small" color="#b4d352" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingBottom: 10,
  },
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  cardContent: {
    position: "relative",
  },
  mediaWrap: {
    width: "100%",
    aspectRatio: 0.9,
    backgroundColor: "#e5e7eb",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoWrap: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 4,
    minHeight: 116,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "left",
    lineHeight: 20,
  },
  country: {
    fontSize: 11,
    color: "#1d4ed8",
    fontWeight: "600",
    textAlign: "left",
  },
  description: {
    fontSize: 12,
    color: "#4b5563",
    textAlign: "left",
    lineHeight: 16,
  },
  iconButton: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
});