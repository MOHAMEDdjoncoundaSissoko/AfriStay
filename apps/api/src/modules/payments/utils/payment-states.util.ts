export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

/**
 * Transitions autorisées : chaque clé ne peut aller que vers les valeurs du tableau
 */
const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PROCESSING, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
  [PaymentStatus.PROCESSING]: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED],
  [PaymentStatus.SUCCEEDED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING], // retry autorisé
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.CANCELLED]: [],
};

export function canTransitionTo(
  current: string,
  next: string,
): boolean {
  const currentStatus = current as PaymentStatus;
  const nextStatus = next as PaymentStatus;

  if (!ALLOWED_TRANSITIONS[currentStatus]) return false;
  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function assertTransition(
  current: string,
  next: string,
): void {
  if (!canTransitionTo(current, next)) {
    throw new Error(
      `Transition de paiement interdite : ${current} → ${next}`,
    );
  }
}