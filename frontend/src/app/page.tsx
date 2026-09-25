'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Sun, 
  Moon, 
  RefreshCw, 
  Search, 
  Database,
  Layers,
  Undo2
} from "lucide-react";
import { Vaga, Estatisticas, QuickFilterType, UserViewTab } from "../types/job";
import { QuickMetrics } from "../components/QuickMetrics";
import { FilterBar } from "../components/FilterBar";
import { JobCard } from "../components/JobCard";
import { Footer } from "../components/Footer";
import { useUserInteractions } from "../hooks/useUserInteractions";
import { parseDataPostagemTimestamp } from "../utils/dateUtils";

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
      const lista: Vaga[] = data.vagas || [];

      // Ordenacao cronologica rigorosa (mais recente primeiro)
      lista.sort((a, b) => {
        return parseDataPostagemTimestamp(b.data_postagem, b.data_coleta) - 
               parseDataPostagemTimestamp(a.data_postagem, a.data_coleta);
      });

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

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVagas();
    }, 250);
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

  // Filtragem multiárea, senioridade e abas de usuario
  const vagasFiltradas = useMemo(() => {
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

      // 3. Filtro de Senioridade
      if (senioridade !== "Todas") {
        const titleLower = vaga.titulo.toLowerCase();
        if (senioridade === "Estágio") {
          const keys = ['estágio', 'estagio', 'intern', 'trainee'];
          if (!keys.some(k => titleLower.includes(k))) return false;
        } else if (senioridade === "Júnior") {
          const keys = ['júnior', 'junior', 'jr', 'entry'];
          if (!keys.some(k => titleLower.includes(k))) return false;
        } else if (senioridade === "Pleno") {
          const keys = ['pleno', 'mid', 'pl\b'];
          if (!keys.some(k => new RegExp(k, 'i').test(titleLower))) return false;
        } else if (senioridade === "Sênior") {
          const keys = ['sênior', 'senior', 'sr\b'];
          if (!keys.some(k => new RegExp(k, 'i').test(titleLower))) return false;
        } else if (senioridade === "Lead") {
          const keys = ['lead', 'tech lead', 'líder', 'lider', 'especialista', 'specialist', 'coordenador', 'gerente', 'head'];
          if (!keys.some(k => titleLower.includes(k))) return false;
        }
      }

      // 4. Limite de antiguidade: maximo 60 dias (elimina vagas velhas/poluidas)
      const postTimestamp = parseDataPostagemTimestamp(vaga.data_postagem, vaga.data_coleta);
      const ageDays = (Date.now() - postTimestamp) / (1000 * 60 * 60 * 24);
      if (ageDays > 60) return false;

      return true;
    });
  }, [vagas, userTab, area, senioridade, isSaved, isApplied, isHidden]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-violet-500/20">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Cabecalho Principal */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer transition-transform hover:scale-[1.03]">
              <img 
                src="/logo.png?v=lente_transparente" 
                alt="Logo Radar" 
                className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
              />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Pesquisa Vagas
                </h1>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Monitorando</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Radar de oportunidades em Dados e Tecnologia
              </p>
            </div>
          </div>

          {/* Alternador de Tema Elegante (Modo Claro / Escuro) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs shrink-0 self-end sm:self-auto"
            title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-violet-600 hover:-rotate-12 transition-transform" />
            )}
          </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {vagasFiltradas.map((vaga) => (
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
          )}
        </section>
      </main>

      {/* Rodapé Elegante */}
      <Footer />
    </div>
  );
}
