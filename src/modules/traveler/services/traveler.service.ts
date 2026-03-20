import { get, put } from '@/src/core';
import type { TravelerInfo, TravelerInfoForm, TravelerFormConfig } from '../types';

export const travelerService = {
  /** Obtiene la info del viajero del usuario en sesión para el evento activo */
  getMyInfo: (eventId: string): Promise<TravelerInfo | null> =>
    get<TravelerInfo | null>(`/events/${eventId}/travelers/me`),

  /** Crea o actualiza la info del viajero (upsert) */
  saveMyInfo: (eventId: string, data: TravelerInfoForm): Promise<TravelerInfo> =>
    put<TravelerInfo>(`/events/${eventId}/travelers/me`, data),

  /** Obtiene la configuración del formulario para el evento (con defaults si no existe) */
  getFormConfig: (eventId: string): Promise<TravelerFormConfig> =>
    get<TravelerFormConfig>(`/events/${eventId}/travelers/form-config`),
};
