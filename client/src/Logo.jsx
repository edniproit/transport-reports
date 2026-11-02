const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <svg viewBox="0 0 48 48" width="1.1em" height="1.1em" {...stroke}>
        <path d="M4 14V8a4 4 0 0 1 4-4h6M34 4h6a4 4 0 0 1 4 4v6M44 34v6a4 4 0 0 1-4 4h-6M14 44H8a4 4 0 0 1-4-4v-6" />
        <path d="M18 14l16 14-7 1 4 8-4 2-4-8-5 5z" />
      </svg>
      <span>єДніпро</span>
    </span>
  );
}

// Прості лінійні піктограми видів транспорту для шапки звіту.
export function TransportIcons() {
  return (
    <span className="transport-icons">
      <svg viewBox="0 0 48 48" {...stroke}>
        <path d="M4 12l40-6M24 9v7" />
        <rect x="9" y="16" width="30" height="20" rx="5" />
        <path d="M9 26h30M18 16v10M30 16v10M16 36l-3 5M32 36l3 5" />
      </svg>
      <svg viewBox="0 0 48 48" {...stroke}>
        <rect x="10" y="5" width="28" height="34" rx="9" />
        <path d="M10 25h28M17 31h.01M31 31h.01M16 39l-3 4M32 39l3 4" />
      </svg>
      <svg viewBox="0 0 48 48" {...stroke}>
        <path d="M5 14a4 4 0 0 1 4-4h22l10 12v12H5z" />
        <path d="M5 22h36M24 10v12" />
        <circle cx="14" cy="35" r="4" />
        <circle cx="33" cy="35" r="4" />
      </svg>
      <svg viewBox="0 0 48 48" {...stroke}>
        <rect x="10" y="5" width="28" height="34" rx="6" />
        <path d="M10 20h28M24 5v15M18 32h.01M30 32h.01M16 39l-3 4M32 39l3 4" />
      </svg>
    </span>
  );
}

export function Shield() {
  return (
    <svg viewBox="0 0 32 36" width="26" height="30" {...stroke} strokeWidth="2.6">
      <path d="M16 3L4 8v9c0 8 5 13 12 16 7-3 12-8 12-16V8z" />
      <path d="M11 15l5 5 5-5" />
    </svg>
  );
}
