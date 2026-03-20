import React from 'react';
import type { ModuleId } from '@/src/config/appConfig';

/**
 * Definición de un módulo de la app.
 * Cada módulo debe registrarse aquí para ser incluido en la navegación.
 */
export interface ModuleDefinition {
  id: ModuleId;
  /** Label que aparece en el tab bar */
  label: string;
  /** Nombre del ícono Ionicons cuando el tab está activo */
  icon: string;
  /** Nombre del ícono Ionicons cuando el tab está inactivo */
  iconOutline: string;
  /** Key en Organization.features que habilita este módulo */
  featureFlag: string;
  /** Pantalla principal del módulo */
  Screen: React.ComponentType;
}

// Importaciones lazy para no cargar módulos inactivos
import { TravelerScreen } from './traveler';
import { HotelsScreen } from './hotels';
import { AgendaScreen } from './agenda';
import { AttendanceScreen } from './attendance';
import { UsefulInfoScreen } from './usefulInfo';
import { PhotosScreen } from './photos';
import { SpeakersScreen } from './speakers';

/**
 * Registro central de todos los módulos disponibles.
 * Agregar un módulo aquí + en appConfig.enabledModules lo activa.
 */
export const moduleRegistry: Record<ModuleId, ModuleDefinition> = {
  speakers: {
    id: 'speakers',
    label: 'Speakers',
    icon: 'mic',
    iconOutline: 'mic-outline',
    featureFlag: 'speakers',
    Screen: SpeakersScreen,
  },
  traveler: {
    id: 'traveler',
    label: 'Viajero',
    icon: 'airplane',
    iconOutline: 'airplane-outline',
    featureFlag: 'traveler',
    Screen: TravelerScreen,
  },
  hotels: {
    id: 'hotels',
    label: 'Hoteles',
    icon: 'bed',
    iconOutline: 'bed-outline',
    featureFlag: 'hotels',
    Screen: HotelsScreen,
  },
  agenda: {
    id: 'agenda',
    label: 'Agenda',
    icon: 'calendar',
    iconOutline: 'calendar-outline',
    featureFlag: 'agenda',
    Screen: AgendaScreen,
  },
  attendance: {
    id: 'attendance',
    label: 'Asistencia',
    icon: 'checkmark-circle',
    iconOutline: 'checkmark-circle-outline',
    featureFlag: 'attendance',
    Screen: AttendanceScreen,
  },
  usefulInfo: {
    id: 'usefulInfo',
    label: 'Info',
    icon: 'information-circle',
    iconOutline: 'information-circle-outline',
    featureFlag: 'usefulInfo',
    Screen: UsefulInfoScreen,
  },
  photos: {
    id: 'photos',
    label: 'Fotos',
    icon: 'camera',
    iconOutline: 'camera-outline',
    featureFlag: 'photos',
    Screen: PhotosScreen,
  },
};
