import React, { useState } from 'react';
import { Search, X, Bookmark, CheckCircle2, EyeOff, RotateCcw, ChevronDown, Zap, SlidersHorizontal } from 'lucide-react';
import { UserViewTab } from '../types/job';

interface FilterBarProps {
  busca: string;
  onBuscaChange: (val: string) => void;
  plataforma: string;
  onPlataformaChange: (val: string) => void;
  modalidade: string;
  onModalidadeChange: (val: string) => void;
  area: string;
  onAreaChange: (val: string) => void;
  senioridade: string;
  onSenioridadeChange: (val: string) => void;
  easyApply: boolean;
  onEasyApplyToggle: () => void;
  apenasNovas: boolean;
  onApenasNovasToggle: () => void;
  userTab: UserViewTab;
  onUserTabChange: (tab: UserViewTab) => void;
  savedCount: number;
  appliedCount: number;
  hiddenCount: number;
  onLimparFiltros: () => void;
  temFiltroAtivo: boolean;
}

export function FilterBar({
  busca,
  onBuscaChange,
  plataforma,
  onPlataformaChange,
  modalidade,
  onModalidadeChange,
  area,
  onAreaChange,
  senioridade,
  onSenioridadeChange,
  easyApply,
  onEasyApplyToggle,
  apenasNovas,
  onApenasNovasToggle,
  userTab,
  onUserTabChange,
  savedCount,
  appliedCount,
  hiddenCount,
  onLimparFiltros,
  temFiltroAtivo,
}: FilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeDropdownsCount = 
    (plataforma !== "Todas" ? 1 : 0) +
    (modalidade !== "Todas" ? 1 : 0) +
    (area !== "Todas" ? 1 : 0) +
    (senioridade !== "Todas" ? 1 : 0);

  return (
    <section className="sticky top-0 z-30 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm p-3 sm:p-4 space-y-2.5 sm:space-y-3 transition-all">
      
      {/* LINHA 1: Barra de Busca + Toggles Rápidos */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Campo de Busca Espaçoso */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="Buscar por cargo, tecnologia ou empresa..."
            aria-label="Buscar vagas por cargo, tecnologia ou empresa"
            className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          {busca && (
            <button
              onClick={() => onBuscaChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              aria-label="Limpar campo de busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggles Rápidos (Novas & Easy Apply) + Botão de Filtros Mobile + Limpar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto sm:overflow-visible pb-0.5 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={onApenasNovasToggle}
            className={`flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 sm:py-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              apenasNovas
                ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'bg-slate-100/70 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Novas Vagas</span>
          </button>

          <button
            type="button"
            onClick={onEasyApplyToggle}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 sm:py-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              easyApply
                ? 'bg-amber-500/15 border-amber-500/60 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'bg-slate-100/70 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden xs:inline">Aplicação Simplificada</span>
            <span className="xs:hidden">Simplificada</span>
          </button>

          {/* Botão de Expandir Filtros em Mobile (< lg) */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              showMobileFilters || activeDropdownsCount > 0
                ? 'bg-violet-600/15 border-violet-500/60 text-violet-700 dark:text-violet-300 shadow-xs'
                : 'bg-slate-100/70 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            aria-label="Abrir filtros de plataforma, modalidade, área e senioridade"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeDropdownsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-600 text-white text-[10px] font-bold">
                {activeDropdownsCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>

          {temFiltroAtivo && (
            <button
              type="button"
              onClick={onLimparFiltros}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Redefinir todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* LINHA 2: Abas de Status à Esquerda + Dropdowns à Direita */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
        
        {/* Abas de Visualização (Pills) com scroll suave no mobile */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 lg:pb-0 text-xs shrink-0 scrollbar-none snap-x">
          <button
            type="button"
            onClick={() => onUserTabChange('todas')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap snap-start ${
              userTab === 'todas'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todas as vagas
          </button>

          <button
            type="button"
            onClick={() => onUserTabChange('salvas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap snap-start ${
              userTab === 'salvas'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Salvas ({savedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onUserTabChange('candidatadas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap snap-start ${
              userTab === 'candidatadas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Candidatadas ({appliedCount})</span>
          </button>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => onUserTabChange('ocultadas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap snap-start ${
                userTab === 'ocultadas'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ocultadas ({hiddenCount})</span>
            </button>
          )}
        </div>

        {/* 4 Dropdowns de Refinamento (Plataforma, Modalidade, Área, Senioridade)
            - Sempre visíveis em desktop (lg:grid)
            - Ocultos por padrão no mobile para economizar altura, expansíveis sob demanda */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden lg:grid'} grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-2.5 flex-1 lg:max-w-2xl pt-1.5 lg:pt-0`}>
          {/* Plataforma */}
          <div className="relative">
            <select
              value={plataforma}
              onChange={(e) => onPlataformaChange(e.target.value)}
              aria-label="Filtrar por plataforma de vagas"
              className="w-full appearance-none pl-2.5 pr-7 py-2 lg:py-1.5 bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 focus:border-violet-500 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer transition-all"
            >
              <option value="Todas">Plataforma: Todas</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Indeed">Indeed</option>
              <option value="Gupy">Gupy</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Modalidade */}
          <div className="relative">
            <select
              value={modalidade}
              onChange={(e) => onModalidadeChange(e.target.value)}
              aria-label="Filtrar por modalidade de trabalho"
              className="w-full appearance-none pl-2.5 pr-7 py-2 lg:py-1.5 bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 focus:border-violet-500 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer transition-all"
            >
              <option value="Todas">Modalidade: Todas</option>
              <option value="Remoto">Remoto</option>
              <option value="Hibrido">Híbrido</option>
              <option value="Presencial">Presencial</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Área */}
          <div className="relative">
            <select
              value={area}
              onChange={(e) => onAreaChange(e.target.value)}
              aria-label="Filtrar por área de atuação"
              className="w-full appearance-none pl-2.5 pr-7 py-2 lg:py-1.5 bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 focus:border-violet-500 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer transition-all"
            >
              <option value="Todas">Área: Todas</option>
              <option value="Dados">Dados & IA</option>
              <option value="Software">Software</option>
              <option value="Produto">Produto</option>
              <option value="DevOps">DevOps</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Senioridade */}
          <div className="relative">
            <select
              value={senioridade}
              onChange={(e) => onSenioridadeChange(e.target.value)}
              aria-label="Filtrar por nível de senioridade"
              className="w-full appearance-none pl-2.5 pr-7 py-2 lg:py-1.5 bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 focus:border-violet-500 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer transition-all"
            >
              <option value="Todas">Senioridade: Todas</option>
              <option value="Estágio">Estágio</option>
              <option value="Júnior">Júnior</option>
              <option value="Pleno">Pleno</option>
              <option value="Sênior">Sênior</option>
              <option value="Lead">Lead</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

    </section>
  );
}
