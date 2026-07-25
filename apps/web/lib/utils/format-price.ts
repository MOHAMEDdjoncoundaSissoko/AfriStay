export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}