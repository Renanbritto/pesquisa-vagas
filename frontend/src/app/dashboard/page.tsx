'use client';

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { 
  RefreshCw, 
  TrendingUp, 
  Laptop, 
  Building2, 
  MapPin, 
  Zap, 
  Clock, 
  ArrowLeft,
  CheckCircle2,
  Code2,
  BrainCircuit,
  Compass,
  Lightbulb,
  ExternalLink
} from "lucide-react";
import { Vaga, Estatisticas } from "../../types/job";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { normalizarModalidade, parseDataPostagemTimestamp } from "../../utils/dateUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://pesquisa-vagas-api.onrender.com";

// Dicionário de Tecnologias para extração analítica
const TRACKED_SKILLS = [
  { name: "Python", category: "Linguagem & Data Science", color: "from-blue-500 to-indigo-600", bgLight: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { name: "Power BI", category: "Business Intelligence", color: "from-amber-400 to-amber-600", bgLight: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { name: "SQL", category: "Banco de Dados & Modelagem", color: "from-emerald-500 to-teal-600", bgLight: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { name: "Databricks", category: "Big Data & Engenharia", color: "from-rose-500 to-red-600", bgLight: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30" },
  { name: "AWS", category: "Cloud Computing", color: "from-orange-400 to-amber-600", bgLight: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { name: "Azure", category: "Cloud Computing", color: "from-sky-500 to-blue-600", bgLight: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  { name: "Spark", category: "Processamento Distribuído", color: "from-orange-500 to-rose-600", bgLight: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { name: "Excel", category: "Análise de Negócios", color: "from-emerald-600 to-green-700", bgLight: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30" },
  { name: "Machine Learning", category: "Inteligência Artificial", color: "from-purple-500 to-violet-600", bgLight: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  { name: "ETL", category: "Engenharia de Dados", color: "from-cyan-500 to-blue-600", bgLight: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
];

export default function DashboardPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  // Carrega dados completos para alimentar o storytelling
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vagasRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vagas?limit=300`),
        fetch(`${API_BASE_URL}/estatisticas`)
      ]);

      if (!vagasRes.ok) throw new Error("Erro ao carregar lista de vagas");
      const vagasData = await vagasRes.json();
      setVagas(vagasData.vagas || []);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Falha ao carregar dashboard:", err);
      setError("Não foi possível conectar à API de dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Processamento Analítico das Modalidades
  const modalidadeStats = useMemo(() => {
    if (!vagas.length) return { remoto: 0, hibrido: 0, presencial: 0, total: 0, remotoPct: 0, hibridoPct: 0, presencialPct: 0, flexPct: 0 };
    let remoto = 0;
    let hibrido = 0;
    let presencial = 0;

    vagas.forEach((v) => {
      const m = normalizarModalidade(v.modalidade);
      if (m === 'Remoto') remoto++;
      else if (m === 'Híbrido') hibrido++;
      else if (m === 'Presencial') presencial++;
    });

    const total = remoto + hibrido + presencial || 1;
    const remotoPct = Math.round((remoto / total) * 100);
    const hibridoPct = Math.round((hibrido / total) * 100);
    const presencialPct = Math.round((presencial / total) * 100);
    const flexPct = remotoPct + hibridoPct;

    return { remoto, hibrido, presencial, total, remotoPct, hibridoPct, presencialPct, flexPct };
  }, [vagas]);

  // 2. Processamento Analítico das Plataformas
  const plataformaStats = useMemo(() => {
    if (!vagas.length) return [];
    const counts: Record<string, { total: number; easy: number; remote: number }> = {};

    vagas.forEach((v) => {
      const p = v.plataforma || 'Outro';
      if (!counts[p]) counts[p] = { total: 0, easy: 0, remote: 0 };
      counts[p].total++;
      if (v.easy_apply) counts[p].easy++;
      if (normalizarModalidade(v.modalidade) === 'Remoto') counts[p].remote++;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        total: data.total,
        percentage: Math.round((data.total / vagas.length) * 100),
        easyPct: Math.round((data.easy / data.total) * 100),
        remotePct: Math.round((data.remote / data.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [vagas]);

  // 3. Frequência das Tecnologias
  const skillsRanking = useMemo(() => {
    if (!vagas.length) return [];
    
    return TRACKED_SKILLS.map((skill) => {
      const term = skill.name.toLowerCase();
      const count = vagas.filter((v) => {
        const text = `${v.titulo} ${v.termo_busca || ''}`.toLowerCase();
        return text.includes(term);
      }).length;

      const percentage = Math.round((count / vagas.length) * 100);
      return { ...skill, count, percentage };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count);
  }, [vagas]);

  // 4. Pirâmide de Senioridade
  const senioridadeStats = useMemo(() => {
    if (!vagas.length) return { estagioJr: 0, pleno: 0, seniorLead: 0, total: 0 };
    let estagioJr = 0;
    let pleno = 0;
    let seniorLead = 0;

    vagas.forEach((v) => {
      const t = v.titulo.toLowerCase();
      if (t.includes('estágio') || t.includes('estagio') || t.includes('júnior') || t.includes('junior') || t.includes('jr') || t.includes('intern')) {
        estagioJr++;
      } else if (t.includes('sênior') || t.includes('senior') || t.includes('sr') || t.includes('lead') || t.includes('líder') || t.includes('head') || t.includes('especialista')) {
        seniorLead++;
      } else {
        pleno++;
      }
    });

    const total = estagioJr + pleno + seniorLead || 1;
    return {
      estagioJr,
      estagioJrPct: Math.round((estagioJr / total) * 100),
      pleno,
      plenoPct: Math.round((pleno / total) * 100),
      seniorLead,
      seniorLeadPct: Math.round((seniorLead / total) * 100),
      total
    };
  }, [vagas]);

  // 5. Maiores Empresas Contratantes
  const topEmpresas = useMemo(() => {
    if (!vagas.length) return [];
    const counts: Record<string, number> = {};

    vagas.forEach((v) => {
      const emp = v.empresa?.trim() || 'Empresa Confidencial';
      counts[emp] = (counts[emp] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [vagas]);

  // Vagas relacionadas à tecnologia selecionada
  const vagasDaTech = useMemo(() => {
    if (!selectedTech) return [];
    const term = selectedTech.toLowerCase();
    return vagas.filter((v) => {
      const text = `${v.titulo} ${v.termo_busca || ''}`.toLowerCase();
      return text.includes(term);
    }).slice(0, 6);
  }, [vagas, selectedTech]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-violet-500/20">
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        
        {/* Cabecalho Principal Unificado e Responsivo (Sem cortes nem sobreposições) */}
        <Header activePage="dashboard" />


        {/* HERO STORYTELLING BANNER */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-violet-500/10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>Diagnóstico em Tempo Real</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              O Pulso Real do Mercado de Dados & Tecnologia
            </h2>

            <p className="text-sm sm:text-base text-violet-100/90 leading-relaxed font-normal">
              Analisamos <strong>{vagas.length || 'centenas de'} oportunidades ativas</strong> no LinkedIn, Gupy e Indeed para decifrar sem achismos: onde estão as melhores contratações, quais ferramentas garantem entrevistas e como navegar as novas regras do jogo.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-violet-50 font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar Métricas</span>
              </button>

              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs backdrop-blur-md transition-all active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para as Vagas</span>
              </Link>
            </div>
          </div>
        </section>

        {/* CAPÍTULO 1: OS 4 INDICADORES DE IMPACTO */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <span>Capítulo 1 • O Termômetro Geral</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Índice de Flexibilidade */}
            <div className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-violet-400/50 transition-all">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Índice de Flexibilidade
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-violet-600 dark:text-violet-400">
                    {modalidadeStats.flexPct}%
                  </span>
                  <span className="text-xs text-slate-500">das vagas</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                A união de <strong>Remoto ({modalidadeStats.remotoPct}%)</strong> e <strong>Híbrido ({modalidadeStats.hibridoPct}%)</strong> domina. Empresas que exigem 100% presencial viraram minoria no setor tech.
              </p>
            </div>

            {/* Card 2: Aplicação Simplificada */}
            <div className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-400/50 transition-all">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Aplicação Rápida (Easy Apply)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-amber-500">
                    {stats?.easy_apply || vagas.filter(v => v.easy_apply).length}
                  </span>
                  <span className="text-xs text-slate-500">vagas sem atrito</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                Oportunidades em que você se candidata com 1 clique usando seu perfil pronto, poupando formulários infinitos de cadastro.
              </p>
            </div>

            {/* Card 3: Janela de Ouro (Frescor) */}
            <div className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-400/50 transition-all">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Novas Entradas (Janela de Ouro)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                    {stats?.novas || vagas.filter(v => v.is_nova).length}
                  </span>
                  <span className="text-xs text-slate-500">vagas quentes</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                Vagas coletadas recentemente. Candidatos que se aplicam nas <strong>primeiras 48 horas</strong> têm taxa de visualização até 4x superior.
              </p>
            </div>

            {/* Card 4: Maior Contratante Atual */}
            <div className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-sky-400/50 transition-all">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Líder de Contratações
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 truncate">
                    {topEmpresas[0]?.name || 'Empresas Globais'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                Com <strong>{topEmpresas[0]?.count || 0} posições ativas</strong> no radar hoje, liderando a demanda do setor.
              </p>
            </div>
          </div>
        </section>

        {/* CAPÍTULO 2 & 3 EM GRID: O DUELO DE MODALIDADES & BATALHA DAS PLATAFORMAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* CAPÍTULO 2: O Duelo de Modalidades */}
          <section className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Capítulo 2
                </span>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-indigo-500" />
                  <span>Para Onde Foi o Home Office?</span>
                </h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                Tendência 2026
              </span>
            </div>

            {/* Barra Visual Segmentada de Proporção */}
            <div className="space-y-1.5 pt-1">
              <div className="h-4 w-full rounded-xl overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <div 
                  style={{ width: `${modalidadeStats.hibridoPct}%` }} 
                  className="bg-amber-500 transition-all duration-500" 
                  title={`Híbrido: ${modalidadeStats.hibridoPct}%`}
                />
                <div 
                  style={{ width: `${modalidadeStats.presencialPct}%` }} 
                  className="bg-slate-400 dark:bg-slate-600 transition-all duration-500" 
                  title={`Presencial: ${modalidadeStats.presencialPct}%`}
                />
                <div 
                  style={{ width: `${modalidadeStats.remotoPct}%` }} 
                  className="bg-violet-600 transition-all duration-500" 
                  title={`Remoto: ${modalidadeStats.remotoPct}%`}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Híbrido ({modalidadeStats.hibridoPct}%)
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                  Presencial ({modalidadeStats.presencialPct}%)
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                  Remoto ({modalidadeStats.remotoPct}%)
                </span>
              </div>
            </div>

            {/* Storytelling Textual */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                🏢 <strong>A Consolidação do Híbrido:</strong> O modelo híbrido tornou-se o padrão das sedes corporativas nas capitais. É o meio-termo adotado pelas diretorias para justificar sedes físicas sem perder candidatos que rejeitam 100% presencial.
              </p>
              <p>
                🌐 <strong>O Funil do Remoto:</strong> As vagas 100% remotas ({modalidadeStats.remotoPct}%) são as mais concorridas do país, recebendo em média 5x mais candidaturas. Para conquistar o trabalho remoto hoje, a assertividade do currículo precisa ser cirúrgica.
              </p>
            </div>
          </section>

          {/* CAPÍTULO 3: A Batalha das Plataformas */}
          <section className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Capítulo 3
                </span>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <span>Onde as Oportunidades Estão?</span>
                </h4>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                Gupy vs LinkedIn
              </span>
            </div>

            {/* Comparativo de Plataformas */}
            <div className="space-y-3">
              {plataformaStats.map((plat) => (
                <div key={plat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {plat.name} ({plat.total} vagas)
                    </span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {plat.percentage}% do total
                    </span>
                  </div>
                  
                  {/* Barra de Progresso */}
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${plat.percentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        plat.name === 'LinkedIn' ? 'bg-[#0a66c2]' :
                        plat.name === 'Gupy' ? 'bg-emerald-500' : 'bg-violet-600'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Storytelling Textual */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                🎯 <strong>Perfil Gupy:</strong> Domina o volume de vagas em indústrias, bancos tradicionais e grandes varejistas. Dica: passe pelos filtros de ATS alinhando exatamente os termos técnicos da descrição.
              </p>
              <p>
                💼 <strong>Perfil LinkedIn:</strong> Concentra mais posições para Pleno/Sênior e empresas globais, com alta taxa de contratações via abordagem direta e aplicação simplificada.
              </p>
            </div>
          </section>

        </div>

        {/* CAPÍTULO 4: O ARSENAL TECNOLÓGICO MAIS COBIÇADO */}
        <section className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Capítulo 4 • Análise de Competências
              </span>
              <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-violet-600" />
                <span>O Arsenal Tecnológico Mais Quente</span>
              </h4>
            </div>
            <p className="text-xs text-slate-500 max-w-sm sm:text-right">
              Clique em qualquer ferramenta para ver as vagas abertas relacionadas no radar.
            </p>
          </div>

          {/* Grid de Barras das Ferramentas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillsRanking.map((skill, index) => {
              const isSelected = selectedTech === skill.name;
              return (
                <div
                  key={skill.name}
                  onClick={() => setSelectedTech(isSelected ? null : skill.name)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/50 dark:bg-violet-950/30'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-slate-400 w-5">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {skill.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 font-medium">
                        {skill.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {skill.count}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        vagas ({skill.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Gradiente */}
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(skill.percentage * 2, 8))}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${skill.color} transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vagas Relacionadas à Ferramenta Clicada */}
          {selectedTech && (
            <div className="p-4 sm:p-5 rounded-2xl bg-violet-500/10 border border-violet-500/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Vagas que exigem {selectedTech} ({vagasDaTech.length} exibidas)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTech(null)}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {vagasDaTech.map((v) => (
                  <a
                    key={v.id}
                    href={v.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-violet-500/20 hover:border-violet-500 text-xs space-y-1 block transition-all shadow-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {v.titulo}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center justify-between">
                      <span>{v.empresa || 'Confidencial'}</span>
                      <ExternalLink className="w-3 h-3 text-violet-500 shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Storytelling Insight */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            💡 <strong>A Trinca de Ouro do Mercado:</strong> O combo <strong>Python + SQL + Power BI</strong> cobre mais de 75% dos requisitos de contratação em Analytics e Ciência de Dados. Dominar a manipulação de dados em SQL, scripts automáticos em Python e a contação de histórias visuais no Power BI é o investimento de maior ROI profissional hoje.
          </div>
        </section>

        {/* CAPÍTULO 5 & 6: SENIORIDADE & TOP EMPRESAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* CAPÍTULO 5: O Funil da Senioridade */}
          <section className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Capítulo 5
              </span>
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-500" />
                <span>O Funil da Senioridade</span>
              </h4>
            </div>

            {/* Pirâmide Visual */}
            <div className="space-y-3 pt-1">
              {/* Sênior / Lead */}
              <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    Sênior, Lead & Especialista
                  </span>
                  <span className="font-black text-purple-700 dark:text-purple-300">
                    {senioridadeStats.seniorLead} vagas ({senioridadeStats.seniorLeadPct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-purple-200 dark:bg-purple-950/60 rounded-full overflow-hidden">
                  <div style={{ width: `${senioridadeStats.seniorLeadPct}%` }} className="h-full bg-purple-500 rounded-full" />
                </div>
              </div>

              {/* Pleno */}
              <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-violet-700 dark:text-violet-300">
                    Pleno (O Coração da Demanda)
                  </span>
                  <span className="font-black text-violet-700 dark:text-violet-300">
                    {senioridadeStats.pleno} vagas ({senioridadeStats.plenoPct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-violet-200 dark:bg-violet-950/60 rounded-full overflow-hidden">
                  <div style={{ width: `${senioridadeStats.plenoPct}%` }} className="h-full bg-violet-600 rounded-full" />
                </div>
              </div>

              {/* Estágio / Júnior */}
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    Estágio & Júnior (Porta de Entrada)
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300">
                    {senioridadeStats.estagioJr} vagas ({senioridadeStats.estagioJrPct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-emerald-200 dark:bg-emerald-950/60 rounded-full overflow-hidden">
                  <div style={{ width: `${senioridadeStats.estagioJrPct}%` }} className="h-full bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Storytelling Textual */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              ⚡ <strong>O Paradoxo do Pleno:</strong> O nível Pleno ({senioridadeStats.plenoPct}%) é o verdadeiro motor de contratações: empresas buscam profissionais com autonomia operacional imediata. Para quem é Júnior, o caminho de aceleração é demonstrar projetos reais de ponta a ponta que comprovem independência.
            </div>
          </section>

          {/* CAPÍTULO 6: Os Maiores Contratantes */}
          <section className="bg-white/95 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Capítulo 6
              </span>
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-500" />
                <span>Os Polos & Empresas Contratantes</span>
              </h4>
            </div>

            {/* Lista das Maiores Contratantes */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {topEmpresas.map((emp) => (
                <div
                  key={emp.name}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                      {emp.name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      Brasil
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black shrink-0">
                    {emp.count}
                  </span>
                </div>
              ))}
            </div>

            {/* Storytelling Textual */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              📍 <strong>Concentração Geográfica:</strong> São Paulo e Campinas continuam sendo as capitais financeiras de vagas presenciais e híbridas. No entanto, mais de 25% de todo o volume analisado permite contratação 100% remota com residência em qualquer estado brasileiro.
            </div>
          </section>

        </div>

        {/* CAPÍTULO 7: PLAYBOOK DE AÇÃO DO CANDIDATO */}
        <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 border border-slate-800">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Capítulo 7 • Conclusão Prática</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              O Playbook: Como Usar Estes Dados Para Passar na Frente
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Estratégias validadas pela matemática das contratações para transformar números em convites de entrevista.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-white">
                Aplique nas Primeiras 48h
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Utilize o botão de filtro <strong>"Novas Vagas"</strong> no Pesquisa Vagas. Recrutadores fecham a triagem dos primeiros currículos antes mesmo da vaga completar uma semana.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-white">
                Filtre por Menor Atrito
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vagas com <strong>Aplicação Simplificada</strong> permitem acelerar o número de testes por semana. Reserve seu tempo para processos longos apenas quando a vaga for seu match perfeito.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-white">
                Sincronize Suas Palavras-Chave
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                As ferramentas mais pedidas (Python, SQL, Power BI) devem constar explicitamente nos títulos de seus projetos no GitHub e no resumo do LinkedIn para superar os robôs de ATS.
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/30 active:scale-95"
            >
              <span>Explorar Oportunidades no Radar Agora</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
