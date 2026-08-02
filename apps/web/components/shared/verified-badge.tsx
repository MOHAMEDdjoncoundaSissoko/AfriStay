export function VerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  return (
    <span className={`inline-flex items-center font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full ${sizeClasses}`}>
      <i className="fa-solid fa-circle-check" />
      Vérifié
    </span>
  );
}