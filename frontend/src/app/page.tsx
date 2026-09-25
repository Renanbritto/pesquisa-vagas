'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  Search, 
  Database,
  Layers,
  BarChart3,
  Undo2
} from "lucide-react";
import { Vaga, Estatisticas, QuickFilterType, UserViewTab } from "../types/job";
import { QuickMetrics } from "../components/QuickMetrics";
import { FilterBar } from "../components/FilterBar";
import { JobCard } from "../components/JobCard";
import { Footer } from "../components/Footer";
import { useUserInteractions } from "../hooks/useUserInteractions";
import { parseDataPostagemTimestamp } from "../utils/dateUtils";

// Regex estaticos pré-compilados para máxima performance na filtragem
const REGEX_PLENO = /\bpl\b|pleno|mid/i;
const REGEX_SENIOR = /\bsr\b|sênior|senior/i;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://pesquisa-vagas-api.onrender.com";

export default function Home() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estatisticas Globais
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

  // Interacoes do usuario (Favoritar, Candidatado, Ocultar)
  const {
    savedIds,
    appliedIds,
    hiddenIds,
    toggleSave,
    toggleApplied,
    toggleHide,
    unhideAll,
    isSaved,
    isApplied,
    isHidden
  } = useUserInteractions();

  // Filtros
  const [busca, setBusca] = useState("");
  const [plataforma, setPlataforma] = useState("Todas");
  const [modalidade, setModalidade] = useState("Todas");
  const [area, setArea] = useState("Todas");
  const [senioridade, setSenioridade] = useState("Todas");
  const [easyApply, setEasyApply] = useState(false);
  const [apenasNovas, setApenasNovas] = useState(false);

  // Quick Filter State
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>(null);

  // Aba de visualizacao do usuario
  const [userTab, setUserTab] = useState<UserViewTab>('todas');

  // Paginacao Progressiva para Alta Performance Mobile (Reduz DOM de >1800 para ~300 nós)
  const [visibleCount, setVisibleCount] = useState(24);

  // Redefine paginação ao alterar qualquer filtro
  useEffect(() => {
    setVisibleCount(24);
  }, [busca, plataforma, modalidade, area, senioridade, easyApply, apenasNovas, quickFilter, userTab]);

  // Carrega estatisticas globais do backend
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

  // Busca vagas do backend com parametros
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
      const rawList: Vaga[] = data.vagas || [];

      // Pré-computa o timestamp uma única vez por vaga para eliminar milhares de chamadas regex na main thread
      const lista: Vaga[] = rawList.map((v) => ({
        ...v,
        _timestamp: parseDataPostagemTimestamp(v.data_postagem, v.data_coleta)
      }));

      // Ordenação numérica cronológica direta O(N log N) ultrarrápida (0 chamadas a regex)
      lista.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0));

      setVagas(lista);
    } catch (err) {
      console.error("Falha ao buscar vagas:", err);
      setError("Não foi possível conectar à API de vagas. Verifique se o servidor backend está em execução.");
    } finally {
      setLoading(false);
    }
  }, [busca, plataforma, modalidade, easyApply, apenasNovas]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchVagas();
      return;
    }
    const handler = setTimeout(() => {
      fetchVagas();
    }, 200);
    return () => clearTimeout(handler);
  }, [fetchVagas]);

  // Handler para selecao nos contadores de metricas rapidas (Quick Filters)
  const handleSelectQuickFilter = (filter: QuickFilterType) => {
    setQuickFilter(filter);
    if (!filter || filter === 'total') {
      setModalidade("Todas");
      setApenasNovas(false);
    } else if (filter === 'novas') {
      setApenasNovas(true);
      setModalidade("Todas");
    } else if (filter === 'remoto') {
      setModalidade("Remoto");
      setApenasNovas(false);
    } else if (filter === 'hibrido') {
      setModalidade("Hibrido");
      setApenasNovas(false);
    } else if (filter === 'presencial') {
      setModalidade("Presencial");
      setApenasNovas(false);
    }
  };

  // Sincroniza o quickFilter se o usuario alterar diretamente pelos selects
  const handleModalidadeChange = (val: string) => {
    setModalidade(val);
    if (val === "Remoto") setQuickFilter('remoto');
    else if (val === "Hibrido") setQuickFilter('hibrido');
    else if (val === "Presencial") setQuickFilter('presencial');
    else if (apenasNovas) setQuickFilter('novas');
    else setQuickFilter(null);
  };

  const handleApenasNovasToggle = () => {
    const nextVal = !apenasNovas;
    setApenasNovas(nextVal);
    if (nextVal) {
      setQuickFilter('novas');
    } else {
      setQuickFilter(null);
    }
  };

  const limparFiltros = () => {
    setBusca("");
    setPlataforma("Todas");
    setModalidade("Todas");
    setArea("Todas");
    setSenioridade("Todas");
    setEasyApply(false);
    setApenasNovas(false);
    setQuickFilter(null);
    setUserTab('todas');
  };

  const temFiltroAtivo = Boolean(
    busca !== "" || 
    plataforma !== "Todas" || 
    modalidade !== "Todas" || 
    area !== "Todas" || 
    senioridade !== "Todas" || 
    easyApply || 
    apenasNovas || 
    quickFilter !== null ||
    userTab !== 'todas'
  );

  // Filtragem multiárea, senioridade e abas de usuario com alta performance
  const vagasFiltradas = useMemo(() => {
    const now = Date.now();
    const MS_60_DAYS = 60 * 24 * 3600 * 1000;

    return vagas.filter((vaga) => {
      // 1. Aba de usuario
      if (userTab === 'salvas' && !isSaved(vaga.id)) return false;
      if (userTab === 'candidatadas' && !isApplied(vaga.id)) return false;
      if (userTab === 'ocultadas') {
        if (!isHidden(vaga.id)) return false;
      } else {
        // Nas demais abas, esconde as vagas marcadas como ocultadas
        if (isHidden(vaga.id)) return false;
      }

      // 2. Filtro de Area Profissional (Expansao Multiarea)
      if (area !== "Todas") {
        const textToMatch = `${vaga.titulo} ${vaga.termo_busca || ''}`.toLowerCase();
        if (area === "Dados") {
          const keywords = ['dado', 'data', 'analytics', 'bi', 'inteligência', 'ia', 'machine learning', 'sql', 'python', 'etl', 'power bi', 'cientista'];
          if (!keywords.some(k => textToMatch.includes(k))) return false;
        } else if (area === "Software") {
          const keywords = ['software', 'desenvolvedor', 'developer', 'frontend', 'front-end', 'backend', 'back-end', 'full stack', 'fullstack', 'react', 'node', 'java', 'c#', '.net', 'programador'];
          if (!keywords.some(k => textToMatch.includes(k))) return false;
        } else if (area === "Produto") {
          const keywords = ['produto', 'product', 'design', 'designer', 'ui', 'ux', 'scrum', 'agile', 'po', 'pm'];
          if (!keywords.some(k => textToMatch.includes(k))) return false;
        } else if (area === "DevOps") {
          const keywords = ['devops', 'cloud', 'infra', 'aws', 'azure', 'gcp', 'sre', 'kubernetes', 'docker', 'segurança'];
          if (!keywords.some(k => textToMatch.includes(k))) return false;
        }
      }

      // 3. Filtro de Senioridade (Usa REGEX estáticos pré-compilados)
      if (senioridade !== "Todas") {
        const titleLower = vaga.titulo.toLowerCase();
        if (senioridade === "Estágio") {
          const keys = ['estágio', 'estagio', 'intern', 'trainee'];
          if (!keys.some(k => titleLower.includes(k))) return false;
        } else if (senioridade === "Júnior") {
          const keys = ['júnior', 'junior', 'jr', 'entry'];
          if (!keys.some(k => titleLower.includes(k))) return false;
        } else if (senioridade === "Pleno") {
          if (!REGEX_PLENO.test(titleLower)) return false;
        } else if (senioridade === "Sênior") {
          if (!REGEX_SENIOR.test(titleLower)) return false;
        } else if (senioridade === "Lead") {
          const keys = ['lead', 'tech lead', 'líder', 'lider', 'especialista', 'specialist', 'coordenador', 'gerente', 'head'];
          if (!keys.some(k => titleLower.includes(k))) return false;
        }
      }

      // 4. Limite de antiguidade: maximo 60 dias (puramente matematico O(1))
      const postTimestamp = vaga._timestamp ?? parseDataPostagemTimestamp(vaga.data_postagem, vaga.data_coleta);
      if (now - postTimestamp > MS_60_DAYS) return false;

      return true;
    });
  }, [vagas, userTab, area, senioridade, isSaved, isApplied, isHidden]);

  // Vagas visíveis limitadas para alta performance e baixíssimo TBT / DOM Size
  const displayedVagas = useMemo(() => {
    return vagasFiltradas.slice(0, visibleCount);
  }, [vagasFiltradas, visibleCount]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-violet-500/20">
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        
        {/* Cabecalho Principal: 1 linha perfeita no Mobile e Desktop */}
        <header className="flex items-center justify-between gap-3 pb-3 sm:pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="relative group cursor-pointer transition-transform hover:scale-[1.03] shrink-0">
              <Image 
                src="/logo.webp" 
                alt="Logo Radar" 
                width={48}
                height={48}
                priority
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-md"
              />
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent truncate">
                  Pesquisa Vagas
                </h1>
                <div className="hidden xs:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold tracking-wide shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Ao vivo</span>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Radar de oportunidades em Dados e Tecnologia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Nav Pill: Vagas vs Dashboard */}
            <nav className="flex items-center bg-slate-200/60 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
              <Link
                href="/"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-xs transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span className="hidden xs:inline">Explorar</span> Vagas
              </Link>
              <Link
                href="/dashboard"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-1.5"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            </nav>

            <a
              href="https://www.linkedin.com/in/renan-britto-7b3728212/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex group p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0a66c2] dark:text-[#60a5fa] transition-all shadow-xs cursor-pointer hover:scale-105 items-center justify-center"
              title="LinkedIn"
              aria-label="LinkedIn"
            >
              <svg
                className="w-4 h-4 fill-current transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
              >
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
            </a>
            
            <a
              href="https://github.com/Renanbritto"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex group p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all shadow-xs cursor-pointer hover:scale-105 items-center justify-center"
              title="GitHub"
              aria-label="GitHub"
            >
              <svg
                className="w-4 h-4 fill-current transition-transform group-hover:scale-110"
                viewBox="0 0 24 24"
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </a>

            {/* Alternador de Tema Elegante (Modo Claro / Escuro) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs shrink-0"
              title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-violet-600 hover:-rotate-12 transition-transform" />
              )}
            </button>
          </div>
        </header>

        {/* 5 Cards de Métricas (KPIs Principais) */}
        <section aria-label="Indicadores principais">
          <QuickMetrics
            stats={stats}
            totalVagasCarregadas={vagas.length}
            activeFilter={quickFilter}
            onSelectFilter={handleSelectQuickFilter}
          />
        </section>

        {/* Barra de Filtros Fixa (Sticky) */}
        <FilterBar
          busca={busca}
          onBuscaChange={setBusca}
          plataforma={plataforma}
          onPlataformaChange={setPlataforma}
          modalidade={modalidade}
          onModalidadeChange={handleModalidadeChange}
          area={area}
          onAreaChange={setArea}
          senioridade={senioridade}
          onSenioridadeChange={setSenioridade}
          easyApply={easyApply}
          onEasyApplyToggle={() => setEasyApply(!easyApply)}
          apenasNovas={apenasNovas}
          onApenasNovasToggle={handleApenasNovasToggle}
          userTab={userTab}
          onUserTabChange={setUserTab}
          savedCount={savedIds.size}
          appliedCount={appliedIds.size}
          hiddenCount={hiddenIds.size}
          onLimparFiltros={limparFiltros}
          temFiltroAtivo={temFiltroAtivo}
        />

        {/* Secao de Conteudo / Listagem */}
        <section className="space-y-4 pt-1">
          {/* Header da Listagem: Contador e Botao de Atualizar */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">
              Exibindo <strong className="text-slate-900 dark:text-slate-200">{vagasFiltradas.length}</strong> {vagasFiltradas.length === 1 ? 'oportunidade' : 'oportunidades'}
              {userTab === 'salvas' && ' favoritadas'}
              {userTab === 'candidatadas' && ' onde você se candidatou'}
              {userTab === 'ocultadas' && ' ocultadas por você'}
            </span>

            <div className="flex items-center gap-2">
              {userTab === 'ocultadas' && hiddenIds.size > 0 && (
                <button
                  type="button"
                  onClick={unhideAll}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Desocultar todas</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  fetchStats();
                  fetchVagas();
                }}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Feedback de Erro */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Skeletons de Carregamento Adaptaveis */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 space-y-3 animate-pulse shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                      <div className="space-y-1">
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-2.5 w-14 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                    <div className="h-3 w-16 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
                    <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : vagasFiltradas.length === 0 ? (
            /* Estado Vazio Amigavel */
            <div className="text-center py-16 px-4 bg-white/60 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800/70 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {userTab === 'salvas' ? 'Nenhuma vaga favoritada ainda' :
                 userTab === 'candidatadas' ? 'Nenhuma candidatura registrada' :
                 userTab === 'ocultadas' ? 'Nenhuma vaga oculta' :
                 'Nenhuma vaga encontrada com estes filtros'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {userTab === 'salvas' ? 'Clique no ícone de marcador nos cartões para guardar suas vagas favoritas.' :
                 userTab === 'candidatadas' ? 'Marque as vagas onde você se candidatou usando o botão de check.' :
                 userTab === 'ocultadas' ? 'Vagas que você ocultar aparecerão aqui para eventual restauração.' :
                 'Tente ajustar os filtros ou a palavra-chave de busca para ver mais oportunidades.'}
              </p>
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-violet-600/10 dark:bg-violet-600/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 text-xs font-semibold hover:bg-violet-600/20 dark:hover:bg-violet-600/30 transition-all cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            /* Grelha Responsiva Adaptavel:
               - Mobile (< 640px): 1 coluna
               - Tablet (640px - 1024px): 2 colunas
               - Laptops (1024px - 1440px): 3 colunas
               - Ultrawide / Desktop Grande (> 1440px): 4 colunas
            */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {displayedVagas.map((vaga) => (
                  <JobCard
                    key={vaga.id}
                    vaga={vaga}
                    isSaved={isSaved(vaga.id)}
                    isApplied={isApplied(vaga.id)}
                    isHidden={isHidden(vaga.id)}
                    onToggleSave={toggleSave}
                    onToggleApplied={toggleApplied}
                    onToggleHide={toggleHide}
                  />
                ))}
              </div>

              {/* Botão Progressivo "Carregar Mais Vagas" para não sobrecarregar o DOM e mobile */}
              {displayedVagas.length < vagasFiltradas.length && (
                <div className="flex flex-col items-center justify-center pt-5 pb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 24, vagasFiltradas.length))}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl border border-violet-500/30 bg-violet-600/10 hover:bg-violet-600 text-violet-700 dark:text-violet-300 hover:text-white dark:hover:text-white font-semibold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>Carregar mais vagas ({vagasFiltradas.length - displayedVagas.length} restantes)</span>
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Exibindo {displayedVagas.length} de {vagasFiltradas.length} vagas
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Rodapé Elegante */}
      <Footer />
    </div>
  );
}
