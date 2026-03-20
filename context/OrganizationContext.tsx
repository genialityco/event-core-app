/**
 * @deprecated Use TenantContext (useTenant / useOrganization from TenantContext) instead.
 * This file exists for backward compatibility only — do not import new code here.
 */
export {
  useOrganization,
  TenantProvider as OrganizationProvider,
} from "./TenantContext";

// Some files use useContext(OrganizationContext) directly — provide a shim context.
// New code should use useOrganization() or useTenant() hooks instead.
import React, { createContext, useContext } from "react";
import { useTenant } from "./TenantContext";

const OrganizationContext = createContext<{
  organization: { _id: string; [key: string]: any };
  updateOrganization: (org: any) => void;
}>({
  organization: { _id: "" },
  updateOrganization: () => {},
});

export { OrganizationContext };

/**
 * Bridge component — renders TenantContext value into the legacy OrganizationContext shape.
 * Wrap consuming subtrees that use useContext(OrganizationContext) directly.
 */
export const OrganizationContextBridge = ({ children }: { children: React.ReactNode }) => {
  const { organization, organizationId, setOrganizationId } = useTenant();
  return (
    <OrganizationContext.Provider
      value={{
        organization: organization ?? { _id: organizationId ?? "" },
        updateOrganization: (org: any) => setOrganizationId(org._id),
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};
