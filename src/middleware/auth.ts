/**
 * Public API auth: the SPA sends X-C3-Api-Key with every request.
 *
 * For v1 (single-org), this is a simple equality check against the
 * provisioned API key for the org. The SPA is the only legitimate caller
 * (same-origin via Vercel rewrite; no direct browser access to this layer
 * unless CORS is misconfigured — which it isn't, because there is no CORS).
 *
 * Tenant is attached to req for downstream handlers.
 */
import type { Request, Response, NextFunction } from 'express';
import { findTenantByApiKey, type TenantConfig } from '../tenants.js';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantConfig;
    }
  }
}

export function tenantAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for /api/health (liveness probe for Vercel + monitoring)
  if (req.path === '/health') {
    next();
    return;
  }

  const apiKey = req.header('X-C3-Api-Key');
  const tenant = findTenantByApiKey(apiKey);
  if (!tenant) {
    res.status(401).json({ success: false, error: 'invalid or missing API key' });
    return;
  }
  req.tenant = tenant;
  next();
}