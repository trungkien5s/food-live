// src/common/token.util.ts
import * as crypto from 'crypto';

export function generateActivationToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex'); // 64 chars
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}
