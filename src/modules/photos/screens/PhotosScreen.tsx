import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@/services/firebaseConfig';
import { useTranslation } from '@/src/i18n';
import { colors, spacing, typography, useBrandedColors } from '@/src/theme';
import { useEvent } from '@/context/EventContext';
import { useAuth } from '@/context/AuthContext';
import { get, post, del } from '@/src/core';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Photo {
  _id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  storageRef: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COL = 3;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - spacing.md * 2 - 4) / COL);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const PhotosScreen: React.FC = () => {
  const { t } = useTranslation();
  const { activeEventId } = useEvent();
  const { userId } = useAuth();
  const bc = useBrandedColors();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Photo | null>(null);

  const loadPhotos = useCallback(async (isRefresh = false) => {
    if (!activeEventId) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await get<any>(`/events/${activeEventId}/photos`);
      const items: Photo[] = Array.isArray(res) ? res : res?.items ?? res?.data?.items ?? [];
      setPhotos(items);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeEventId]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const handleUpload = async () => {
    if (!activeEventId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('photos.permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const timestamp = Date.now();
      const path = `events/${activeEventId}/photos/${userId}_${timestamp}.jpg`;
      const sRef = storageRef(storage, path);

      await uploadBytes(sRef, blob, { contentType: 'image/jpeg' });
      const imageUrl = await getDownloadURL(sRef);

      const userName = auth.currentUser?.displayName ?? auth.currentUser?.email ?? '';
      await post(`/events/${activeEventId}/photos`, {
        imageUrl,
        storageRef: path,
        userName,
      });

      await loadPhotos();
    } catch {
      Alert.alert(t('photos.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (photo: Photo) => {
    if (photo.userId !== userId) return;
    Alert.alert(
      t('photos.deleteConfirm'),
      undefined,
      [
        { text: t('photos.deleteNo'), style: 'cancel' },
        {
          text: t('photos.deleteYes'),
          style: 'destructive',
          onPress: async () => {
            try {
              const sRef = storageRef(storage, photo.storageRef);
              await deleteObject(sRef).catch(() => {});
              await del(`/events/${activeEventId}/photos/${photo._id}`);
              setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
              if (selected?._id === photo._id) setSelected(null);
            } catch {
              Alert.alert(t('photos.deleteError'));
            }
          },
        },
      ],
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={bc.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item._id}
        numColumns={COL}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPhotos(true)}
            colors={[bc.primary]}
            tintColor={bc.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('photos.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('photos.subtitle')}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>{t('photos.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cell}
            onPress={() => setSelected(item)}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.cellImage} resizeMode="cover" />
            {item.userId === userId && (
              <View style={styles.ownBadge} />
            )}
          </TouchableOpacity>
        )}
      />

      {/* FAB Upload */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: bc.primary }, uploading && styles.fabDisabled]}
        onPress={handleUpload}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.fabIcon}>+</Text>
        )}
      </TouchableOpacity>

      {/* Full-screen modal */}
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelected(null)}
        >
          {selected && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selected.imageUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <View style={styles.modalMeta}>
                {!!selected.userName && (
                  <Text style={styles.modalName}>{selected.userName}</Text>
                )}
                {selected.userId === userId && (
                  <TouchableOpacity
                    style={styles.modalDeleteBtn}
                    onPress={() => handleDelete(selected)}
                  >
                    <Text style={styles.modalDeleteText}>🗑</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h2, color: colors.text.primary },
  headerSubtitle: { ...typography.body2, color: colors.text.secondary, marginTop: 4 },

  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },

  row: {
    justifyContent: 'space-between',
    marginBottom: 2,
  },

  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cellImage: { width: '100%', height: '100%' },
  ownBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...typography.body1, color: colors.text.secondary, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabDisabled: { opacity: 0.6 },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '100%', alignItems: 'center' },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    width: '100%',
  },
  modalName: { ...typography.body2, color: '#fff', flex: 1 },
  modalDeleteBtn: {
    padding: spacing.sm,
  },
  modalDeleteText: { fontSize: 22 },
});
