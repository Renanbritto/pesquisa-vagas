import React from 'react';
import { Estatisticas, QuickFilterType } from '../types/job';

interface QuickMetricsProps {
  stats: Estatisticas;
  totalVagasCarregadas: number;
  activeFilter: QuickFilterType;
  onSelectFilter: (filter: QuickFilterType) => void;
  isLoading?: boolean;
}

export function QuickMetrics({
  stats,
  totalVagasCarregadas,
  activeFilter,
  onSelectFilter,
  isLoading
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
      colorText: 'text-[#06b6d4]',
      glowColor: 'shadow-[#06b6d4]/20',
      dotColor: 'bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]',
      activeRing: 'ring-2 ring-[#06b6d4] border-[#06b6d4]/60 bg-[#06b6d4]/10 shadow-lg shadow-[#06b6d4]/25',
      hoverBorder: 'hover:border-[#06b6d4]/50 hover:shadow-lg hover:shadow-[#06b6d4]/15',
    },
    {
      id: 'novas' as const,
      label: 'Novas Vagas',
      count: stats.novas,
      colorText: 'text-[#10b981]',
      glowColor: 'shadow-[#10b981]/20',
      dotColor: 'bg-[#10b981] shadow-[0_0_8px_#10b981]',
      activeRing: 'ring-2 ring-[#10b981] border-[#10b981]/60 bg-[#10b981]/10 shadow-lg shadow-[#10b981]/25',
      hoverBorder: 'hover:border-[#10b981]/50 hover:shadow-lg hover:shadow-[#10b981]/15',
    },
    {
      id: 'remoto' as const,
      label: 'Remotas',
      count: stats.remotas,
      colorText: 'text-[#06b6d4]',
      glowColor: 'shadow-[#06b6d4]/20',
      dotColor: 'bg-[#06b6d4] shadow-[0_0_8px_#06b6d4]',
      activeRing: 'ring-2 ring-[#06b6d4] border-[#06b6d4]/60 bg-[#06b6d4]/10 shadow-lg shadow-[#06b6d4]/25',
      hoverBorder: 'hover:border-[#06b6d4]/50 hover:shadow-lg hover:shadow-[#06b6d4]/15',
    },
    {
      id: 'hibrido' as const,
      label: 'Híbridas',
      count: stats.hibridas,
      colorText: 'text-[#f59e0b]',
      glowColor: 'shadow-[#f59e0b]/20',
      dotColor: 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]',
      activeRing: 'ring-2 ring-[#f59e0b] border-[#f59e0b]/60 bg-[#f59e0b]/10 shadow-lg shadow-[#f59e0b]/25',
      hoverBorder: 'hover:border-[#f59e0b]/50 hover:shadow-lg hover:shadow-[#f59e0b]/15',
    },
    {
      id: 'presencial' as const,
      label: 'Presenciais',
      count: stats.presenciais,
      colorText: 'text-[#f43f5e]',
      glowColor: 'shadow-[#f43f5e]/20',
      dotColor: 'bg-[#f43f5e] shadow-[0_0_8px_#f43f5e]',
      activeRing: 'ring-2 ring-[#f43f5e] border-[#f43f5e]/60 bg-[#f43f5e]/10 shadow-lg shadow-[#f43f5e]/25',
      hoverBorder: 'hover:border-[#f43f5e]/50 hover:shadow-lg hover:shadow-[#f43f5e]/15',
    },
  ];

  return (
    <div className="relative overflow-hidden -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
      <div 
        className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5 overflow-x-auto sm:overflow-visible pb-1.5 pt-0.5 scrollbar-none snap-x [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent_100%)] sm:[mask-image:none]"
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
              className={`group relative bg-[#0b0f1a]/95 backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-2.5 sm:p-4.5 text-left transition-all duration-200 cursor-pointer shadow-xl hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between shrink-0 min-w-[104px] xs:min-w-[114px] sm:min-w-0 flex-1 snap-start ${
                isActive
                  ? card.activeRing
                  : `border-white/10 ${card.hoverBorder}`
              }`}
            >
              {/* Topo: Rótulo / Título em Comfortaa com Indicador Neon */}
              <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
                <span className="font-heading text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider uppercase truncate block">
                  {card.label}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.dotColor}`} />
              </div>

              {/* Centro/Base: Valor Métrico em JetBrains Mono extrabold */}
              <div className="mt-0.5 sm:mt-1 h-7 sm:h-9 flex items-center">
                {isLoading && totalDisplay === 0 ? (
                  <div className="h-5 sm:h-7 w-10 sm:w-12 rounded-lg bg-white/10 animate-pulse" />
                ) : (
                  <span className={`font-mono font-extrabold text-xl sm:text-3xl tracking-tight block ${card.colorText}`}>
                    {card.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
