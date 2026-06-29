/**
 * Generic add-on forwarder.
 *
 * For every /api/* endpoint, this layer doesn't know the data shape.
 * It just forwards the request to the org's add-on with HMAC signing,
 * then returns the response verbatim.
 *
 * This is the entire point of the three-layer split: the public API
 * is a router, not a transformer. Customer data lives on the customer's
 * box (layer 3), and the public API never sees it directly.
 */
import { Router, type Request, type Response } from 'express';
import { buildSignedRequest } from '../addon-client.js';
import { logger } from '../middleware/logging.js';

const TIMEOUT_MS = 9_500; // Vercel hobby serverless timeout is 10s; leave 500ms headroom

/**
 * Build a sub-router that proxies all requests under /api/* to the add-on's
 * corresponding /openclaw/* path.
 *
 * Path mapping: /api/agents/foo → <addonBaseUrl>/openclaw/agents/foo
 *
 * The add-on exposes everything under /openclaw/* per its ARCHITECTURE.md.
 * The SPA calls everything under /api/*. This router translates between them.
 */
export function buildProxyRouter(addonBaseUrl: string, orgId: string, addonSecret: string): Router {
  const r = Router();

  r.all(/.*/, async (req: Request, res: Response) => {
    // req.path inside this sub-router mounted at /api is the part after /api.
    // req.url is the full original URL including query.
    const subPath = req.path.replace(/^\//, ''); // strip leading /
    const addonPath = subPath ? `/openclaw/${subPath}` : '/openclaw';
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';

    let body: unknown;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = req.body;
    }

    const signed = buildSignedRequest({
      method: req.method as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
      path: addonPath,
      body,
      orgId,
      secret: addonSecret,
    });

    const url = `${addonBaseUrl}${addonPath}${query}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const upstream = await fetch(url, {
        method: req.method,
        headers: signed.headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : signed.body,
        signal: controller.signal,
      });

      const text = await upstream.text();
      const status = upstream.status;

      res.status(status);
      const ct = upstream.headers.get('content-type');
      if (ct) res.setHeader('Content-Type', ct);
      res.send(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ org: orgId, addonPath, err: message }, 'add-on call failed');
      const isTimeout = controller.signal.aborted;
      res.status(isTimeout ? 504 : 502).json({
        success: false,
        error: isTimeout ? 'add-on timeout' : `add-on unreachable: ${message}`,
      });
    } finally {
      clearTimeout(timer);
    }
  });

  return r;
}