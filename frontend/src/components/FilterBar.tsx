import React, { useState } from 'react';
import { Search, X, Bookmark, CheckCircle2, EyeOff, RotateCcw, ChevronDown, Zap, SlidersHorizontal, Sparkles } from 'lucide-react';
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
            className="w-full pl-10 pr-9 py-2.5 sm:py-3 bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 focus:border-[#06b6d4]/50 focus:ring-2 focus:ring-[#06b6d4]/20 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 shadow-xl outline-none transition-all font-sans"
          />
          {busca && (
            <button
              onClick={() => onBuscaChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
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
            className={`flex-1 sm:flex-initial flex items-center justify-center px-3.5 py-2 sm:py-2.5 border rounded-2xl text-xs font-heading font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              apenasNovas
                ? 'bg-[#10b981]/15 border-[#10b981]/60 text-[#10b981] shadow-lg shadow-[#10b981]/15'
                : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-300 hover:border-white/20 hover:text-white shadow-md'
            }`}
          >
            <span>Novas Vagas</span>
          </button>

          <button
            type="button"
            onClick={onEasyApplyToggle}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 border rounded-2xl text-xs font-heading font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              easyApply
                ? 'bg-[#f59e0b]/15 border-[#f59e0b]/60 text-[#f59e0b] shadow-lg shadow-[#f59e0b]/15'
                : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-300 hover:border-white/20 hover:text-white shadow-md'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span className="hidden xs:inline">Aplicação Simplificada</span>
            <span className="xs:hidden">Simplificada</span>
          </button>

          {/* Botão de Expandir Filtros em Mobile (< lg) */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex items-center justify-center gap-1.5 px-3 py-2 border rounded-2xl text-xs font-heading font-semibold transition-all cursor-pointer select-none whitespace-nowrap active:scale-[0.98] ${
              showMobileFilters || activeDropdownsCount > 0
                ? 'bg-[#06b6d4]/15 border-[#06b6d4]/60 text-[#06b6d4] shadow-md'
                : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-300 hover:border-white/20 shadow-md'
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
              className="flex items-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl border border-[#f43f5e]/30 bg-[#f43f5e]/15 text-[#f43f5e] hover:bg-[#f43f5e]/25 text-xs font-heading font-semibold transition-colors cursor-pointer shrink-0 shadow-md"
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
        
        {/* Abas de Visualização (Pills) com scroll suave no mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0 text-xs shrink-0 scrollbar-none snap-x">
          <button
            type="button"
            onClick={() => onUserTabChange('todas')}
            className={`px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border ${
              userTab === 'todas'
                ? 'bg-white/15 text-white border-white/25 shadow-md font-bold'
                : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-400 hover:text-white shadow-sm'
            }`}
          >
            Todas as vagas
          </button>

          <button
            type="button"
            onClick={() => onUserTabChange('radar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border ${
              userTab === 'radar'
                ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/50 shadow-md shadow-[#06b6d4]/10 font-bold'
                : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-400 hover:text-white shadow-sm'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${userTab === 'radar' ? 'text-[#f59e0b]' : 'text-[#06b6d4]'}`} />
            <span>Meu Radar</span>
            {radarCount !== undefined && radarCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold ${
                userTab === 'radar'
                  ? 'bg-[#06b6d4] text-slate-950'
                  : 'bg-white/10 text-[#06b6d4]'
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
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border ${
              userTab === 'salvas'
                ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/50 shadow-md font-bold'
                : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-400 hover:text-white shadow-sm'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Salvas (<span className="font-mono font-extrabold">{savedCount}</span>)</span>
          </button>

          <button
            type="button"
            onClick={() => onUserTabChange('candidatadas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border ${
              userTab === 'candidatadas'
                ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/50 shadow-md font-bold'
                : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-400 hover:text-white shadow-sm'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Candidatadas (<span className="font-mono font-extrabold">{appliedCount}</span>)</span>
          </button>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => onUserTabChange('ocultadas')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl font-heading font-semibold transition-all cursor-pointer whitespace-nowrap snap-start border ${
                userTab === 'ocultadas'
                  ? 'bg-[#f43f5e]/20 text-[#f43f5e] border-[#f43f5e]/50 shadow-md font-bold'
                  : 'bg-[#0b0f1a]/95 backdrop-blur-2xl border-white/10 text-slate-400 hover:text-white shadow-sm'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ocultadas (<span className="font-mono font-extrabold">{hiddenCount}</span>)</span>
            </button>
          )}
        </div>

        {/* 4 Dropdowns de Refinamento (Plataforma, Modalidade, Área, Senioridade) */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden lg:grid'} grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-2.5 flex-1 lg:max-w-2xl pt-1.5 lg:pt-0`}>
          {/* Plataforma */}
          <div className="relative">
            <select
              value={plataforma}
              onChange={(e) => onPlataformaChange(e.target.value)}
              aria-label="Filtrar por plataforma de vagas"
              className="w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 focus:border-[#06b6d4]/50 rounded-2xl text-xs font-heading font-medium text-slate-200 shadow-md outline-none cursor-pointer transition-all"
            >
              <option value="Todas" className="bg-[#0b0f1a] text-slate-200">Plataforma: Todas</option>
              <option value="LinkedIn" className="bg-[#0b0f1a] text-slate-200">LinkedIn</option>
              <option value="Indeed" className="bg-[#0b0f1a] text-slate-200">Indeed</option>
              <option value="Gupy" className="bg-[#0b0f1a] text-slate-200">Gupy</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Modalidade */}
          <div className="relative">
            <select
              value={modalidade}
              onChange={(e) => onModalidadeChange(e.target.value)}
              aria-label="Filtrar por modalidade de trabalho"
              className="w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 focus:border-[#06b6d4]/50 rounded-2xl text-xs font-heading font-medium text-slate-200 shadow-md outline-none cursor-pointer transition-all"
            >
              <option value="Todas" className="bg-[#0b0f1a] text-slate-200">Modalidade: Todas</option>
              <option value="Remoto" className="bg-[#0b0f1a] text-slate-200">Remoto</option>
              <option value="Hibrido" className="bg-[#0b0f1a] text-slate-200">Híbrido</option>
              <option value="Presencial" className="bg-[#0b0f1a] text-slate-200">Presencial</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Área */}
          <div className="relative">
            <select
              value={area}
              onChange={(e) => onAreaChange(e.target.value)}
              aria-label="Filtrar por área de atuação"
              className="w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 focus:border-[#06b6d4]/50 rounded-2xl text-xs font-heading font-medium text-slate-200 shadow-md outline-none cursor-pointer transition-all"
            >
              <option value="Todas" className="bg-[#0b0f1a] text-slate-200">Área: Todas</option>
              <option value="Dados" className="bg-[#0b0f1a] text-slate-200">Dados & IA</option>
              <option value="Software" className="bg-[#0b0f1a] text-slate-200">Software</option>
              <option value="Produto" className="bg-[#0b0f1a] text-slate-200">Produto</option>
              <option value="DevOps" className="bg-[#0b0f1a] text-slate-200">DevOps</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Senioridade */}
          <div className="relative">
            <select
              value={senioridade}
              onChange={(e) => onSenioridadeChange(e.target.value)}
              aria-label="Filtrar por nível de senioridade"
              className="w-full appearance-none pl-3 pr-7 py-2 lg:py-1.5 bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 focus:border-[#06b6d4]/50 rounded-2xl text-xs font-heading font-medium text-slate-200 shadow-md outline-none cursor-pointer transition-all"
            >
              <option value="Todas" className="bg-[#0b0f1a] text-slate-200">Senioridade: Todas</option>
              <option value="Estágio" className="bg-[#0b0f1a] text-slate-200">Estágio</option>
              <option value="Júnior" className="bg-[#0b0f1a] text-slate-200">Júnior</option>
              <option value="Pleno" className="bg-[#0b0f1a] text-slate-200">Pleno</option>
              <option value="Sênior" className="bg-[#0b0f1a] text-slate-200">Sênior</option>
              <option value="Lead" className="bg-[#0b0f1a] text-slate-200">Lead</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

    </section>
  );
}
