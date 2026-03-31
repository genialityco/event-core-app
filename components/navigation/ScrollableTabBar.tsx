import React, { useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, useBrandedColors } from '@/src/theme';

export function ScrollableTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const xOffsets = useRef<Record<string, number>>({});
  const bc = useBrandedColors();

  const tabBg       = bc.tabBar.background;
  const tabActive   = bc.tabBar.active;
  const tabInactive = bc.tabBar.inactive;

  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return typeof options.tabBarIcon === 'function';
  });

  const activeRouteKey = state.routes[state.index]?.key;

  // Scroll automático al tab activo
  useEffect(() => {
    const x = xOffsets.current[activeRouteKey];
    if (x !== undefined) {
      scrollRef.current?.scrollTo({ x: Math.max(0, x - 60), animated: true });
    }
  }, [activeRouteKey]);

  return (
    <View style={[styles.wrapper, { backgroundColor: tabBg, paddingBottom: insets.bottom }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isActive = route.key === activeRouteKey;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const iconColor = isActive ? tabActive : tabInactive;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params as any);
                }
              }}
              onLongPress={() => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              }}
              onLayout={(e) => {
                xOffsets.current[route.key] = e.nativeEvent.layout.x;
              }}
              style={styles.tab}
              android_ripple={{ color: tabActive + '22', borderless: true }}
            >
              <View style={styles.tabInner}>
                {options.tabBarIcon?.({ focused: isActive, color: iconColor, size: 22 })}
                <Text style={[styles.label, { color: iconColor }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
              {isActive && <View style={[styles.indicator, { backgroundColor: tabActive }]} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
  },
  tab: {
    minWidth: 72,
    paddingHorizontal: 12,
    position: 'relative',
  },
  tabInner: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
  },
});
