import { get } from "@/src/core";

export interface PreRegisteredAttendee {
  _id: string;
  email: string;
  organizationId: string;
  eventId: string | null;
  name: string | null;
  channel: string | null;
  position: string | null;
  observations: string | null;
  country: string | null;
  isActivated: boolean;
  activatedAt: string | null;
  activatedByUserId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ListActivatedAttendeesParams {
  organizationId?: string;
  eventId?: string;
}

/**
 * Ajusta esta ruta si tu controller usa otro endpoint.
 *
 * Ejemplos posibles:
 * /pre-registered-attendees
 * /pre-registered-attendees/list
 * /attendees/pre-registered
 */
const SERVICE_PATH = "/pre-registered-attendees";

function buildQueryParams(params: ListActivatedAttendeesParams) {
  const queryParams: string[] = [];

  if (params.organizationId) {
    queryParams.push(
      `organizationId=${encodeURIComponent(params.organizationId)}`,
    );
  }

  if (params.eventId) {
    queryParams.push(`eventId=${encodeURIComponent(params.eventId)}`);
  }

  return queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
}

function normalizeAttendeesResponse(response: any): PreRegisteredAttendee[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.attendees)) {
    return response.attendees;
  }

  if (Array.isArray(response?.preRegisteredAttendees)) {
    return response.preRegisteredAttendees;
  }

  return [];
}

export async function listActivatedAttendees(
  params: ListActivatedAttendeesParams = {},
): Promise<PreRegisteredAttendee[]> {
  const queryString = buildQueryParams(params);

  const response = await get<any>(`${SERVICE_PATH}${queryString}`);

  const attendees = normalizeAttendeesResponse(response);

  return attendees;
}
