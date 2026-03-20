import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/services/firebaseConfig";
import api from "@/services/api/api";

export interface OrganizationFeatures {
  agenda?: boolean;
  speakers?: boolean;
  documents?: boolean;
  ubication?: boolean;
  certificate?: boolean;
  posters?: boolean;
  info?: boolean;
  [key: string]: boolean | undefined;
}

export interface OrganizationData {
  _id: string;
  name: string;
  slug?: string;
  features?: OrganizationFeatures;
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
    [key: string]: any;
  };
}

interface TenantContextValue {
  organization: OrganizationData | null;
  organizationId: string | null;
  isLoading: boolean;
  setOrganizationId: (id: string) => Promise<void>;
  clearTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue>({
  organization: null,
  organizationId: null,
  isLoading: true,
  setOrganizationId: async () => {},
  clearTenant: async () => {},
});

const ORG_ID_KEY = "organizationId";
const ORG_HEADER_KEY = "x-organization-id";

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const [organizationId, setOrganizationIdState] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrgDetails = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/organizations/${id}`);
      const data = res.data?.data ?? res.data;
      setOrganization(data ?? null);
    } catch {
      setOrganization(null);
    }
  }, []);

  const resolveOrgFromMembership = useCallback(async (firebaseUid: string): Promise<string | null> => {
    try {
      // Step 1: get internal userId from firebaseUid
      const userRes = await api.get("/users/search", {
        params: { firebaseUid },
      });
      const users = userRes.data?.data?.items ?? userRes.data?.items ?? [];
      if (!users.length) return null;
      const userId = users[0]._id;

      // Step 2: get active membership → extract organizationId
      const memberRes = await api.get("/members/search", {
        params: { userId, memberActive: true },
      });
      const members = memberRes.data?.data?.items ?? memberRes.data?.items ?? [];
      if (!members.length) return null;

      return members[0].organizationId as string;
    } catch {
      return null;
    }
  }, []);

  const setOrganizationId = useCallback(async (id: string) => {
    await AsyncStorage.multiSet([
      [ORG_ID_KEY, id],
      [ORG_HEADER_KEY, id],
    ]);
    setOrganizationIdState(id);
    await fetchOrgDetails(id);
  }, [fetchOrgDetails]);

  const clearTenant = useCallback(async () => {
    await AsyncStorage.multiRemove([ORG_ID_KEY, ORG_HEADER_KEY]);
    setOrganizationIdState(null);
    setOrganization(null);
  }, []);

  // Listen to Firebase auth state changes to resolve tenant
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        await clearTenant();
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Try cached organizationId first
      const cached = await AsyncStorage.getItem(ORG_ID_KEY);
      if (cached) {
        setOrganizationIdState(cached);
        await fetchOrgDetails(cached);
        setIsLoading(false);
        return;
      }

      // Resolve from membership (for first login or cleared cache)
      const resolvedId = await resolveOrgFromMembership(user.uid);
      if (resolvedId) {
        await setOrganizationId(resolvedId);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [clearTenant, fetchOrgDetails, resolveOrgFromMembership, setOrganizationId]);

  return (
    <TenantContext.Provider
      value={{ organization, organizationId, isLoading, setOrganizationId, clearTenant }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

/**
 * Backward-compat hook — existing code that uses useOrganization() keeps working.
 * Migrate callers to useTenant() over time.
 */
export const useOrganization = () => {
  const { organization, organizationId, setOrganizationId } = useTenant();
  return {
    organization: organization ?? { _id: organizationId ?? "" },
    updateOrganization: (org: { _id: string }) => setOrganizationId(org._id),
  };
};
