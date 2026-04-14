import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useBrandedColors } from '@/src/theme';

export const AppHeader: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bc = useBrandedColors();

  return (
    <View style={[styles.container, { paddingTop: insets.top, borderBottomColor: bc.primary }]}>
      <View style={styles.content}>
        <Image
          source={require('@/assets/icons/LOGO_AIL_HEADER.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.divider} />
        <Image
          source={require('@/assets/icons/LOGO_CUMBRE_HEADER.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/settings')}
          style={styles.settingsButton}
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={24} color={bc.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    borderBottomWidth: 2,
  },
  content: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    height: 42,
    flex: 1,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: '#C0C0C0',
  },
  settingsButton: {
    padding: 4,
  },
});
