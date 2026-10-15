'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  RefreshCw, 
  Search, 
  Database,
  Undo2,
  Sparkles,
  SlidersHorizontal,
  Radio,
  Send,
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Vaga, Estatisticas, QuickFilterType, UserViewTab } from "../types/job";
import { Header } from "../components/Header";
import { QuickMetrics } from "../components/QuickMetrics";
import { FilterBar } from "../components/FilterBar";
import { JobCard } from "../components/JobCard";
import { Footer } from "../components/Footer";
import { useUserInteractions } from "../hooks/useUserInteractions";
import { useAuth } from "../hooks/useAuth";
import { useMeuRadar } from "../hooks/useMeuRadar";
import { parseDataPostagemTimestamp } from "../utils/dateUtils";

// Regex estaticos pré-compilados para máxima performance na filtragem
const REGEX_PLENO = /\bpl\b|pleno|mid/i;
const REGEX_SENIOR = /\bsr\b|sênior|senior/i;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://pesquisa-vagas-api.onrender.com";

export default function Home() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback para conexões que demoram mais de 3.5 segundos (ex: Cold Start no Render)
  const [isSlowLoading, setIsSlowLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setIsSlowLoading(true);
      }, 3500);
    } else {
      setIsSlowLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Autenticação e Radar Sincronizado
  const { user, telegramLink } = useAuth();
  const {
    matches,
    loading: radarLoading,
    novasContador,
    marcarComoVisto,
    recarregarMatches,
  } = useMeuRadar(user?.id);

  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Estatisticas Globais
  const [stats, setStats] = useState<Estatisticas>({
    total: 0,
    remotas: 0,
    hibridas: 0,
    presenciais: 0,
    easy_apply: 0,
    novas: 0
  });

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

  // Pré-computa vagas do Meu Radar
  const radarVagas = useMemo(() => {
    return matches.map((m) => ({
      ...m.vaga,
      _matchId: m.id,
      _vistoEm: m.visto_em,
      is_nova: !m.visto_em,
      _timestamp: m.vaga?._timestamp ?? parseDataPostagemTimestamp(m.vaga?.data_postagem, m.vaga?.data_coleta),
    }));
  }, [matches]);

  const matchIdPorVagaId = useMemo(() => {
    const map = new Map<string, number>();
    matches.forEach((m) => map.set(m.vaga_id, m.id));
    return map;
  }, [matches]);

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
    if (userTab === 'salvas' || userTab === 'candidatadas' || userTab === 'ocultadas') {
      setUserTab('todas');
    }
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
    (userTab !== 'todas' && userTab !== 'radar')
  );

  // Filtragem multiárea, senioridade e abas de usuario com alta performance
  const vagasFiltradas = useMemo(() => {
    const now = Date.now();
    const MS_60_DAYS = 60 * 24 * 3600 * 1000;

    const baseList = userTab === 'radar' ? radarVagas : vagas;

    return baseList.filter((vaga) => {
      // 1. Aba de usuario
      if (userTab === 'salvas' && !isSaved(vaga.id)) return false;
      if (userTab === 'candidatadas' && !isApplied(vaga.id)) return false;
      if (userTab === 'ocultadas') {
        if (!isHidden(vaga.id)) return false;
      } else {
        // Nas demais abas, esconde as vagas marcadas como ocultadas
        if (isHidden(vaga.id)) return false;
      }

      // Se houver busca por texto digitado
      if (busca.trim()) {
        const query = busca.toLowerCase();
        const textoVaga = `${vaga.titulo} ${vaga.empresa || ''} ${vaga.localizacao || ''} ${vaga.termo_busca || ''}`.toLowerCase();
        if (!textoVaga.includes(query)) return false;
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

      // 4. Limite de antiguidade: maximo 60 dias (para vagas públicas)
      if (userTab !== 'radar') {
        const postTimestamp = vaga._timestamp ?? parseDataPostagemTimestamp(vaga.data_postagem, vaga.data_coleta);
        if (now - postTimestamp > MS_60_DAYS) return false;
      }

      return true;
    });
  }, [vagas, radarVagas, userTab, area, senioridade, busca, isSaved, isApplied, isHidden]);

  // Vagas visíveis limitadas para alta performance e baixíssimo TBT / DOM Size
  const displayedVagas = useMemo(() => {
    return vagasFiltradas.slice(0, visibleCount);
  }, [vagasFiltradas, visibleCount]);

  const isContentLoading = userTab === 'radar' ? (user ? radarLoading : false) : loading;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20">
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        
        {/* Cabecalho Principal Unificado e Responsivo (Sem cortes nem sobreposições) */}
        <Header 
          activePage="vagas" 
          isTelegramOpen={isTelegramModalOpen}
          setIsTelegramOpen={setIsTelegramModalOpen}
          onPreferenciasSalvas={recarregarMatches}
        />

        {/* Barra de Filtros e Busca (Ação Principal) */}
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
          radarCount={user ? matches.length : undefined}
          radarNovasCount={user ? novasContador : undefined}
          onLimparFiltros={limparFiltros}
          temFiltroAtivo={temFiltroAtivo}
        />

        {/* 5 Cards de Métricas (KPIs / Filtros Rápidos de Modalidade) */}
        <section aria-label="Indicadores principais">
          <QuickMetrics
            stats={stats}
            totalVagasCarregadas={vagas.length}
            activeFilter={quickFilter}
            onSelectFilter={handleSelectQuickFilter}
            isLoading={isContentLoading}
          />
        </section>

        {/* Secao de Conteudo / Listagem */}
        <section className="space-y-4 pt-1">
          {/* Barra de Status do Meu Radar quando na aba 'radar' com usuário logado */}
          {userTab === 'radar' && user && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 text-xs shadow-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-bold font-heading text-slate-100">
                  <Radio className="w-3.5 h-3.5 text-[#06b6d4] animate-pulse" />
                  <span>Feed Sincronizado</span>
                </span>
                <span className="text-slate-700 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {telegramLink?.status === 'ativo' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#10b981]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Bot ativo no Telegram
                    </span>
                  ) : telegramLink?.status === 'espera' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#f59e0b]">
                      ⏳ Fila VIP do Telegram (feed web ativo)
                    </span>
                  ) : telegramLink?.status === 'pendente' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#f59e0b]">
                      ⚠️ Bot pendente de ativação no Telegram
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Telegram não conectado
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-heading font-semibold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#06b6d4]" />
                <span>Ajustar Filtros do Radar</span>
              </button>
            </div>
          )}

          {/* Header da Listagem: Contador e Botao de Atualizar */}
          <div className="flex items-center justify-between gap-2.5 text-xs text-slate-400">
            <h2 className="font-heading font-medium text-xs text-slate-400 m-0 min-w-0 flex-1 truncate">
              {isContentLoading && vagasFiltradas.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-slate-400 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#06b6d4] animate-ping shrink-0" />
                  <span className="truncate">Sincronizando oportunidades...</span>
                </span>
              ) : (
                <span className="truncate block">
                  Exibindo <strong className="font-mono font-extrabold text-sm text-[#06b6d4]">{vagasFiltradas.length}</strong> {vagasFiltradas.length === 1 ? 'oportunidade' : 'oportunidades'}
                  {userTab === 'radar' && ' no seu Radar'}
                  {userTab === 'salvas' && ' salvas'}
                  {userTab === 'candidatadas' && ' candidatadas'}
                  {userTab === 'ocultadas' && ' ocultadas'}
                </span>
              )}
            </h2>

            <div className="flex items-center gap-2 shrink-0">
              {userTab === 'ocultadas' && hiddenIds.size > 0 && (
                <button
                  type="button"
                  onClick={unhideAll}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded-xl transition-colors cursor-pointer border border-[#f43f5e]/20 active:scale-95"
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
                  if (user) recarregarMatches();
                }}
                disabled={isContentLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-[#0b0f1a]/95 backdrop-blur-2xl hover:bg-white/[0.06] text-slate-300 font-heading font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-sm active:scale-95 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#06b6d4] ${isContentLoading ? "animate-spin" : ""}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Feedback de Sincronização Sob Demanda / Conexão em Andamento */}
          {isSlowLoading && isContentLoading && !error && (
            <div className="relative overflow-hidden rounded-2xl border border-[#06b6d4]/30 bg-[#0b0f1a]/95 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl shadow-[#06b6d4]/10 transition-all duration-300 animate-in fade-in">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent animate-pulse" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#06b6d4] shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06b6d4] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#06b6d4]"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold font-heading text-white flex items-center gap-2 m-0">
                      Sincronizando radar de oportunidades...
                    </h4>
                    <p className="text-xs text-slate-300 font-sans mt-0.5 m-0">
                      Conectando à base de dados em tempo real, aguarde alguns instantes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fetchStats();
                    fetchVagas();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[#06b6d4] text-xs font-heading font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#06b6d4]" />
                  <span>Reconectar</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback de Erro */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-rose-400 m-0">{error}</p>
                <p className="text-rose-300/80 text-[11px] mt-1 m-0">A conexão com a nuvem pode ter expirado durante o despertar do servidor.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  fetchStats();
                  fetchVagas();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold cursor-pointer transition-colors w-fit shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-300" />
                <span>Tentar novamente</span>
              </button>
            </div>
          )}

          {/* Skeletons de Carregamento Adaptaveis */}
          {isContentLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 space-y-3 animate-pulse shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10" />
                      <div className="space-y-1">
                        <div className="h-3 w-20 bg-white/10 rounded" />
                        <div className="h-2.5 w-14 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded bg-white/10" />
                      <div className="w-6 h-6 rounded bg-white/10" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <div className="h-4 w-12 bg-white/10 rounded" />
                    <div className="h-4 w-16 bg-white/10 rounded" />
                  </div>
                  <div className="h-4 w-5/6 bg-white/10 rounded" />
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <div className="h-3 w-16 bg-white/5 rounded" />
                    <div className="h-7 w-20 bg-white/10 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : userTab === 'radar' && !user ? (
            /* Onboarding do Meu Radar quando o usuário ainda não fez login */
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f1a]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="max-w-2xl space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06b6d4]/15 border border-[#06b6d4]/30 text-[#06b6d4] text-xs font-bold font-heading">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Feed Sincronizado com o Telegram</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                  Seu Radar Personalizado de Vagas
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  Crie sua conta gratuita em segundos para salvar suas tecnologias favoritas (Power BI, Python, SQL...), cidades e senioridade. As vagas que apitam no seu Telegram ficam guardadas aqui neste painel exclusivo.
                </p>
              </div>

              {/* 3 Pilares */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#06b6d4]/15 flex items-center justify-center text-[#06b6d4]">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold font-heading text-slate-100">Filtros Cirúrgicos</h4>
                  <p className="text-[11px] text-slate-400">
                    Defina palavras-chave, cidades, modalidade e senioridade para receber apenas o que importa.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#06b6d4]/15 flex items-center justify-center text-[#06b6d4]">
                    <Send className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold font-heading text-slate-100">Alertas no Telegram</h4>
                  <p className="text-[11px] text-slate-400">
                    Receba notificações em tempo real no seu celular assim que uma vaga nova for coletada.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#10b981]/15 flex items-center justify-center text-[#10b981]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold font-heading text-slate-100">100% Grátis & Sem Senhas</h4>
                  <p className="text-[11px] text-slate-400">
                    Acesso seguro em 1 clique via Google ou link mágico por e-mail, sem burocracia.
                  </p>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTelegramModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-heading font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Criar Conta & Configurar Meu Radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-400 font-sans">
                  ⚡ Limite de 10 vagas no grupo do Telegram (feed do site é ilimitado).
                </span>
              </div>
            </div>
          ) : userTab === 'radar' && user && matches.length === 0 ? (
            /* Estado vazio específico para usuário logado no Radar sem matches */
            <div className="text-center py-16 px-4 bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl space-y-3 shadow-xl">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#06b6d4]/10 flex items-center justify-center text-[#06b6d4]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold font-heading text-slate-200">
                Seu Radar está ativo e monitorando!
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Ainda não encontramos vagas recentes que combinem com suas preferências salvas. O robô varre o mercado continuamente e notificará você no Telegram e atualizará esta tela.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTelegramModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-heading font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#06b6d4]" />
                  <span>Ajustar Palavras-chave e Filtros</span>
                </button>
              </div>
            </div>
          ) : vagasFiltradas.length === 0 ? (
            /* Estado Vazio Amigavel */
            <div className="text-center py-16 px-4 bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl space-y-3 shadow-xl">
              <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.05] flex items-center justify-center text-slate-400">
                <Search className="w-5 h-5 text-[#06b6d4]" />
              </div>
              <h3 className="text-sm font-bold font-heading text-slate-200">
                {userTab === 'salvas' ? 'Nenhuma vaga favoritada ainda' :
                 userTab === 'candidatadas' ? 'Nenhuma candidatura registrada' :
                 userTab === 'ocultadas' ? 'Nenhuma vaga oculta' :
                 'Nenhuma vaga encontrada com estes filtros'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                {userTab === 'salvas' ? 'Clique no ícone de marcador nos cartões para guardar suas vagas favoritas.' :
                 userTab === 'candidatadas' ? 'Marque as vagas onde você se candidatou usando o botão de check.' :
                 userTab === 'ocultadas' ? 'Vagas que você ocultar aparecerão aqui para eventual restauração.' :
                 'Tente ajustar os filtros ou a palavra-chave de busca para ver mais oportunidades.'}
              </p>
              {temFiltroAtivo && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-slate-200 border border-white/10 text-xs font-heading font-semibold hover:bg-white/[0.12] transition-all cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            /* Grelha Responsiva Adaptavel */
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
                    onOpenLink={(vagaId) => {
                      const mId = matchIdPorVagaId.get(vagaId);
                      if (mId) marcarComoVisto(mId);
                    }}
                  />
                ))}
              </div>

              {/* Botão Progressivo "Carregar Mais Vagas" para não sobrecarregar o DOM e mobile */}
              {displayedVagas.length < vagasFiltradas.length && (
                <div className="flex flex-col items-center justify-center pt-5 pb-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 24, vagasFiltradas.length))}
                    className="w-full sm:w-auto px-7 py-3 rounded-2xl border border-white/10 bg-[#0b0f1a]/95 backdrop-blur-2xl hover:bg-white/[0.06] hover:border-cyan-500/40 text-slate-200 font-heading font-semibold text-sm transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <span>Carregar mais vagas (<strong className="font-mono text-[#06b6d4] font-extrabold">{vagasFiltradas.length - displayedVagas.length}</strong> restantes)</span>
                  </button>
                  <span className="text-xs text-slate-400 font-medium">
                    Exibindo <span className="font-mono text-slate-200 font-extrabold">{displayedVagas.length}</span> de <span className="font-mono text-slate-200 font-extrabold">{vagasFiltradas.length}</span> vagas
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
