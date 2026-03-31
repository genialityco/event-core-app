import { useTenant } from '@/context/TenantContext';
import { colors } from './colors';

/**
 * Devuelve la paleta de colores fusionada con el branding de la organización.
 * `primaryColor` en `organization.branding` sobreescribe el color primario
 * configurado desde el CMS administrador.
 *
 * Uso:
 *   const bc = useBrandedColors();
 *   <View style={{ backgroundColor: bc.primary }} />
 */
export function useBrandedColors() {
  const { organization } = useTenant();
  const b = (organization?.branding as any) ?? {};

  const primary        = b.primaryColor        ?? colors.primary;
  const primaryDark    = b.primaryDarkColor    ?? colors.primaryDark;
  const tabBg          = b.tabBarColor         ?? colors.tabBar.background;
  const tabActive      = b.tabBarActiveColor   ?? primary;
  const tabInactive    = b.tabBarInactiveColor ?? colors.tabBar.inactive;

  return {
    ...colors,
    primary,
    primaryDark,
    tabBar: {
      background: tabBg,
      active: tabActive,
      inactive: tabInactive,
    },
  };
}
