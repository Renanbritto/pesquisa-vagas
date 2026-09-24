'use client';

import { useEffect, useState, useCallback } from "react";
import { 
  Search, 
  MapPin, 
  Building2, 
  Calendar, 
  ExternalLink, 
  RefreshCw, 
  Briefcase, 
  Sun, 
  Moon,
  X,
  Database,
  Home as HomeIcon,
  Laptop,
  Sparkles
} from "lucide-react";

interface Vaga {
  id: string;
  titulo: string;
  empresa: string;
  localizacao: string;
  link: string;
  modalidade: string;
  easy_apply: boolean | number;
  plataforma: string;
  data_coleta?: string;
  data_postagem?: string;
  termo_busca?: string;
  is_nova?: boolean;
}

interface Estatisticas {
  total: number;
  remotas: number;
  hibridas: number;
  presenciais: number;
  easy_apply: number;
  novas: number;
}

// Converte datas relativas (ex: "Há 13 minutos") e ISO em timestamp para ordenação precisa
function parseDataPostagemTimestamp(dataPostagem?: string, dataColeta?: string): number {
  const baseTime = dataColeta ? new Date(dataColeta).getTime() : Date.now();
  if (!dataPostagem || dataPostagem.trim() === "" || dataPostagem.toLowerCase() === "recente") {
    return baseTime;
  }

  // Formato ISO ou YYYY-MM-DD
  if (dataPostagem.includes("T") || (dataPostagem.includes("-") && dataPostagem.length >= 10)) {
    const timestamp = new Date(dataPostagem).getTime();
    if (!isNaN(timestamp)) return timestamp;
  }

  const s = dataPostagem.toLowerCase();
  const minMatch = s.match(/(\d+)\s*(?:minuto|min)/);
  if (minMatch) return baseTime - parseInt(minMatch[1], 10) * 60 * 1000;

  const horaMatch = s.match(/(\d+)\s*(?:hora|hour|h\b)/);
  if (horaMatch) return baseTime - parseInt(horaMatch[1], 10) * 3600 * 1000;

  const diaMatch = s.match(/(\d+)\s*(?:dia|day)/);
  if (diaMatch) return baseTime - parseInt(diaMatch[1], 10) * 24 * 3600 * 1000;

  const semMatch = s.match(/(\d+)\s*(?:semana|week)/);
  if (semMatch) return baseTime - parseInt(semMatch[1], 10) * 7 * 24 * 3600 * 1000;

  const mesMatch = s.match(/(\d+)\s*(?:m[eê]s|month)/);
  if (mesMatch) return baseTime - parseInt(mesMatch[1], 10) * 30 * 24 * 3600 * 1000;

  return baseTime;
}

