import * as crypto from 'crypto';

/**
 * Vérifie la signature d'un webhook CinetPay
 * CinetPay envoie un header "x-token" qui est le HMAC-SHA256 du body JSON avec la clé secrète
 */
export function verifyCinetPaySignature(
  rawBody: string,
  signature: string | undefined,
  secretKey: string,
): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expected, 'utf8'),
  );
}

/**
 * Vérifie la signature d'un webhook Paystack
 * Paystack envoie un header "x-paystack-signature" qui est le HMAC-SHA512 du raw body avec la clé secrète
 */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string | undefined,
  secretKey: string,
): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expected, 'utf8'),
  );
}