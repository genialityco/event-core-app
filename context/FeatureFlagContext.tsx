import React, {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useTenant, OrganizationFeatures } from "./TenantContext";

interface FeatureFlagContextValue {
  features: OrganizationFeatures;
  isEnabled: (feature: string) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
  features: {},
  isEnabled: () => true, // Default: all features enabled when org not loaded yet
});

interface FeatureFlagProviderProps {
  children: ReactNode;
}

export const FeatureFlagProvider = ({ children }: FeatureFlagProviderProps) => {
  const { organization } = useTenant();

  const features: OrganizationFeatures = organization?.features ?? {};

  const isEnabled = (feature: string): boolean => {
    // If org not loaded yet or features not defined, default to enabled
    if (!organization?.features) return true;
    return organization.features[feature] !== false;
  };

  return (
    <FeatureFlagContext.Provider value={{ features, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagContext);
