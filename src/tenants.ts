/**
 * Per-org configuration.
 *
 * At launch: single-org mode. Only the BRG org is provisioned.
 * Multi-tenant self-serve flow lives in Phase 6 (out of scope for this issue).
 */

export interface TenantConfig {
  orgId: string;
  /** API key issued to this org. Sent by the SPA in the X-C3-Api-Key header. */
  apiKey: string;
  /** Add-on base URL. Reachable via Cloudflare Tunnel. */
  addonBaseUrl: string;
  /** Whether this org is enabled. Disabled orgs get 403. */
  enabled: boolean;
  /** Display name for logs. */
  displayName: string;
}

const TENANTS: TenantConfig[] = [
  {
    orgId: 'openclaw-prod',
    apiKey: process.env.C3_TENANT_BR_API_KEY ?? '',
    addonBaseUrl: process.env.C3_TENANT_BR_ADDON_BASE ?? 'https://add-on.blckrbbt.io',
    enabled: true,
    displayName: 'Black Rabbit Group',
  },
];

export function findTenantByApiKey(apiKey: string | undefined): TenantConfig | null {
  if (!apiKey) return null;
  return TENANTS.find((t) => t.apiKey === apiKey && t.enabled) ?? null;
}

export function findTenantByOrgId(orgId: string | undefined): TenantConfig | null {
  if (!orgId) return null;
  return TENANTS.find((t) => t.orgId === orgId && t.enabled) ?? null;
}

export { TENANTS };
