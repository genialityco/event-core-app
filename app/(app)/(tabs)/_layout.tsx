import React from 'react';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { appConfig, type ModuleId } from '@/src/config/appConfig';
import { moduleRegistry } from '@/src/modules/registry';
import { colors } from '@/src/theme';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { useTranslation } from '@/src/i18n';
import { useTenant } from '@/context/TenantContext';
import { AppHeader } from '@/components/AppHeader';

// Todos los módulos registrados — necesarios para que Expo Router oculte los no activos
const ALL_MODULES: ModuleId[] = [
  'traveler',
  'hotels',
  'agenda',
  'attendance',
  'speakers',
  'usefulInfo',
  'photos',
];

// Tabs heredados del scaffold anterior — ocultos en esta app
const LEGACY_TABS = ['home', 'eventosbefore', '(index)', 'achoinfo', 'menu'];

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();
  const { organization } = useTenant();

  const tabBarColor = (organization?.branding as any)?.tabBarColor ?? '#ffffff';

  // Un módulo se muestra si:
  // 1. Está en appConfig.enabledModules (instalado en la app)
  // 2. La organización tiene el feature flag activo en backend
  const installedModules = new Set<string>(appConfig.enabledModules);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          borderRadius: isLargeScreen ? 40 : 20,
          margin: isLargeScreen ? 10 : 5,
          paddingHorizontal: isLargeScreen ? 20 : 5,
          backgroundColor: tabBarColor,
        },
        header: () => <AppHeader />,
        headerStyle: { backgroundColor: '#F0F0F0', height: 56 },
        tabBarLabelStyle: { fontSize: isLargeScreen ? 16 : 12 },
      }}
    >
      {ALL_MODULES.map((moduleId) => {
        const mod = moduleRegistry[moduleId];
        const visible =
          installedModules.has(moduleId) && isEnabled(mod.featureFlag);

        if (!visible) {
          return (
            <Tabs.Screen
              key={moduleId}
              name={moduleId}
              options={{ href: null }}
            />
          );
        }

        return (
          <Tabs.Screen
            key={moduleId}
            name={moduleId}
            options={{
              title: t(`modules.${moduleId}`),
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  name={(focused ? mod.icon : mod.iconOutline) as any}
                  color={color}
                />
              ),
            }}
          />
        );
      })}

      {/* Tab de sistema — siempre visible, no controlado por feature flags */}
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings.title'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? 'settings' : 'settings-outline'}
              color={color}
            />
          ),
        }}
      />

      {LEGACY_TABS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
