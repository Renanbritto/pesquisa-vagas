import React, { useState } from 'react';
import { getCompanyInitials, getCompanyGradient } from '../utils/companyUtils';

interface CompanyAvatarProps {
  name?: string;
  logoUrl?: string;
  size?: number;
  className?: string;
}

export function CompanyAvatar({ name, logoUrl, size = 32, className = '' }: CompanyAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getCompanyInitials(name);
  const gradient = getCompanyGradient(name);

  if (logoUrl && !imgError) {
    return (
      <div 
        className={`w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center justify-center p-0.5 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <img
          src={logoUrl}
          alt={name || 'Empresa'}
          className="w-full h-full object-contain rounded"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs shadow-xs select-none bg-gradient-to-br ${gradient} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      title={name || 'Empresa'}
      aria-label={name || 'Empresa'}
    >
      <span>{initials}</span>
    </div>
  );
}
