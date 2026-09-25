import React from 'react';
import { Vaga } from '../types/job';
import { CompanyAvatar } from './CompanyAvatar';
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
}

export function JobCard({
  vaga,
  isSaved = false,
  isApplied = false,
  isHidden = false,
  onToggleSave,
  onToggleApplied,
  onToggleHide,
}: JobCardProps) {
  const isEasy = Boolean(vaga.easy_apply);
  const modalidadeExibicao = normalizarModalidade(vaga.modalidade);
  const relativeDate = formatRelativeTime(vaga.data_postagem, vaga.data_coleta);
  const fullDateTooltip = formatFullDateTooltip(vaga.data_postagem, vaga.data_coleta);

  return (
    <article
      className={`group relative bg-white/95 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/90 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-violet-500/5 hover:-translate-y-0.5 backdrop-blur-md ${
        isApplied
          ? 'border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
          : vaga.is_nova
          ? 'border-2 border-emerald-500/40 dark:border-emerald-500/30'
          : 'border border-slate-200/90 dark:border-slate-800/80 hover:border-violet-300 dark:hover:border-violet-500/40'
      }`}
    >
      <div className="space-y-3">
        {/* Topo: Avatar da Empresa + Nome/Localizacao + Acoes Rapidas */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <CompanyAvatar name={vaga.empresa} size={32} />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate leading-snug">
                {vaga.empresa || 'Empresa Confidencial'}
              </h4>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{vaga.localizacao || 'Brasil'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Favoritar, Candidatado, Ocultar) */}
          <div className="flex items-center gap-1 shrink-0 -mr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave?.(vaga.id);
              }}
              title={isSaved ? "Remover dos favoritos" : "Salvar vaga"}
              aria-label={isSaved ? "Remover dos favoritos" : "Salvar vaga"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSaved
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isApplied
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isApplied ? 'fill-emerald-500/20' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleHide?.(vaga.id);
              }}
              title={isHidden ? "Restaurar vaga" : "Ocultar vaga da listagem"}
              aria-label={isHidden ? "Restaurar vaga" : "Ocultar vaga"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isHidden
                  ? 'text-rose-500 hover:text-rose-600 bg-rose-500/10'
                  : 'text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30 dark:border-emerald-500/30 shadow-xs flex items-center gap-1">
              Novo
            </span>
          )}

          {/* Plataforma: Neutro + Mini Logo SVG */}
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <PlatformIcon platform={vaga.plataforma} size={11} />
            <span>{vaga.plataforma || 'Vaga'}</span>
          </span>

          {/* Modalidade: Estilo Outline Sutil */}
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-300/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-transparent">
            {modalidadeExibicao}
          </span>

          {/* Aplicação Simplificada: Minimalista e Discreto */}
          {isEasy && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-amber-400/40 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/5">
              Aplicação Simplificada
            </span>
          )}
        </div>

        {/* Titulo da Vaga */}
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
          {vaga.titulo}
        </h3>
      </div>

      {/* Rodapé do Cartão */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-2">
        {/* Data com Tempo Relativo + Tooltip Nativo */}
        <div 
          className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-help"
          title={fullDateTooltip}
        >
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {relativeDate}
          </span>
        </div>

        {/* Botao CTA Primario em estilo Secondary / Outline Elegante */}
        <a
          href={vaga.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-violet-600/30 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-950/20 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white text-xs font-semibold transition-all duration-200 shadow-xs hover:shadow-sm hover:scale-[1.02]"
        >
          <span>Ver Vaga</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
}
