export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  subdomain?: string;
  customDomain?: string;
  settings: TenantSettings;
  features: TenantFeatures;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
    customCss?: string;
  };
  localization: {
    defaultLanguage: string;
    supportedLanguages: string[];
    timezone: string;
  };
  security: {
    allowedDomains?: string[];
    requireMfa?: boolean;
    sessionTimeout?: number;
  };
}

export interface TenantFeatures {
  analytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  advancedReporting: boolean;
  integrations: string[];
  maxUsers?: number;
  storageLimit?: number;
}

export interface TenantContext {
  tenant: Tenant | null;
  isMultiTenant: boolean;
  tenantId: string;
  domain: string | undefined;
  subdomain: string | undefined;
  error: Error | null;
}

export type TenantResolutionStrategy =
  | 'header'
  | 'subdomain'
  | 'domain'
  | 'path';
