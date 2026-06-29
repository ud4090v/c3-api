/**
 * HMAC-signed HTTP client for talking to per-org add-ons.
 *
 * Reuses the wire protocol the add-on expects:
 *   X-C3-Org-Id    – org identifier
 *   X-C3-Timestamp – unix seconds
 *   X-C3-Nonce     – 16 random bytes hex
 *   X-C3-Signature – hex HMAC-SHA256
 *
 * String-to-sign: <METHOD>\n<PATH>\n<TIMESTAMP>\n<NONCE>\n<sha256(body)-hex>
 *
 * The shared secret is the add-on's API secret (NOT the public API key the
 * SPA uses — those are different secrets, paired across the trust boundary).
 */
import { createHash, createHmac, randomBytes } from 'crypto';

export interface SignedRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  orgId: string;
  secret: string; // base64-encoded HMAC key
}

export interface SignedRequestResult {
  headers: Record<string, string>;
  body: string;
}

export function buildSignedRequest(opts: SignedRequestOptions): SignedRequestResult {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString('hex');
  const bodyStr = opts.body !== undefined ? JSON.stringify(opts.body) : '';
  const bodyHash = createHash('sha256').update(bodyStr).digest('hex');
  const stringToSign = [opts.method, opts.path, String(timestamp), nonce, bodyHash].join('\n');

  const keyBytes = Buffer.from(opts.secret, 'base64');
  const signature = createHmac('sha256', keyBytes).update(stringToSign).digest('hex');

  return {
    headers: {
      'X-C3-Org-Id': opts.orgId,
      'X-C3-Timestamp': String(timestamp),
      'X-C3-Nonce': nonce,
      'X-C3-Signature': signature,
      'Content-Type': 'application/json',
    },
    body: bodyStr,
  };
}