// Normaliza o rótulo da modalidade para português padronizado
function normalizarModalidade(mod?: string): string {
  if (!mod) return "Indefinido";
  const m = mod.toLowerCase();
  if (m.includes("remot")) return "Remoto";
  if (m.includes("hibrid") || m.includes("hybrid")) return "Híbrido";
  if (m.includes("presenc") || m.includes("site")) return "Presencial";
  return mod;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estatísticas Globais do Banco de Dados
  const [stats, setStats] = useState<Estatisticas>({
    total: 0,
    remotas: 0,
    hibridas: 0,
    presenciais: 0,
    easy_apply: 0,
    novas: 0
  });

  // Tema Claro / Escuro
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Filtros
  const [busca, setBusca] = useState("");
  const [plataforma, setPlataforma] = useState("Todas");
  const [modalidade, setModalidade] = useState("Todas");
  const [easyApply, setEasyApply] = useState(false);
  const [apenasNovas, setApenasNovas] = useState(false);

  // Carrega as estatísticas gerais do banco
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/estatisticas`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Falha ao buscar estatísticas:", err);
    }
  }, []);

  const fetchVagas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "250" });
      if (busca.trim()) params.append("tecnologia", busca.trim());
      if (plataforma && plataforma !== "Todas") params.append("plataforma", plataforma);
      if (modalidade && modalidade !== "Todas") params.append("modalidade", modalidade);
      if (easyApply) params.append("easy_apply", "true");
      if (apenasNovas) params.append("apenas_novas", "true");

      const response = await fetch(`${API_BASE_URL}/vagas?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Erro na API (${response.status})`);
      }
      const data = await response.json();
      
      const listaVagas: Vaga[] = data.vagas || [];

      // Ordenar rigorosamente da postagem mais recente para a mais antiga
      listaVagas.sort((a, b) => {
        return parseDataPostagemTimestamp(b.data_postagem, b.data_coleta) - 
               parseDataPostagemTimestamp(a.data_postagem, a.data_coleta);
      });

      setVagas(listaVagas);
    } catch (err: any) {
      console.error("Falha ao buscar vagas:", err);
      setError("Não foi possível carregar as vagas. Certifique-se de que a API FastAPI está em execução.");
    } finally {
      setLoading(false);
    }
  }, [busca, plataforma, modalidade, easyApply, apenasNovas]);

  // Carrega estatísticas ao iniciar
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounce na busca textual e filtros
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVagas();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchVagas]);

  const limparFiltros = () => {
    setBusca("");
    setPlataforma("Todas");
    setModalidade("Todas");
    setEasyApply(false);
    setApenasNovas(false);
  };

  const temFiltroAtivo = busca !== "" || plataforma !== "Todas" || modalidade !== "Todas" || easyApply || apenasNovas;

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return "Recente";
    
    const s = dataStr.toLowerCase();
    if (s.includes("minuto") || s.includes("hora") || s.includes("dia") || s.includes("semana") || s.includes("h ")) {
      return dataStr;
    }

    if (dataStr.includes("T") || dataStr.includes("-")) {
      const d = new Date(dataStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }
    }
    return dataStr;
  };

  const getPlatformBadgeStyle = (plat: string) => {
    const p = (plat || "").toLowerCase();
    if (p.includes("linkedin")) {
      return "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-300 dark:border-sky-500/20";
    }
    if (p.includes("indeed")) {
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/20";
    }
    if (p.includes("gupy")) {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20";
    }
    return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-500/20";
  };

  const getModalityBadgeStyle = (mod: string) => {
    const m = (mod || "").toLowerCase();
    if (m.includes("remot")) {
      return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-500/20";
    }
    if (m.includes("hibrid") || m.includes("hybrid")) {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/20";
    }
    return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/20";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-violet-500/30">
      {/* Luz ambiente de fundo */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-10%,rgba(124,58,237,0.08),rgba(0,0,0,0)_60%)] dark:bg-[radial-gradient(circle_at_50%_-10%,rgba(124,58,237,0.16),rgba(0,0,0,0)_60%)]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.05),rgba(0,0,0,0)_40%)] dark:bg-[radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.08),rgba(0,0,0,0)_40%)]" />

      {/* Conteúdo Widescreen */}
      <main className="relative max-w-[1850px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4">
        
        {/* Top Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>Radar de Vagas v2.0</span>
              </div>

              {/* Botão de Alternância de Tema */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-violet-600" />
                    <span>Modo Escuro</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                Vaga Dados
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Monitoramento inteligente ordenado pelas postagens mais recentes (LinkedIn, Indeed e Gupy)
              </span>
            </div>
          </div>

          {/* Métricas Globais do Banco */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-xl px-3.5 py-2 shadow-sm dark:shadow-none backdrop-blur-md min-w-[95px]">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">Total Geral</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 leading-none">{stats.total || vagas.length}</p>
            </div>
            
            {/* Novas Vagas da Última Rodada */}
            <div className="bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 rounded-xl px-3 py-2 shadow-sm dark:shadow-none backdrop-blur-md min-w-[95px]">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold leading-none flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Novas</span>
              </p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 leading-none">{stats.novas}</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-xl px-3.5 py-2 shadow-sm dark:shadow-none backdrop-blur-md min-w-[95px]">
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium leading-none flex items-center gap-1">
                <HomeIcon className="w-3 h-3 text-teal-500" />
                <span>Remotas</span>
              </p>
              <p className="text-xl font-bold text-teal-600 dark:text-teal-300 mt-1 leading-none">{stats.remotas}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-xl px-3.5 py-2 shadow-sm dark:shadow-none backdrop-blur-md min-w-[95px]">
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-none flex items-center gap-1">
                <Laptop className="w-3 h-3 text-amber-500" />
                <span>Híbridas</span>
              </p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-300 mt-1 leading-none">{stats.hibridas}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 rounded-xl px-3.5 py-2 shadow-sm dark:shadow-none backdrop-blur-md min-w-[95px]">
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium leading-none flex items-center gap-1">
                <Building2 className="w-3 h-3 text-purple-500" />
                <span>Presenciais</span>
              </p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-300 mt-1 leading-none">{stats.presenciais}</p>
            </div>
          </div>
        </header>

        {/* Barra de Filtros Compacta */}
        <section className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl rounded-xl p-3.5 sm:p-4 shadow-sm dark:shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por cargo ou tecnologia (ex: Power BI, Python, SQL, Analista...)"
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 focus:ring-1 focus:ring-violet-600 dark:focus:ring-violet-500 rounded-lg text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Plataforma */}
            <div className="w-full md:w-44">
              <select
                value={plataforma}
                onChange={(e) => setPlataforma(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 rounded-lg text-sm text-slate-900 dark:text-slate-200 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="Todas">Plataforma: Todas</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Gupy">Gupy</option>
              </select>
            </div>

            {/* Modalidade Sem Parênteses */}
            <div className="w-full md:w-48">
              <select
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 focus:border-violet-600 dark:focus:border-violet-500 rounded-lg text-sm text-slate-900 dark:text-slate-200 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="Todas">Modalidade: Todas</option>
                <option value="Remoto">Remoto</option>
                <option value="Hibrido">Híbrido</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>

            {/* Botão Novas */}
            <button
              onClick={() => setApenasNovas(!apenasNovas)}
              title="Filtrar apenas as vagas que entraram no site na última coleta"
              className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                apenasNovas
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Novas</span>
            </button>

            {/* Candidatura Simplificada */}
            <button
              onClick={() => setEasyApply(!easyApply)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                easyApply
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Easy Apply</span>
            </button>

            {/* Limpar Filtros se Ativos */}
            {temFiltroAtivo && (
              <button
                onClick={limparFiltros}
                className="px-2.5 py-2 text-xs text-violet-600 dark:text-violet-400 hover:underline transition-colors cursor-pointer font-semibold whitespace-nowrap"
              >
                Limpar
              </button>
            )}
          </div>
        </section>

        {/* Mensagem de Erro se houver */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchVagas}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista de Vagas */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                Oportunidades
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-semibold">
                {vagas.length} {temFiltroAtivo ? `filtradas (de ${stats.total || 102} no total)` : `encontradas`}
              </span>
            </div>

            <button
              onClick={() => { fetchVagas(); fetchStats(); }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 animate-pulse shadow-sm"
                >
                  <div className="flex gap-2">
                    <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                  <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-3.5 w-3/5 bg-slate-200/80 dark:bg-slate-800/70 rounded-lg" />
                  <div className="h-3.5 w-1/2 bg-slate-200/60 dark:bg-slate-800/50 rounded-lg" />
                  <div className="pt-2">
                    <div className="h-8 w-full bg-slate-200/70 dark:bg-slate-800/60 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : vagas.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-white/60 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
              <div className="w-11 h-11 mx-auto rounded-full bg-slate-100 dark:bg-slate-800/70 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">Nenhuma vaga encontrada</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tente ajustar os filtros ou a palavra-chave de busca para ver mais oportunidades.
              </p>
              {temFiltroAtivo && (
                <button
                  onClick={limparFiltros}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/10 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 text-xs font-semibold hover:bg-violet-600/20 dark:hover:bg-violet-600/30 transition-all cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            /* Grid de Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
              {vagas.map((vaga) => {
                const isEasy = Boolean(vaga.easy_apply);
                const modalidadeExibicao = normalizarModalidade(vaga.modalidade);

                return (
                  <article
                    key={vaga.id}
                    className={`group relative bg-white/90 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900/80 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5 backdrop-blur-md ${
                      vaga.is_nova 
                        ? "border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-emerald-500/5" 
                        : "border border-slate-200/90 dark:border-slate-800/80 hover:border-violet-400 dark:hover:border-violet-500/40"
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Badges Tipográficos Limpos */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {vaga.is_nova && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30 dark:border-emerald-500/30 shadow-sm">
                            Novo
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPlatformBadgeStyle(
                            vaga.plataforma
                          )}`}
                        >
                          {vaga.plataforma || "Vaga"}
                        </span>

                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${getModalityBadgeStyle(
                            vaga.modalidade
                          )}`}
                        >
                          {modalidadeExibicao}
                        </span>

                        {isEasy && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/20">
                            Easy Apply
                          </span>
                        )}
                      </div>

                      {/* Titulo */}
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                        {vaga.titulo}
                      </h3>

                      {/* Empresa e Local */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{vaga.empresa || "Confidencial"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{vaga.localizacao || "Brasil"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rodapé do Card */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {formatarData(vaga.data_postagem || vaga.data_coleta)}
                        </span>
                      </div>

                      <a
                        href={vaga.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white text-xs font-semibold transition-all duration-200 shadow-sm shadow-violet-600/20 hover:scale-[1.02]"
                      >
                        <span>Ver Vaga</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
