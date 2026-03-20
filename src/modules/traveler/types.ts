// ─── Datos guardados del viajero ──────────────────────────────────────────────

export interface TravelerInfo {
  _id?: string;
  tvChannel: string;
  position: string;
  outboundOriginCity: string;
  outboundFlightNumber: string;
  outboundArrivalTime: string;
  returnOriginCity: string;
  returnFlightNumber: string;
  returnArrivalTime: string;
  dietaryRestrictions: string;
}

export type TravelerInfoForm = Omit<TravelerInfo, '_id'>;

export const EMPTY_TRAVELER_FORM: TravelerInfoForm = {
  tvChannel: '',
  position: '',
  outboundOriginCity: '',
  outboundFlightNumber: '',
  outboundArrivalTime: '',
  returnOriginCity: '',
  returnFlightNumber: '',
  returnArrivalTime: '',
  dietaryRestrictions: '',
};

// ─── Configuración del formulario (viene del CMS por evento) ──────────────────

export interface FieldConfig {
  key: string;
  label: string;
  required: boolean;
  enabled: boolean;
}

export interface SectionConfig {
  key: 'outbound_flight' | 'return_flight' | 'dietary' | 'professional';
  label: string;
  enabled: boolean;
  fields: FieldConfig[];
}

export interface TravelerFormConfig {
  eventId: string;
  sections: SectionConfig[];
  whatsappGroupUrl: string;
}
