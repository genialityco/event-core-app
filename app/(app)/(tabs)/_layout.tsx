import React, { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { appConfig, type ModuleId } from '@/src/config/appConfig';
import { moduleRegistry } from '@/src/modules/registry';
import { useFeatureFlags } from '@/context/FeatureFlagContext';
import { useTranslation } from '@/src/i18n';
import { useTenant } from '@/context/TenantContext';
import { AppHeader } from '@/components/AppHeader';
import { ScrollableTabBar } from '@/components/navigation/ScrollableTabBar';

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
  const { isEnabled } = useFeatureFlags();
  const { t } = useTranslation();
  const { organization, isLoading } = useTenant();
  const router = useRouter();
  const hasNavigated = useRef(false);

  const installedModules = new Set<string>(appConfig.enabledModules);

  // Navegar al tab configurado como default una sola vez, después de que carga la org
  useEffect(() => {
    if (isLoading || !organization || hasNavigated.current) return;

    const defaultModule = organization.features?.defaultModule;
    if (!defaultModule) return;

    const mod = moduleRegistry[defaultModule as ModuleId];
    const isAvailable =
      installedModules.has(defaultModule) &&
      mod &&
      isEnabled(mod.featureFlag);

    if (isAvailable) {
      hasNavigated.current = true;
      router.replace(`/(app)/(tabs)/${defaultModule}` as any);
    }
  }, [isLoading, organization]);

  return (
    <Tabs
      tabBar={(props) => <ScrollableTabBar {...props} />}
      screenOptions={{
        header: () => <AppHeader />,
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

      {/* Settings: accesible desde el ícono del header, oculto del tab bar */}
      <Tabs.Screen name="settings" options={{ href: null }} />

      {LEGACY_TABS.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
