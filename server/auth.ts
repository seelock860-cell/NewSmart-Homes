import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

// Ephemeral fallback secret for preview if SESSION_SECRET is not explicitly provided
const SESSION_SIGNING_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHex, 'hex');
  if (derivedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, expectedBuffer);
}

export function verifyEnvAdminPassword(inputPassword: string): boolean {
  const envPass = process.env.ADMIN_PASSWORD?.trim();
  if (!envPass) return false;
  const a = Buffer.from(inputPassword, 'utf8');
  const b = Buffer.from(envPass, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface TokenPayload {
  sub: string;
  role: 'admin';
  exp: number;
}

export function createSessionToken(subject: string): string {
  const payload: TokenPayload = {
    sub: subject,
    role: 'admin',
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SIGNING_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, providedSignature] = parts;
    if (!encodedPayload || !providedSignature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SIGNING_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    const providedBuf = Buffer.from(providedSignature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (providedBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;
    if (parsed.role !== 'admin' || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export interface AdminRequest extends Request {
  adminSubject?: string;
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in as administrator.' });
  }
  const verified = verifySessionToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
  req.adminSubject = verified.sub;
  next();
}
