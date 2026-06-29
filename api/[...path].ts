/**
 * Vercel catch-all serverless function.
 *
 * Mounts the Express app on every path under /. Vercel routes all
 * non-asset requests to this function; Express handles the /api/*
 * matching internally.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/index.js';

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse): void {
  app(req, res);
}