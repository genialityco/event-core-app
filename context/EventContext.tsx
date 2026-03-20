import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import api from '@/services/api/api';
import { useTenant } from './TenantContext';

export interface ActiveEvent {
  _id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  styles?: { eventImage?: string; miniatureImage?: string };
  [key: string]: any;
}

interface EventContextValue {
  activeEvent: ActiveEvent | null;
  activeEventId: string | null;
  isLoading: boolean;
  /** Refresca el evento activo manualmente (ej: después de que el admin lo cambia) */
  refresh: () => Promise<void>;
}

const EventContext = createContext<EventContextValue>({
  activeEvent: null,
  activeEventId: null,
  isLoading: true,
  refresh: async () => {},
});

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const { organization, isLoading: tenantLoading } = useTenant();
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveEvent = async (eventId: string) => {
    try {
      const res = await api.get(`/events/${eventId}`);
      const data = res.data?.data ?? res.data;
      setActiveEvent(data ?? null);
    } catch {
      setActiveEvent(null);
    }
  };

  const refresh = async () => {
    const eventId = (organization as any)?.activeEventId;
    if (!eventId) {
      setActiveEvent(null);
      return;
    }
    setIsLoading(true);
    await fetchActiveEvent(eventId);
    setIsLoading(false);
  };

  useEffect(() => {
    if (tenantLoading) return;

    const eventId = (organization as any)?.activeEventId;
    if (!eventId) {
      setActiveEvent(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchActiveEvent(eventId).finally(() => setIsLoading(false));
  }, [organization, tenantLoading]);

  const activeEventId = activeEvent?._id ?? null;

  return (
    <EventContext.Provider value={{ activeEvent, activeEventId, isLoading, refresh }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => useContext(EventContext);
