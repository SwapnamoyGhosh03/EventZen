import crypto from 'crypto';

export function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHmacSignature(payload: string, secret: string, signature: string): boolean {
  const expected = generateHmacSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
