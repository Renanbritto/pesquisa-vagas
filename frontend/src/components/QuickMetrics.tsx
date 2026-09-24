import React from 'react';
import { Estatisticas, QuickFilterType } from '../types/job';

interface QuickMetricsProps {
  stats: Estatisticas;
  totalVagasCarregadas: number;
  activeFilter: QuickFilterType;
  onSelectFilter: (filter: QuickFilterType) => void;
}

export function QuickMetrics({
  stats,
  totalVagasCarregadas,
  activeFilter,
  onSelectFilter
}: QuickMetricsProps) {
  const totalDisplay = stats.total || totalVagasCarregadas;

  const handleClick = (filter: QuickFilterType) => {
    if (activeFilter === filter) {
      onSelectFilter(null);
    } else {
      onSelectFilter(filter);
    }
  };

  const getCardStyle = (isActive: boolean, activeColorClass: string) => {
    if (isActive) {
      return `ring-2 ${activeColorClass} shadow-md -translate-y-0.5 scale-[1.02]`;
    }
    return 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5';
  };

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap" role="region" aria-label="Métricas rápidas e filtros">
      {/* 1. Total Geral */}
      <button
        type="button"
        onClick={() => handleClick('total')}
        aria-pressed={activeFilter === 'total'}
        className={`group bg-white/90 dark:bg-slate-900/90 border rounded-xl px-3.5 py-2 shadow-xs backdrop-blur-md min-w-[100px] text-left transition-all cursor-pointer ${getCardStyle(
          activeFilter === 'total',
          'ring-violet-500 border-violet-500/50 bg-violet-50/70 dark:bg-violet-950/30'
        )}`}
      >
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
          Total Geral
        </p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 leading-none">
          {totalDisplay}
        </p>
      </button>

      {/* 2. Novas */}
      <button
        type="button"
        onClick={() => handleClick('novas')}
        aria-pressed={activeFilter === 'novas'}
        className={`group bg-white/90 dark:bg-slate-900/90 border rounded-xl px-3.5 py-2 shadow-xs backdrop-blur-md min-w-[100px] text-left transition-all cursor-pointer ${getCardStyle(
          activeFilter === 'novas',
          'ring-emerald-500 border-emerald-500/60 bg-emerald-50/80 dark:bg-emerald-950/40'
        )}`}
      >
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold leading-none">
          Novas
        </p>
        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 leading-none">
          {stats.novas}
        </p>
      </button>

      {/* 3. Remotas */}
      <button
        type="button"
        onClick={() => handleClick('remoto')}
        aria-pressed={activeFilter === 'remoto'}
        className={`group bg-white/90 dark:bg-slate-900/90 border rounded-xl px-3.5 py-2 shadow-xs backdrop-blur-md min-w-[100px] text-left transition-all cursor-pointer ${getCardStyle(
          activeFilter === 'remoto',
          'ring-teal-500 border-teal-500/60 bg-teal-50/80 dark:bg-teal-950/40'
        )}`}
      >
        <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium leading-none">
          Remotas
        </p>
        <p className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-1 leading-none">
          {stats.remotas}
        </p>
      </button>

      {/* 4. Hibridas */}
      <button
        type="button"
        onClick={() => handleClick('hibrido')}
        aria-pressed={activeFilter === 'hibrido'}
        className={`group bg-white/90 dark:bg-slate-900/90 border rounded-xl px-3.5 py-2 shadow-xs backdrop-blur-md min-w-[100px] text-left transition-all cursor-pointer ${getCardStyle(
          activeFilter === 'hibrido',
          'ring-amber-500 border-amber-500/60 bg-amber-50/80 dark:bg-amber-950/40'
        )}`}
      >
        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-none">
          Híbridas
        </p>
        <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1 leading-none">
          {stats.hibridas}
        </p>
      </button>

      {/* 5. Presenciais */}
      <button
        type="button"
        onClick={() => handleClick('presencial')}
        aria-pressed={activeFilter === 'presencial'}
        className={`group bg-white/90 dark:bg-slate-900/90 border rounded-xl px-3.5 py-2 shadow-xs backdrop-blur-md min-w-[100px] text-left transition-all cursor-pointer ${getCardStyle(
          activeFilter === 'presencial',
          'ring-purple-500 border-purple-500/60 bg-purple-50/80 dark:bg-purple-950/40'
        )}`}
      >
        <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium leading-none">
          Presenciais
        </p>
        <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1 leading-none">
          {stats.presenciais}
        </p>
      </button>
    </div>
  );
}
