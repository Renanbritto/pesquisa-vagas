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

  const cards = [
    {
      id: 'total' as const,
      label: 'Total Geral',
      count: totalDisplay,
      colorText: 'text-slate-900 dark:text-white',
      activeRing: 'ring-2 ring-violet-500 border-violet-500/60 bg-violet-50/70 dark:bg-violet-950/30',
      hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
    },
    {
      id: 'novas' as const,
      label: 'Novas Vagas',
      count: stats.novas,
      colorText: 'text-emerald-600 dark:text-emerald-400',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/30',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    {
      id: 'remoto' as const,
      label: 'Remotas',
      count: stats.remotas,
      colorText: 'text-teal-600 dark:text-teal-400',
      activeRing: 'ring-2 ring-teal-500 border-teal-500/60 bg-teal-50/70 dark:bg-teal-950/30',
      hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-700',
    },
    {
      id: 'hibrido' as const,
      label: 'Híbridas',
      count: stats.hibridas,
      colorText: 'text-amber-600 dark:text-amber-400',
      activeRing: 'ring-2 ring-amber-500 border-amber-500/60 bg-amber-50/70 dark:bg-amber-950/30',
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    {
      id: 'presencial' as const,
      label: 'Presenciais',
      count: stats.presenciais,
      colorText: 'text-purple-600 dark:text-purple-400',
      activeRing: 'ring-2 ring-purple-500 border-purple-500/60 bg-purple-50/70 dark:bg-purple-950/30',
      hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
  ];

  return (
    <div 
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 py-1"
      role="region" 
      aria-label="Métricas rápidas e filtros"
    >
      {cards.map((card) => {
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => handleClick(card.id)}
            aria-pressed={isActive}
            className={`group relative bg-white/95 dark:bg-slate-900/70 border rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 backdrop-blur-md flex flex-col justify-between ${
              isActive
                ? card.activeRing
                : `border-slate-200/90 dark:border-slate-800/80 ${card.hoverBorder}`
            }`}
          >
            {/* Topo: Titulo */}
            <div className="mb-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                {card.label}
              </span>
            </div>

            {/* Centro: Numero Grande */}
            <div className="mt-1">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${card.colorText}`}>
                {card.count}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
