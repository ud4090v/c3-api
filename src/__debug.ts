import { Router } from 'express';
export const debugRouter = Router();
debugRouter.get('/__debug/secret-len', (_req, res) => {
  const secret = process.env.C3_TENANT_OPENCLAW_PROD_ADDON_SECRET ?? '';
  res.json({
    secretLen: secret.length,
    secretStart: secret.substring(0, 8),
    secretEnd: secret.substring(secret.length - 4),
    addonBase: process.env.C3_TENANT_OPENCLAW_PROD_ADDON_BASE ?? '(unset)',
    apiKeyLen: (process.env.C3_TENANT_BR_API_KEY ?? '').length,
    apiKeyStart: (process.env.C3_TENANT_BR_API_KEY ?? '').substring(0, 4),
  });
});
