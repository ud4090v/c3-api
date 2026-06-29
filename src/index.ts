/**
 * Public API — Vercel serverless entrypoint.
 *
 * The whole API is a router: every /api/* call is forwarded to the
 * tenant's add-on with HMAC signing. No customer data persists here.
 *
 * For Vercel: this file is exposed via api/index.ts (a thin shim that
 * imports and exports the handler). For local dev, run `pnpm dev` which
 * starts a real Express listener on PORT (default 3000).
 */
import express, { type Request, type Response } from 'express';
import { TENANTS } from './tenants.js';
import { tenantAuthMiddleware } from './middleware/auth.js';
import { requestLogger } from './middleware/logging.js';
import { buildProxyRouter } from './routes/proxy.js';

export function createApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // /api/health is the liveness probe — no auth, no upstream call
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        tenants: TENANTS.length,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Authenticated proxy for all other /api/* paths
  app.use('/api', tenantAuthMiddleware);
  app.use('/api', (req: Request, res: Response, next) => {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'tenant not resolved' });
      return;
    }
    const addonSecret = process.env[`C3_TENANT_${tenant.orgId.replace(/-/g, '_').toUpperCase()}_ADDON_SECRET`];
    if (!addonSecret) {
      res.status(500).json({ success: false, error: 'addon secret not configured for tenant' });
      return;
    }
    const proxy = buildProxyRouter(tenant.addonBaseUrl, tenant.orgId, addonSecret);
    proxy(req, res, next);
  });

  return app;
}

// Local dev server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = parseInt(process.env.PORT ?? '3000', 10);
  const app = createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[c3-api] listening on http://127.0.0.1:${port}`);
  });
}