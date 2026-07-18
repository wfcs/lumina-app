export function LuminaMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="luminaGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#52528C" />
          <stop offset="1" stopColor="#D7B8F3" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="25" fill="none" stroke="url(#luminaGrad)" strokeWidth="7" />
      <circle cx="32" cy="32" r="10.5" fill="#4FCE9A" />
      <circle cx="32" cy="32" r="3.5" fill="#52528C" />
    </svg>
  );
}
