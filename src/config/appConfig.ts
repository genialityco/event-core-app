/**
 * Configuración central de la app.
 * Para activar/desactivar un módulo: agregar o quitar su ID de enabledModules.
 * El orden en el array determina el orden de los tabs.
 */
export const appConfig = {
  appName: 'AILS News',
  enabledModules: [
    'traveler',
    'hotels',
    'agenda',
    'attendance',
    'speakers',
    'usefulInfo',
    'photos',
  ] as const,
} satisfies AppConfig;

export type ModuleId =
  | 'traveler'
  | 'hotels'
  | 'agenda'
  | 'attendance'
  | 'speakers'
  | 'usefulInfo'
  | 'photos';

interface AppConfig {
  appName: string;
  enabledModules: readonly ModuleId[];
}
