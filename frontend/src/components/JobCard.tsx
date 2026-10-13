import React from 'react';
import { Vaga } from '../types/job';
import { PlatformIcon } from './PlatformIcon';
import { formatRelativeTime, formatFullDateTooltip, normalizarModalidade } from '../utils/dateUtils';
import { 
  Bookmark, 
  CheckCircle2, 
  EyeOff, 
  MapPin, 
  Calendar, 
  ExternalLink 
} from 'lucide-react';

interface JobCardProps {
  vaga: Vaga;
  isSaved?: boolean;
  isApplied?: boolean;
  isHidden?: boolean;
  onToggleSave?: (id: string) => void;
  onToggleApplied?: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onOpenLink?: (id: string) => void;
}

export function JobCard({
  vaga,
  isSaved = false,
  isApplied = false,
  isHidden = false,
  onToggleSave,
  onToggleApplied,
  onToggleHide,
  onOpenLink,
}: JobCardProps) {
  const isEasy = Boolean(vaga.easy_apply);
  const modalidadeExibicao = normalizarModalidade(vaga.modalidade);
  const relativeDate = formatRelativeTime(vaga.data_postagem, vaga.data_coleta, vaga._timestamp);
  const fullDateTooltip = formatFullDateTooltip(vaga.data_postagem, vaga.data_coleta, vaga._timestamp);

  return (
    <article
      className={`group relative bg-[#0b0f1a]/95 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-xl hover:-translate-y-0.5 border ${
        isApplied
          ? 'border-[#10b981]/40 bg-[#10b981]/5 shadow-[#10b981]/5'
          : vaga.is_nova
          ? 'border-[#10b981]/35 shadow-[#10b981]/5'
          : 'border-white/10 hover:border-white/25 hover:shadow-cyan-500/5'
      }`}
    >
      <div className="space-y-3">
        {/* Topo: Nome da Empresa / Localização + Ações Rápidas */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-heading font-semibold text-xs text-slate-200 truncate leading-snug block">
              {vaga.empresa || 'Empresa Confidencial'}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 font-sans">
              <MapPin className="w-3 h-3 text-[#06b6d4] shrink-0" />
              <span className="truncate">{vaga.localizacao || 'Brasil'}</span>
            </div>
          </div>

          {/* Quick Actions (Favoritar, Candidatado, Ocultar) com touch targets acessíveis */}
          <div className="flex items-center gap-1 shrink-0 -mr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave?.(vaga.id);
              }}
              title={isSaved ? "Remover dos favoritos" : "Salvar vaga"}
              aria-label={isSaved ? "Remover dos favoritos" : "Salvar vaga"}
              className={`w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95 ${
                isSaved
                  ? 'text-[#f59e0b] bg-[#f59e0b]/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleApplied?.(vaga.id);
              }}
              title={isApplied ? "Candidatura marcada (clique para desfazer)" : "Marcar como candidatado"}
              aria-label={isApplied ? "Candidatura marcada" : "Marcar como candidatado"}
              className={`w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95 ${
                isApplied
                  ? 'text-[#10b981] bg-[#10b981]/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isApplied ? 'fill-[#10b981]/20' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHide?.(vaga.id);
              }}
              title={isHidden ? "Restaurar vaga" : "Ocultar vaga da listagem"}
              aria-label={isHidden ? "Restaurar vaga" : "Ocultar vaga"}
              className={`w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95 ${
                isHidden
                  ? 'text-[#f43f5e] bg-[#f43f5e]/15'
                  : 'text-slate-400 hover:text-[#f43f5e] hover:bg-white/10'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Badges Racionalizados */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {/* Status Novo */}
          {vaga.is_nova && (
            <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-lg border bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 shadow-xs flex items-center gap-1">
              Novo
            </span>
          )}

          {/* Plataforma: Neutro + Mini Logo SVG */}
          <span className="text-[10px] font-heading font-medium px-2 py-0.5 rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 flex items-center gap-1.5">
            <PlatformIcon platform={vaga.plataforma} size={11} />
            <span>{vaga.plataforma || 'Vaga'}</span>
          </span>

          {/* Modalidade: Estilo Neon Semântico Sutil */}
          <span className={`text-[10px] font-heading font-medium px-2 py-0.5 rounded-lg border ${
            modalidadeExibicao.toLowerCase().includes('remot')
              ? 'border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#06b6d4]'
              : modalidadeExibicao.toLowerCase().includes('híbrid') || modalidadeExibicao.toLowerCase().includes('hibrid')
              ? 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]'
              : 'border-[#f43f5e]/30 bg-[#f43f5e]/10 text-[#f43f5e]'
          }`}>
            {modalidadeExibicao}
          </span>

          {/* Aplicação Simplificada: Minimalista e Discreto */}
          {isEasy && (
            <span className="text-[10px] font-heading font-medium px-2 py-0.5 rounded-lg border border-[#f59e0b]/30 text-[#f59e0b] bg-[#f59e0b]/10">
              Aplicação Simplificada
            </span>
          )}
        </div>

        {/* Titulo da Vaga */}
        <h3 className="font-heading font-bold text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-[#06b6d4] transition-colors">
          {vaga.titulo}
        </h3>
      </div>

      {/* Rodapé do Cartão */}
      <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between gap-2">
        {/* Data com Tempo Relativo + Tooltip Nativo */}
        <div 
          className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-help font-mono"
          title={fullDateTooltip}
        >
          <Calendar className="w-3 h-3 text-[#06b6d4]" />
          <span className="font-medium text-slate-300">
            {relativeDate}
          </span>
        </div>

        {/* Botao CTA Primario em estilo Secondary / Outline Elegante com touch-friendly padding */}
        <a
          href={vaga.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onOpenLink?.(vaga.id)}
          aria-label={`Ver vaga de ${vaga.titulo} na empresa ${vaga.empresa || 'confidencial'}`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-[#06b6d4] hover:text-slate-950 hover:border-[#06b6d4] text-slate-200 text-xs font-heading font-semibold transition-all duration-200 shadow-sm active:scale-[0.98]"
        >
          <span>Ver Vaga</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
