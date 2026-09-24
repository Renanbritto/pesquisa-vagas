import React from 'react';
import { Briefcase } from 'lucide-react';

interface PlatformIconProps {
  platform?: string;
  className?: string;
  size?: number;
}

export function PlatformIcon({ platform = '', className = '', size = 13 }: PlatformIconProps) {
  const p = platform.toLowerCase();

  if (p.includes('linkedin')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`shrink-0 text-[#0a66c2] ${className}`}
        aria-label="LinkedIn"
      >
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    );
  }

  if (p.includes('gupy')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 text-emerald-500 ${className}`}
        aria-label="Gupy"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M10 9a3 3 0 1 0 3 3v4" />
        <path d="M13 13h2" />
      </svg>
    );
  }

  if (p.includes('indeed')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`shrink-0 text-[#2164f3] ${className}`}
        aria-label="Indeed"
      >
        <path d="M11.56 0c1.88 0 3.3.49 4.3 1.48 1.05 1.03 1.57 2.45 1.57 4.28 0 2.27-.78 4.3-2.34 6.07-.37.42-.78.82-1.22 1.2.62.66 1.15 1.4 1.58 2.22.45.86.68 1.77.68 2.73 0 1.83-.55 3.32-1.65 4.47C13.38 23.6 11.9 24 10.02 24c-1.84 0-3.32-.41-4.43-1.22-1.12-.81-1.74-1.99-1.88-3.53h3.58c.11.66.38 1.14.81 1.45.45.31 1.1.47 1.95.47 1.04 0 1.84-.26 2.4-.78.56-.52.84-1.25.84-2.18 0-.96-.34-1.74-1.03-2.33-.69-.6-1.71-1.07-3.06-1.42l-1.39-.36c-1.66-.43-2.9-1.14-3.72-2.13C3.27 10.98 2.85 9.7 2.85 8.12c0-1.83.56-3.29 1.68-4.38C5.65.65 7.15 0 9.03 0h2.53zm-1.74 3.12c-.78 0-1.42.23-1.92.68-.5.45-.75 1.07-.75 1.86 0 .75.24 1.34.72 1.78.48.43 1.14.77 1.98 1.01l1.19.34c1.19.34 2.06.84 2.62 1.5.56.66.84 1.47.84 2.43 0-1.25.4-2.28 1.2-3.09.81-.81 1.83-1.22 3.06-1.22-.05-.8-.32-1.44-.81-1.93-.49-.49-1.19-.74-2.1-.74h-6.03z"/>
      </svg>
    );
  }

  return <Briefcase size={size} className={`shrink-0 text-slate-400 ${className}`} aria-label={platform || "Vaga"} />;
}
