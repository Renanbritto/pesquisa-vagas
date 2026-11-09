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
  pais: string;
  onPaisChange: (val: string) => void;
  easyApply: boolean;
  onEasyApplyToggle: () => void;
  apenasNovas: boolean;
  onApenasNovasToggle: () => void;
  userTab: UserViewTab;
  onUserTabChange: (tab: UserViewTab) => void;
  savedCount: number;
  appliedCount: number;
  hiddenCount: number;
  radarCount?: number;
  radarNovasCount?: number;
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
  pais = "Todos",
  onPaisChange,
  easyApply,
  onEasyApplyToggle,
  apenasNovas,
  onApenasNovasToggle,
  userTab,
  onUserTabChange,
  savedCount,
  appliedCount,
  hiddenCount,
  radarCount,
  radarNovasCount,
  onLimparFiltros,
  temFiltroAtivo,
}: FilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeDropdownsCount = 
    (plataforma !== "Todas" ? 1 : 0) +
    (modalidade !== "Todas" ? 1 : 0) +
    (pais !== "Todos" ? 1 : 0) +
    (area !== "Todas" ? 1 : 0) +
    (senioridade !== "Todas" ? 1 : 0);

  return (
    <section className="space-y-3 sm:space-y-3.5 transition-all">
      
      {/* LINHA 1: Barra de Busca + Toggles Rápidos */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Campo de Busca Espaçoso e Aberto */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#06b6d4] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="Buscar por cargo, tecnologia ou empresa..."
            aria-label="Buscar vagas por cargo, tecnologia ou empresa"
            className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 focus:border-[#06b6d4]/50 focus:ring-2 focus:ring-[#06b6d4]/20 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-xs dark:shadow-xl outline-none transition-all font-sans"
          />
          {busca && (
            <button
              onClick={() => onBuscaChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
              aria-label="Limpar campo de busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggles Rápidos (Novas & Easy Apply) + Botão de Filtros Mobile + Limpar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto sm:overflow-visible pb-0.5 sm:pb-0 scrollbar-none">
          {/* Seletor Visual de Localidade por País: Brasil e Portugal */}
          <div
            role="group"
            aria-label="Filtro de localidade por país"
            className="flex items-center p-0.5 sm:p-1 bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl shadow-xs dark:shadow-md shrink-0"
          >
            <button
              type="button"
              onClick={() => onPaisChange("Todos")}
              aria-pressed={pais === "Todos"}
              title="Exibir vagas de todos os países"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer whitespace-nowrap select-none active:scale-95 ${
                pais === "Todos"
                  ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onPaisChange("Brasil")}
              aria-pressed={pais === "Brasil"}
              title="Filtrar vagas do Brasil"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer whitespace-nowrap select-none active:scale-95 ${
                pais === "Brasil"
                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/60 text-[#0891b2] dark:text-[#06b6d4] shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇧🇷</span>
              <span>Brasil</span>
            </button>
            <button
              type="button"
              onClick={() => onPaisChange("Portugal")}
              aria-pressed={pais === "Portugal"}
              title="Filtrar vagas de Portugal"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer whitespace-nowrap select-none active:scale-95 ${
                pais === "Portugal"
                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/60 text-[#0891b2] dark:text-[#06b6d4] shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇵🇹</span>
              <span>Portugal</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onApenasNovasToggle}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 border rounded-2xl text-xs font-heading font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              apenasNovas
                ? 'bg-[#10b981]/15 border-[#10b981]/60 text-[#10b981] shadow-lg shadow-[#10b981]/15'
                : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white shadow-xs dark:shadow-md'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
            <span>Novas Vagas</span>
          </button>

          <button
            type="button"
            onClick={onEasyApplyToggle}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 border rounded-2xl text-xs font-heading font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              easyApply
                ? 'bg-[#f59e0b]/15 border-[#f59e0b]/60 text-[#f59e0b] shadow-lg shadow-[#f59e0b]/15'
                : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white shadow-xs dark:shadow-md'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="hidden sm:inline">Aplicação Simplificada</span>
            <span className="sm:hidden">Simplificada</span>
          </button>

          {/* Botão de Expandir Filtros em Mobile (< lg) */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center justify-center gap-1.5 px-3 py-2 border rounded-2xl text-xs font-heading font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              showMobileFilters || activeDropdownsCount > 0
                ? 'bg-[#06b6d4]/15 border-[#06b6d4]/60 text-[#06b6d4] shadow-md font-bold'
                : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 shadow-xs dark:shadow-md'
            }`}
            aria-label="Abrir filtros de plataforma, modalidade, área e senioridade"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span>Filtros</span>
            {activeDropdownsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#06b6d4] text-slate-950 text-[10px] font-mono font-extrabold">
                {activeDropdownsCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>

          {temFiltroAtivo && (
            <button
              type="button"
              onClick={onLimparFiltros}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl border border-[#f43f5e]/30 bg-[#f43f5e]/15 text-[#f43f5e] hover:bg-[#f43f5e]/25 text-xs font-heading font-semibold transition-colors cursor-pointer shrink-0 shadow-md active:scale-95"
              title="Redefinir todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* LINHA 2: Abas de Status à Esquerda + Dropdowns à Direita */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-0.5">
        
        {/* Abas de Visualização (Pills) com scroll suave e indicador sutil no mobile */}
        <div className="relative overflow-hidden -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs shrink-0 scrollbar-none snap-x [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent_100%)] sm:[mask-image:none]">
            <button
              type="button"
              onClick={() => onUserTabChange('todas')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border active:scale-95 ${
                userTab === 'todas'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white/15 dark:text-white dark:border-white/25 shadow-xs dark:shadow-md font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs dark:shadow-sm'
              }`}
            >
              Todas as vagas
            </button>

            <button
              type="button"
              onClick={() => onUserTabChange('radar')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border active:scale-95 ${
                userTab === 'radar'
                  ? 'bg-[#06b6d4]/15 dark:bg-[#06b6d4]/20 text-[#0891b2] dark:text-[#06b6d4] border-[#06b6d4]/50 shadow-xs dark:shadow-md shadow-[#06b6d4]/10 font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs dark:shadow-sm'
              }`}
            >
              <span>Meu Radar</span>
              {radarCount !== undefined && radarCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                  userTab === 'radar'
                    ? 'bg-[#06b6d4] text-slate-950'
                    : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-[#06b6d4]'
                }`}>
                  {radarCount}
                </span>
              )}
              {radarNovasCount !== undefined && radarNovasCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse" title={`${radarNovasCount} novas no seu Radar`} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onUserTabChange('salvas')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border active:scale-95 ${
                userTab === 'salvas'
                  ? 'bg-[#f59e0b]/15 dark:bg-[#f59e0b]/20 text-[#d97706] dark:text-[#f59e0b] border-[#f59e0b]/50 shadow-xs dark:shadow-md font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs dark:shadow-sm'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Salvas (<span className="font-mono font-extrabold">{savedCount}</span>)</span>
            </button>

            <button
              type="button"
              onClick={() => onUserTabChange('candidatadas')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border active:scale-95 ${
                userTab === 'candidatadas'
                  ? 'bg-[#10b981]/15 dark:bg-[#10b981]/20 text-[#059669] dark:text-[#10b981] border-[#10b981]/50 shadow-xs dark:shadow-md font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs dark:shadow-sm'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Candidatadas (<span className="font-mono font-extrabold">{appliedCount}</span>)</span>
            </button>

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => onUserTabChange('ocultadas')}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border active:scale-95 ${
                  userTab === 'ocultadas'
                    ? 'bg-[#f43f5e]/15 dark:bg-[#f43f5e]/20 text-[#e11d48] dark:text-[#f43f5e] border-[#f43f5e]/50 shadow-xs dark:shadow-md font-bold'
                    : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs dark:shadow-sm'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ocultadas (<span className="font-mono font-extrabold">{hiddenCount}</span>)</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Dropdowns de Refinamento (Plataforma, Modalidade, País, Área, Senioridade) */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden lg:grid'} grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-2.5 flex-1 lg:max-w-3xl pt-1.5 lg:pt-0`}>
          {/* Plataforma */}
          <div className="relative">
            <select
              value={plataforma}
              onChange={(e) => onPlataformaChange(e.target.value)}
              aria-label="Filtrar por plataforma de vagas"
              className={`w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 rounded-2xl text-xs font-heading font-medium shadow-xs dark:shadow-md outline-none cursor-pointer transition-all ${
                plataforma !== "Todas"
                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/60 text-[#0891b2] dark:text-[#06b6d4] font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:border-[#06b6d4]/50'
              }`}
            >
              <option value="Todas" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Plataforma: Todas</option>
              <option value="LinkedIn" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">LinkedIn</option>
              <option value="Indeed" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Indeed</option>
              <option value="Gupy" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Gupy</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Modalidade */}
          <div className="relative">
            <select
              value={modalidade}
              onChange={(e) => onModalidadeChange(e.target.value)}
              aria-label="Filtrar por modalidade de trabalho"
              className={`w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 rounded-2xl text-xs font-heading font-medium shadow-xs dark:shadow-md outline-none cursor-pointer transition-all ${
                modalidade !== "Todas"
                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/60 text-[#0891b2] dark:text-[#06b6d4] font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:border-[#06b6d4]/50'
              }`}
            >
              <option value="Todas" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Modalidade: Todas</option>
              <option value="Remoto" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Remoto</option>
              <option value="Hibrido" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Híbrido</option>
              <option value="Presencial" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Presencial</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* País */}
          <div className="relative">
            <select
              value={pais}
              onChange={(e) => onPaisChange(e.target.value)}
              aria-label="Filtrar por país de atuação"
              className={`w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 rounded-2xl text-xs font-heading font-medium shadow-xs dark:shadow-md outline-none cursor-pointer transition-all ${
                pais !== "Todos"
                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/60 text-[#0891b2] dark:text-[#06b6d4] font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:border-[#06b6d4]/50'
              }`}
            >
              <option value="Todos" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">País: Todos</option>
              <option value="Brasil" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">🇧🇷 Brasil</option>
              <option value="Portugal" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">🇵🇹 Portugal</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Área */}
          <div className="relative">
            <select
              value={area}
              onChange={(e) => onAreaChange(e.target.value)}
              aria-label="Filtrar por área de atuação"
              className={`w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 rounded-2xl text-xs font-heading font-medium shadow-xs dark:shadow-md outline-none cursor-pointer transition-all ${
                area !== "Todas"
                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/60 text-[#0891b2] dark:text-[#06b6d4] font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:border-[#06b6d4]/50'
              }`}
            >
              <option value="Todas" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Área: Todas</option>
              <option value="Dados" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Dados & IA</option>
              <option value="Software" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Software</option>
              <option value="Produto" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Produto</option>
              <option value="DevOps" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">DevOps</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Senioridade */}
          <div className="relative">
            <select
              value={senioridade}
              onChange={(e) => onSenioridadeChange(e.target.value)}
              aria-label="Filtrar por nível de senioridade"
              className={`w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 rounded-2xl text-xs font-heading font-medium shadow-xs dark:shadow-md outline-none cursor-pointer transition-all ${
                senioridade !== "Todas"
                  ? 'bg-[#06b6d4]/15 border border-[#06b6d4]/60 text-[#0891b2] dark:text-[#06b6d4] font-bold'
                  : 'bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:border-[#06b6d4]/50'
              }`}
            >
              <option value="Todas" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Senioridade: Todas</option>
              <option value="Estágio" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Estágio</option>
              <option value="Júnior" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Júnior</option>
              <option value="Pleno" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Pleno</option>
              <option value="Sênior" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Sênior</option>
              <option value="Lead" className="bg-white dark:bg-[#0b0f1a] text-slate-800 dark:text-slate-200">Lead</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

    </section>
  );
}
