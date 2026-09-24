import React from 'react';
import { Search, X, Filter, Bookmark, CheckCircle2, EyeOff, Sparkles } from 'lucide-react';
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
  return (
    <section className="sticky top-0 z-30 bg-white/85 dark:bg-[#070b14]/85 backdrop-blur-xl border-y border-slate-200/80 dark:border-slate-800/80 shadow-xs py-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 space-y-2.5">
      {/* Linha 1: Controles de Busca e Filtros */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2.5">
        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="Buscar por cargo, habilidade ou tecnologia (ex: Power BI, Python, SQL, Analista...)"
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 focus:ring-1 focus:ring-violet-600 dark:focus:ring-violet-500 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          {busca && (
            <button
              onClick={() => onBuscaChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              aria-label="Limpar campo de busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns de Filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Plataforma */}
          <select
            value={plataforma}
            onChange={(e) => onPlataformaChange(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none transition-all cursor-pointer font-medium"
          >
            <option value="Todas">Plataforma: Todas</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Indeed">Indeed</option>
            <option value="Gupy">Gupy</option>
          </select>

          {/* Modalidade */}
          <select
            value={modalidade}
            onChange={(e) => onModalidadeChange(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none transition-all cursor-pointer font-medium"
          >
            <option value="Todas">Modalidade: Todas</option>
            <option value="Remoto">Remoto</option>
            <option value="Hibrido">Híbrido</option>
            <option value="Presencial">Presencial</option>
          </select>

          {/* Área Profissional (Expansao Multiárea) */}
          <select
            value={area}
            onChange={(e) => onAreaChange(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none transition-all cursor-pointer font-medium"
          >
            <option value="Todas">Área: Todas</option>
            <option value="Dados">Dados & IA</option>
            <option value="Software">Engenharia de Software</option>
            <option value="Produto">Produto & Design</option>
            <option value="DevOps">Infra & DevOps</option>
          </select>

          {/* Nível de Senioridade */}
          <select
            value={senioridade}
            onChange={(e) => onSenioridadeChange(e.target.value)}
            className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none transition-all cursor-pointer font-medium"
          >
            <option value="Todas">Senioridade: Todas</option>
            <option value="Estágio">Estágio / Trainee</option>
            <option value="Júnior">Júnior</option>
            <option value="Pleno">Pleno</option>
            <option value="Sênior">Sênior</option>
            <option value="Lead">Lead / Especialista</option>
          </select>
        </div>

        {/* Toggles Compactos */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onApenasNovasToggle}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
              apenasNovas
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Novas</span>
          </button>

          <button
            type="button"
            onClick={onEasyApplyToggle}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
              easyApply
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Easy Apply</span>
          </button>
        </div>
      </div>

      {/* Linha 2: Abas de Visualização (Todas, Salvas, Candidatadas, Ocultadas) + Limpar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onUserTabChange('todas')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              userTab === 'salvas'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>Salvas ({savedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onUserTabChange('candidatadas')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              userTab === 'candidatadas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Candidatadas ({appliedCount})</span>
          </button>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => onUserTabChange('ocultadas')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                userTab === 'ocultadas'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>Ocultadas ({hiddenCount})</span>
            </button>
          )}
        </div>

        {temFiltroAtivo && (
          <button
            type="button"
            onClick={onLimparFiltros}
            className="text-violet-600 dark:text-violet-400 hover:underline shrink-0 font-medium cursor-pointer"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </section>
  );
}
