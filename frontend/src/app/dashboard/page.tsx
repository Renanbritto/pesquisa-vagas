'use client';

import Link from "next/link";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Lenis from "lenis";
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
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Sparkles,
  BarChart3,
  Activity,
  Briefcase,
  Layers,
  MousePointer,
  Eye,
} from "lucide-react";
import { Vaga, Estatisticas } from "../../types/job";
import { normalizarModalidade } from "../../utils/dateUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://pesquisa-vagas-api.onrender.com";

// Dicionário de Tecnologias para extração analítica
const TRACKED_SKILLS = [
  { name: "Python", category: "Linguagem & Data Science", color: "from-blue-500 to-indigo-600", accent: "bg-blue-500", text: "text-blue-400" },
  { name: "Power BI", category: "Business Intelligence", color: "from-amber-400 to-amber-600", accent: "bg-amber-500", text: "text-amber-400" },
  { name: "SQL", category: "Banco de Dados & Modelagem", color: "from-emerald-500 to-teal-600", accent: "bg-emerald-500", text: "text-emerald-400" },
  { name: "Databricks", category: "Big Data & Engenharia", color: "from-rose-500 to-red-600", accent: "bg-rose-500", text: "text-rose-400" },
  { name: "AWS", category: "Cloud Computing", color: "from-orange-400 to-amber-600", accent: "bg-orange-500", text: "text-orange-400" },
  { name: "Azure", category: "Cloud Computing", color: "from-sky-500 to-blue-600", accent: "bg-sky-500", text: "text-sky-400" },
  { name: "Spark", category: "Processamento Distribuído", color: "from-orange-500 to-rose-600", accent: "bg-orange-600", text: "text-orange-400" },
  { name: "Excel", category: "Análise de Negócios", color: "from-emerald-600 to-green-700", accent: "bg-green-600", text: "text-green-400" },
  { name: "Machine Learning", category: "Inteligência Artificial", color: "from-purple-500 to-violet-600", accent: "bg-purple-500", text: "text-purple-400" },
  { name: "ETL", category: "Engenharia de Dados", color: "from-cyan-500 to-blue-600", accent: "bg-cyan-500", text: "text-cyan-400" },
];

// Metadados dos 8 Capítulos Espaciais 3D
const CHAPTERS = [
  { id: 0, label: "Início", title: "Panorama Geral", subtitle: "O Pulso Real do Mercado Tech", icon: Sparkles },
  { id: 1, label: "Indicadores", title: "Macroindicadores", subtitle: "Dinâmica & Velocidade de Contratação", icon: TrendingUp },
  { id: 2, label: "Modalidades", title: "Modelos de Trabalho", subtitle: "Remoto, Híbrido ou Presencial", icon: Laptop },
  { id: 3, label: "Plataformas", title: "Canais de Captação", subtitle: "Onde as Vagas São Publicadas", icon: Building2 },
  { id: 4, label: "Tech Stack", title: "Matriz Tecnológica", subtitle: "Habilidades Mais Demandadas", icon: Code2 },
  { id: 5, label: "Senioridade", title: "Nível de Maturidade", subtitle: "Distribuição por Experiência", icon: Compass },
  { id: 6, label: "Empresas", title: "Ecossistema Contratante", subtitle: "Organizações com Mais Posições", icon: MapPin },
  { id: 7, label: "Playbook", title: "Playbook Estratégico", subtitle: "Plano de Ação para Aprovação", icon: Lightbulb },
];

const Z_GAP = 1400; // Distância 3D entre estações no eixo Z

export default function DashboardPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

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
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [camDepth, setCamDepth] = useState<number>(0);

  // Referências DOM e instâncias
  const lenisRef = useRef<Lenis | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Carrega dados da API
  const loadData = useCallback(async () => {
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
      setError("Não foi possível conectar à API de dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Cálculos Estatísticos
  const modalidadeStats = useMemo(() => {
    if (!vagas.length) return { remoto: 0, hibrido: 0, presencial: 0, total: 0, remotoPct: 0, hibridoPct: 0, presencialPct: 0, flexPct: 0 };
    let remoto = 0, hibrido = 0, presencial = 0;
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
    return { remoto, hibrido, presencial, total, remotoPct, hibridoPct, presencialPct, flexPct: remotoPct + hibridoPct };
  }, [vagas]);

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
        name, total: data.total,
        percentage: Math.round((data.total / vagas.length) * 100),
        easyPct: Math.round((data.easy / data.total) * 100),
        remotePct: Math.round((data.remote / data.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [vagas]);

  const skillsRanking = useMemo(() => {
    if (!vagas.length) return [];
    return TRACKED_SKILLS.map((skill) => {
      const term = skill.name.toLowerCase();
      const count = vagas.filter((v) => {
        const text = `${v.titulo} ${v.termo_busca || ''}`.toLowerCase();
        return text.includes(term);
      }).length;
      return { ...skill, count, percentage: Math.round((count / vagas.length) * 100) };
    }).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);
  }, [vagas]);

  const senioridadeStats = useMemo(() => {
    if (!vagas.length) return { estagioJr: 0, estagioJrPct: 0, pleno: 0, plenoPct: 0, seniorLead: 0, seniorLeadPct: 0, total: 0 };
    let estagioJr = 0, pleno = 0, seniorLead = 0;
    vagas.forEach((v) => {
      const t = v.titulo.toLowerCase();
      if (t.includes('estágio') || t.includes('estagio') || t.includes('júnior') || t.includes('junior') || t.includes('jr') || t.includes('intern')) estagioJr++;
      else if (t.includes('sênior') || t.includes('senior') || t.includes('sr') || t.includes('lead') || t.includes('líder') || t.includes('head') || t.includes('especialista')) seniorLead++;
      else pleno++;
    });
    const total = estagioJr + pleno + seniorLead || 1;
    return {
      estagioJr, estagioJrPct: Math.round((estagioJr / total) * 100),
      pleno, plenoPct: Math.round((pleno / total) * 100),
      seniorLead, seniorLeadPct: Math.round((seniorLead / total) * 100),
      total
    };
  }, [vagas]);

  const topEmpresas = useMemo(() => {
    if (!vagas.length) return [];
    const counts: Record<string, number> = {};
    vagas.forEach((v) => { const emp = v.empresa?.trim() || 'Empresa Confidencial'; counts[emp] = (counts[emp] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [vagas]);

  // Função para navegar no espaço 3D até o capítulo selecionado
  const scrollToChapter = (chapterId: number) => {
    const targetScroll = chapterId * Z_GAP;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetScroll, { duration: 1.2 });
    } else {
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // MOTOR SPATIAL 3D & PARALLAX GYRO
  // ═════════════════════════════════════════════════════════════════
  useEffect(() => {
    const lenis = new Lenis({
      smoothWheel: true,
      lerp: 0.08,
      syncTouch: true,
    });
    lenisRef.current = lenis;

    // Rastreamento do mouse para Gyro Tilt 3D
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseRef.current.targetX = (e.clientX - cx) / cx;
      mouseRef.current.targetY = (e.clientY - cy) / cy;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const renderLoop = (time: number) => {
      lenis.raf(time);

      // Interpolação suave do mouse (efeito giroscópio 3D físico)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const cameraZ = scrollY; // 1:1 scroll para câmera Z

      setCamDepth(Math.round(cameraZ));

      // Atualiza rotação e posição da câmera 3D no espaço
      if (worldRef.current) {
        const tiltX = -mouseRef.current.y * 3.5;
        const tiltY = mouseRef.current.x * 4.5;
        worldRef.current.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate3d(0, 0, ${cameraZ}px)`;
      }

      // Atualiza o capítulo ativo
      const currentChapter = Math.min(CHAPTERS.length - 1, Math.max(0, Math.round(cameraZ / Z_GAP)));
      setActiveChapter(currentChapter);

      // ─────────────────────────────────────────────────────────────
      // Atualizações de Visibilidade e Scrubbing dos 8 Capítulos 3D
      // ─────────────────────────────────────────────────────────────
      CHAPTERS.forEach((ch) => {
        const clusterEl = document.getElementById(`cluster-${ch.id}`);
        if (!clusterEl) return;

        // Distância entre a câmera e o capítulo
        // ch.id está em -ch.id * Z_GAP. Quando cameraZ = ch.id * Z_GAP, dist = 0.
        const dist = cameraZ - (ch.id * Z_GAP);

        // Opacidade em profundidade Z
        let opacity = 0;
        let scale = 1;

        if (dist < -1300) {
          // Longe à frente
          opacity = 0;
          clusterEl.classList.remove('active-cluster');
        } else if (dist < -400) {
          // Aproximando-se pelo horizonte
          opacity = (dist + 1300) / 900;
          clusterEl.classList.remove('active-cluster');
        } else if (dist <= 350) {
          // Na zona focal da câmera
          opacity = 1;
          clusterEl.classList.add('active-cluster');
        } else if (dist <= 850) {
          // Passando atrás da câmera
          opacity = Math.max(0, 1 - (dist - 350) / 500);
          scale = 1 + (dist - 350) * 0.0006;
          clusterEl.classList.remove('active-cluster');
        } else {
          opacity = 0;
          clusterEl.classList.remove('active-cluster');
        }

        clusterEl.style.opacity = `${opacity}`;
        clusterEl.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${-ch.id * Z_GAP}px) scale(${scale})`;

        // ─────────────────────────────────────────────────────────────
        // PROGRESSO DO CAPÍTULO PARA DESENHAR GRÁFICOS (0 a 1)
        // Começa a preencher conforme se aproxima e fixa em 1 quando focal
        // ─────────────────────────────────────────────────────────────
        const approachStart = (ch.id - 0.7) * Z_GAP;
        const approachEnd = ch.id * Z_GAP;
        const p = Math.max(0, Math.min(1, (cameraZ - approachStart) / (approachEnd - approachStart)));

        // CAPÍTULO 1: Indicadores
        if (ch.id === 1) {
          const barFlex = document.getElementById('bar-ind-flex');
          if (barFlex) barFlex.style.width = `${p * modalidadeStats.flexPct}%`;
          const numFlex = document.getElementById('num-ind-flex');
          if (numFlex) numFlex.innerText = `${Math.round(p * modalidadeStats.flexPct)}%`;

          const easyPct = Math.round(((stats?.easy_apply || vagas.filter(v => v.easy_apply).length) / (vagas.length || 1)) * 100);
          const barEasy = document.getElementById('bar-ind-easy');
          if (barEasy) barEasy.style.width = `${p * easyPct}%`;
          const numEasy = document.getElementById('num-ind-easy');
          if (numEasy) numEasy.innerText = `${Math.round(p * easyPct)}%`;

          const barNovas = document.getElementById('bar-ind-novas');
          const novasTotal = stats?.novas || vagas.filter(v => v.is_nova).length;
          if (barNovas) barNovas.style.width = `${p * Math.min(100, novasTotal * 20)}%`;
          const numNovas = document.getElementById('num-ind-novas');
          if (numNovas) numNovas.innerText = `${Math.round(p * novasTotal)}`;
        }

        // CAPÍTULO 2: Modalidades (Triple-Ring SVG Donut 3D)
        if (ch.id === 2) {
          // Remoto (Raio 80, Circunferência 502.65)
          const ringRemoto = document.getElementById('svg-ring-remoto');
          if (ringRemoto) {
            const C1 = 502.65;
            const targetLen = (modalidadeStats.remotoPct / 100) * C1;
            ringRemoto.style.strokeDashoffset = `${C1 - (p * targetLen)}`;
          }

          // Híbrido (Raio 64, Circunferência 402.12)
          const ringHibrido = document.getElementById('svg-ring-hibrido');
          if (ringHibrido) {
            const C2 = 402.12;
            const targetLen = (modalidadeStats.hibridoPct / 100) * C2;
            ringHibrido.style.strokeDashoffset = `${C2 - (p * targetLen)}`;
          }

          // Presencial (Raio 48, Circunferência 301.59)
          const ringPresencial = document.getElementById('svg-ring-presencial');
          if (ringPresencial) {
            const C3 = 301.59;
            const targetLen = (modalidadeStats.presencialPct / 100) * C3;
            ringPresencial.style.strokeDashoffset = `${C3 - (p * targetLen)}`;
          }

          // Centro do Donut
          const donutCenterPct = document.getElementById('donut-center-pct');
          if (donutCenterPct) {
            donutCenterPct.innerText = `${Math.round(p * modalidadeStats.flexPct)}%`;
          }

          // Barras horizontais complementares
          const barModRemoto = document.getElementById('bar-mod-remoto');
          if (barModRemoto) barModRemoto.style.width = `${p * modalidadeStats.remotoPct}%`;
          const numModRemoto = document.getElementById('num-mod-remoto');
          if (numModRemoto) numModRemoto.innerText = `${Math.round(p * modalidadeStats.remotoPct)}%`;

          const barModHibrido = document.getElementById('bar-mod-hibrido');
          if (barModHibrido) barModHibrido.style.width = `${p * modalidadeStats.hibridoPct}%`;
          const numModHibrido = document.getElementById('num-mod-hibrido');
          if (numModHibrido) numModHibrido.innerText = `${Math.round(p * modalidadeStats.hibridoPct)}%`;

          const barModPresencial = document.getElementById('bar-mod-presencial');
          if (barModPresencial) barModPresencial.style.width = `${p * modalidadeStats.presencialPct}%`;
          const numModPresencial = document.getElementById('num-mod-presencial');
          if (numModPresencial) numModPresencial.innerText = `${Math.round(p * modalidadeStats.presencialPct)}%`;
        }

        // CAPÍTULO 3: Canais / Plataformas
        if (ch.id === 3) {
          plataformaStats.forEach((plat) => {
            const barPlat = document.getElementById(`bar-plat-${plat.name}`);
            if (barPlat) barPlat.style.width = `${p * plat.percentage}%`;
            const numPlat = document.getElementById(`num-plat-${plat.name}`);
            if (numPlat) numPlat.innerText = `${Math.round(p * plat.percentage)}%`;
          });
        }

        // CAPÍTULO 4: Matriz Tecnológica
        if (ch.id === 4) {
          skillsRanking.forEach((skill) => {
            const barSkill = document.getElementById(`bar-skill-${skill.name}`);
            if (barSkill) barSkill.style.width = `${p * skill.percentage}%`;
            const numSkill = document.getElementById(`num-skill-${skill.name}`);
            if (numSkill) numSkill.innerText = `${Math.round(p * skill.percentage)}%`;
          });
        }

        // CAPÍTULO 5: Senioridade
        if (ch.id === 5) {
          const barJr = document.getElementById('bar-sen-jr');
          if (barJr) barJr.style.width = `${p * senioridadeStats.estagioJrPct}%`;
          const numJr = document.getElementById('num-sen-jr');
          if (numJr) numJr.innerText = `${Math.round(p * senioridadeStats.estagioJrPct)}%`;

          const barPleno = document.getElementById('bar-sen-pleno');
          if (barPleno) barPleno.style.width = `${p * senioridadeStats.plenoPct}%`;
          const numPleno = document.getElementById('num-sen-pleno');
          if (numPleno) numPleno.innerText = `${Math.round(p * senioridadeStats.plenoPct)}%`;

          const barSr = document.getElementById('bar-sen-sr');
          if (barSr) barSr.style.width = `${p * senioridadeStats.seniorLeadPct}%`;
          const numSr = document.getElementById('num-sen-sr');
          if (numSr) numSr.innerText = `${Math.round(p * senioridadeStats.seniorLeadPct)}%`;
        }
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, [vagas, modalidadeStats, plataformaStats, skillsRanking, senioridadeStats, stats]);

  // Altura total da esteira virtual de scroll
  const totalVirtualHeight = (CHAPTERS.length - 1) * Z_GAP + (typeof window !== 'undefined' ? window.innerHeight : 1000);

  return (
    <div className="relative min-h-screen bg-[#090d16] text-slate-100 font-sans select-none overflow-x-hidden">

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 1. DOCK DE NAVEGAÇÃO SUPERIOR (Fixed HUD 3D)              */}
      {/* ═════════════════════════════════════════════════════════ */}
      <header className="executive-nav-dock">
        <div className="executive-nav-inner flex items-center justify-between gap-3">
          
          {/* Logo e Status Espacial */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight block">Radar 3D Tech</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {vagas.length ? `${vagas.length} vagas ativas` : 'Conectando à API...'}
              </span>
            </div>
          </Link>

          {/* Pílulas de Navegação dos 8 Capítulos Espaciais */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {CHAPTERS.map((ch) => {
              const isActive = activeChapter === ch.id;
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => scrollToChapter(ch.id)}
                  className={`px-2 sm:px-2.5 py-1 rounded-xl text-[11px] xl:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/35 font-bold scale-[1.03]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Ações Rápidas */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all cursor-pointer"
              title="Atualizar métricas da API"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Ver Vagas</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 2. HUD INFERIOR COM TELEMETRIA 3D                         */}
      {/* ═════════════════════════════════════════════════════════ */}
      <footer className="executive-status-bar">
        <div className="bg-[#0b0f1a]/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-2.5 sm:px-5 sm:py-3 shadow-2xl flex items-center justify-between gap-4 pointer-events-auto">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold shrink-0">
              CAP. 0{activeChapter + 1} / 08
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">
                {CHAPTERS[activeChapter].title}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                {CHAPTERS[activeChapter].subtitle}
              </span>
            </div>
          </div>

          {/* Telemetria do Eixo Z e Guia de Mouse */}
          <div className="flex items-center gap-4 shrink-0 text-xs font-mono">
            <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[11px]">
              <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mova o cursor para girar o espaço 3D</span>
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <span className="text-[10px] text-slate-500 font-bold uppercase">CÂMERA Z</span>
              <span className="text-xs text-sky-400 font-bold">-{camDepth}m</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 3. PALCO SPATIAL 3D (Fixed Fullscreen Viewport)          */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div className="spatial-viewport">

        {/* 3D World Container (rotacionado e movido pelo Lenis scroll) */}
        <div ref={worldRef} className="spatial-world">

          {/* Piso Holográfico em Grade 3D (Horizon Grid) */}
          <div className="spatial-floor-grid" />
          <div className="spatial-sky-grid" />

          {/* Orbs de Iluminação Volumétrica */}
          <div className="absolute top-[-400px] left-[-300px] w-[800px] h-[800px] bg-indigo-600/12 rounded-full blur-[180px] pointer-events-none" />
          <div className="absolute bottom-[-300px] right-[-200px] w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute top-[200px] right-[400px] w-[600px] h-[600px] bg-sky-500/8 rounded-full blur-[150px] pointer-events-none" />

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 0: HERO & PANORAMA GERAL                    */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-0" className="spatial-cluster">
            <div className="w-full flex flex-col items-center text-center space-y-10">
              
              {/* Título & Badge Flutuando em Z */}
              <div className="space-y-4 max-w-3xl" style={{ transform: 'translateZ(60px)' }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide shadow-lg shadow-indigo-500/10">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>DIAGNÓSTICO EXECUTIVO NO ESPAÇO 3D</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.08]">
                  O Pulso Real do{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-sky-400">
                    Mercado Tech
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  Consolidamos <strong className="text-white font-bold">{vagas.length || 'centenas de'} oportunidades ativas</strong> nos principais portais para mapear requisitos, modalidades de trabalho e demandas estratégicas de contratação.
                </p>

                {isSlowLoading && loading && !error && (
                  <div className="relative overflow-hidden rounded-2xl border border-indigo-500/40 bg-[#0b0f1a]/95 backdrop-blur-2xl p-4 shadow-xl text-left animate-in fade-in max-w-xl mx-auto">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
                        <Activity className="w-4 h-4 animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white m-0">
                          Sincronizando radar de oportunidades...
                        </h4>
                        <p className="text-[11px] text-slate-300 m-0 mt-0.5">
                          Conectando à base de dados em tempo real, aguarde alguns instantes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="relative overflow-hidden rounded-2xl border border-rose-500/40 bg-rose-500/10 backdrop-blur-2xl p-4 shadow-xl text-left max-w-xl mx-auto flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-rose-300 m-0">{error}</p>
                      <p className="text-[11px] text-rose-300/70 m-0 mt-0.5">A conexão com a nuvem pode ter expirado durante o despertar do servidor.</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadData}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold cursor-pointer transition-colors shrink-0"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>

              {/* 4 Blocos de Métricas Abertos no Espaço 3D com Profundidades Escalonadas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                
                <div className="spatial-tile p-5 text-left" style={{ transform: 'translateZ(90px) rotateY(6deg)' }}>
                  <span className="text-xs text-slate-400 font-medium block">Total de Vagas</span>
                  <strong className="text-3xl sm:text-4xl font-extrabold text-[#06b6d4] mt-1 block font-mono">
                    {vagas.length || '...'}
                  </strong>
                  <span className="text-xs text-[#10b981] flex items-center gap-1 mt-2 font-medium">
                    <TrendingUp className="w-3.5 h-3.5" /> Amostra Mapeada
                  </span>
                </div>

                <div className="spatial-tile p-5 text-left" style={{ transform: 'translateZ(120px)' }}>
                  <span className="text-xs text-slate-400 font-medium block">Flexibilidade Geográfica</span>
                  <strong className="text-3xl sm:text-4xl font-extrabold text-[#06b6d4] mt-1 block font-mono">
                    {modalidadeStats.flexPct}%
                  </strong>
                  <span className="text-xs text-slate-400 mt-2 block">
                    {modalidadeStats.remoto + modalidadeStats.hibrido} vagas flexíveis
                  </span>
                </div>

                <div className="spatial-tile p-5 text-left" style={{ transform: 'translateZ(120px)' }}>
                  <span className="text-xs text-slate-400 font-medium block">Candidatura Ágil</span>
                  <strong className="text-3xl sm:text-4xl font-extrabold text-[#f59e0b] mt-1 block font-mono">
                    {stats?.easy_apply || vagas.filter(v => v.easy_apply).length}
                  </strong>
                  <span className="text-xs text-slate-400 mt-2 block">
                    Com selo Easy Apply
                  </span>
                </div>

                <div className="spatial-tile p-5 text-left" style={{ transform: 'translateZ(90px) rotateY(-6deg)' }}>
                  <span className="text-xs text-slate-400 font-medium block">Postadas Hoje</span>
                  <strong className="text-3xl sm:text-4xl font-extrabold text-[#10b981] mt-1 block font-mono">
                    {stats?.novas || vagas.filter(v => v.is_nova).length}
                  </strong>
                  <span className="text-xs text-slate-400 mt-2 block">
                    Últimas 24 horas
                  </span>
                </div>

              </div>

              {/* Guia de Scroll */}
              <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium" style={{ transform: 'translateZ(40px)' }}>
                <span>Role para voar até os próximos capítulos e interagir com os gráficos</span>
                <ChevronDown className="w-4 h-4 text-indigo-400 animate-bounce" />
              </div>

            </div>
          </div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 1: MACROINDICADORES                         */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-1" className="spatial-cluster">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Lado Esquerdo: Headline e Diagnóstico */}
              <div className="lg:col-span-5 space-y-4 text-left" style={{ transform: 'translateZ(50px)' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase">
                  Capítulo 01 • Macroindicadores
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Dinâmica & Velocidade
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Os medidores abaixo completam-se progressivamente ao longo do scroll, espelhando a taxa de abertura e conversão do mercado.
                </p>
                <div className="spatial-tile p-4 border-indigo-500/20 bg-indigo-950/20 text-xs text-slate-300">
                  ⚡ <strong>Insight:</strong> Perfis que aplicam nas primeiras 48h possuem taxa de triagem 3.8x superior à média do pipeline de recrutamento.
                </div>
              </div>

              {/* Lado Direito: Trilhas de Progresso 3D */}
              <div className="lg:col-span-7 space-y-4" style={{ transform: 'translateZ(90px)' }}>
                
                <div className="spatial-tile p-6 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-sky-400" /> Flexibilidade de Local (Remoto/Híbrido)
                    </span>
                    <strong id="num-ind-flex" className="text-2xl font-black text-sky-400 font-mono">0%</strong>
                  </div>
                  <div className="scroll-track">
                    <div id="bar-ind-flex" className="scroll-track-fill bg-gradient-to-r from-sky-400 to-indigo-500" style={{ width: '0%' }} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {modalidadeStats.remoto + modalidadeStats.hibrido} vagas flexíveis que eliminam a restrição geográfica.
                  </p>
                </div>

                <div className="spatial-tile p-6 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Candidatura Ágil (Easy Apply)
                    </span>
                    <strong id="num-ind-easy" className="text-2xl font-black text-amber-400 font-mono">0%</strong>
                  </div>
                  <div className="scroll-track">
                    <div id="bar-ind-easy" className="scroll-track-fill bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: '0%' }} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Oportunidades com inscrição sem formulários externos longos, ideal para testes de conversão.
                  </p>
                </div>

                <div className="spatial-tile p-6 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" /> Vagas Postadas Hoje
                    </span>
                    <strong id="num-ind-novas" className="text-2xl font-black text-emerald-400 font-mono">0</strong>
                  </div>
                  <div className="scroll-track">
                    <div id="bar-ind-novas" className="scroll-track-fill bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: '0%' }} />
                  </div>
                  <p className="text-xs text-slate-400">
                    Posições captadas no radar nas últimas 24 horas.
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 2: MODALIDADES (3D Concentric Donut Chart)  */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-2" className="spatial-cluster">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Lado Esquerdo: Detalhamento por Modalidade */}
              <div className="lg:col-span-6 space-y-4 text-left" style={{ transform: 'translateZ(50px)' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-bold uppercase">
                  Capítulo 02 • Modelos de Trabalho
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Remoto, Híbrido ou Presencial
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  O gráfico de anéis 3D ao lado desenha-se progressivamente ao longo do scroll, revelando a concentração real das contratações.
                </p>

                {/* 3 Blocos de Modalidade */}
                <div className="space-y-2.5 pt-2">
                  <div className="spatial-tile p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
                      <span className="text-xs font-bold text-white">100% Remoto</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">{modalidadeStats.remoto} vagas</span>
                      <strong id="num-mod-remoto" className="text-sm font-black text-sky-400 font-mono">0%</strong>
                    </div>
                  </div>

                  <div className="spatial-tile p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-violet-500 shadow-sm shadow-violet-500" />
                      <span className="text-xs font-bold text-white">Modelo Híbrido</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">{modalidadeStats.hibrido} vagas</span>
                      <strong id="num-mod-hibrido" className="text-sm font-black text-violet-400 font-mono">0%</strong>
                    </div>
                  </div>

                  <div className="spatial-tile p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
                      <span className="text-xs font-bold text-white">100% Presencial</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">{modalidadeStats.presencial} vagas</span>
                      <strong id="num-mod-presencial" className="text-sm font-black text-amber-400 font-mono">0%</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Lado Direito: O ESPETACULAR GRÁFICO 3D CONCÊNTRICO */}
              <div className="lg:col-span-6 flex flex-col items-center justify-center relative py-6" style={{ transform: 'translateZ(100px)' }}>
                
                {/* Glow de Fundo e Container com Perspectiva 3D */}
                <div className="spatial-donut-container relative w-[280px] h-[280px] flex items-center justify-center">
                  
                  {/* Halo de Luz Volumétrico */}
                  <div className="spatial-donut-glow" />

                  {/* SVG com os 3 Anéis Concêntricos que se desenham no Scroll */}
                  <svg className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]" viewBox="0 0 200 200">
                    {/* Trilhas de Fundo */}
                    <circle cx="100" cy="100" r="80" className="svg-ring-bg" />
                    <circle cx="100" cy="100" r="64" className="svg-ring-bg" />
                    <circle cx="100" cy="100" r="48" className="svg-ring-bg" />

                    {/* Anel 1: Remoto (Raio 80, C=502.65) */}
                    <circle
                      id="svg-ring-remoto"
                      cx="100"
                      cy="100"
                      r="80"
                      className="svg-ring-fill stroke-sky-400"
                      style={{ strokeDasharray: '502.65', strokeDashoffset: '502.65' }}
                    />

                    {/* Anel 2: Híbrido (Raio 64, C=402.12) */}
                    <circle
                      id="svg-ring-hibrido"
                      cx="100"
                      cy="100"
                      r="64"
                      className="svg-ring-fill stroke-violet-500"
                      style={{ strokeDasharray: '402.12', strokeDashoffset: '402.12' }}
                    />

                    {/* Anel 3: Presencial (Raio 48, C=301.59) */}
                    <circle
                      id="svg-ring-presencial"
                      cx="100"
                      cy="100"
                      r="48"
                      className="svg-ring-fill stroke-amber-400"
                      style={{ strokeDasharray: '301.59', strokeDashoffset: '301.59' }}
                    />
                  </svg>

                  {/* Núcleo Holográfico Central Flutuando acima em Z */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
                    style={{ transform: 'translateZ(45px)' }}
                  >
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                      Flex Total
                    </span>
                    <strong id="donut-center-pct" className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-lg">
                      0%
                    </strong>
                    <span className="text-[10px] text-sky-400 font-semibold">
                      Remoto + Híbrido
                    </span>
                  </div>

                </div>

                {/* Legenda do Gráfico 3D */}
                <div className="flex items-center justify-center gap-5 mt-4 text-xs font-semibold text-slate-300" style={{ transform: 'translateZ(60px)' }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Remoto
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Híbrido
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Presencial
                  </span>
                </div>

              </div>

            </div>
          </div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 3: CANAIS DE CAPTAÇÃO                       */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-3" className="spatial-cluster">
            <div className="w-full space-y-6 text-left">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4" style={{ transform: 'translateZ(50px)' }}>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-bold uppercase mb-2">
                    Capítulo 03 • Canais de Captação
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Onde as Vagas São Publicadas
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                  A concentração de posições em cada ATS (Applicant Tracking System), expandindo com a sua rolagem.
                </p>
              </div>

              {/* Grid 3D de Plataformas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ transform: 'translateZ(80px)' }}>
                {plataformaStats.map((plat) => (
                  <div key={plat.name} className="spatial-tile p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-base text-white flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded-full ${
                          plat.name === 'LinkedIn' ? 'bg-[#0a66c2]' :
                          plat.name === 'Gupy' ? 'bg-pink-500' :
                          plat.name === 'Catho' ? 'bg-orange-500' : 'bg-slate-400'
                        }`} />
                        {plat.name}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <strong id={`num-plat-${plat.name}`} className="text-xl font-black text-indigo-400 font-mono">0%</strong>
                        <span className="text-xs text-slate-400">do total</span>
                      </div>
                    </div>

                    <div className="scroll-track h-2.5">
                      <div
                        id={`bar-plat-${plat.name}`}
                        className={`scroll-track-fill ${
                          plat.name === 'LinkedIn' ? 'bg-[#0a66c2]' :
                          plat.name === 'Gupy' ? 'bg-pink-500' :
                          plat.name === 'Catho' ? 'bg-orange-500' : 'bg-slate-400'
                        }`}
                        style={{ width: '0%' }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                      <span>{plat.total} vagas ativas</span>
                      <span className="text-slate-300 font-medium">Easy Apply: {plat.easyPct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="spatial-tile p-4 border-indigo-500/20 bg-indigo-950/20 text-xs text-slate-300" style={{ transform: 'translateZ(40px)' }}>
                💡 <strong>Dica de ATS:</strong> No LinkedIn, o algoritmo de recomendação prioriza termos exatos presentes na aba de Competências; no Gupy, o ranqueamento é impulsionado pelo fit cultural e testes técnicos.
              </div>

            </div>
          </div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 4: MATRIZ TECNOLÓGICA (Tech Stack Wall)     */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-4" className="spatial-cluster">
            <div className="w-full space-y-6 text-left">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4" style={{ transform: 'translateZ(50px)' }}>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase mb-2">
                    Capítulo 04 • Matriz Tecnológica
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Habilidades Mais Demandadas
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                  Clique em qualquer competência para inspecionar seu peso analítico no radar.
                </p>
              </div>

              {/* Parede 3D de 10 Habilidades */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5" style={{ transform: 'translateZ(80px)' }}>
                {skillsRanking.map((skill) => {
                  const isSelected = selectedTech === skill.name;
                  return (
                    <button
                      key={skill.name}
                      type="button"
                      onClick={() => setSelectedTech(isSelected ? null : skill.name)}
                      className={`spatial-tile p-3.5 text-left transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-600/30 scale-[1.04]'
                          : 'hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white truncate">{skill.name}</span>
                        <span className={`w-2 h-2 rounded-full ${skill.accent}`} />
                      </div>

                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] text-slate-400 font-mono">{skill.count} vagas</span>
                          <strong id={`num-skill-${skill.name}`} className="text-sm font-black text-white font-mono">0%</strong>
                        </div>
                        <div className="scroll-track h-2">
                          <div
                            id={`bar-skill-${skill.name}`}
                            className={`scroll-track-fill bg-gradient-to-r ${skill.color}`}
                            style={{ width: '0%' }}
                          />
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 truncate block">
                        {skill.category}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="spatial-tile p-4 flex items-center gap-3 text-xs sm:text-sm text-slate-300" style={{ transform: 'translateZ(40px)' }}>
                <span className="text-xl shrink-0">🎯</span>
                <div>
                  <strong className="text-white font-bold">A Tríade de Ouro:</strong> A combinação conjunta de <strong className="text-sky-400 font-bold">SQL + Python + Power BI</strong> cobre mais de 65% de todas as posições mapeadas no radar.
                </div>
              </div>

            </div>
          </div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 5: SENIORIDADE                              */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-5" className="spatial-cluster">
            <div className="w-full space-y-8 text-left">
              
              <div className="text-center space-y-2 max-w-2xl mx-auto" style={{ transform: 'translateZ(50px)' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold uppercase">
                  Capítulo 05 • Nível de Maturidade
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  Perfil de Experiência Demandado
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  A maturidade profissional requisitada pelos editais corporativos.
                </p>
              </div>

              {/* 3 Pedestais 3D de Carreira */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Júnior */}
                <div className="spatial-tile p-6 space-y-4" style={{ transform: 'translateZ(70px) rotateY(4deg)' }}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Júnior & Estágio</span>
                    <strong id="num-sen-jr" className="text-2xl font-black text-white font-mono">0%</strong>
                  </div>
                  <div className="scroll-track h-2.5">
                    <div id="bar-sen-jr" className="scroll-track-fill bg-emerald-400" style={{ width: '0%' }} />
                  </div>
                  <div className="text-xs text-slate-300 font-bold font-mono">{senioridadeStats.estagioJr} oportunidades</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Porta de entrada na carreira. Projetos práticos e repositórios no GitHub são o maior divisor de águas na triagem.
                  </p>
                </div>

                {/* Pleno (Destaque Central) */}
                <div className="spatial-tile p-6 space-y-4 border-indigo-500/40 bg-indigo-950/30" style={{ transform: 'translateZ(120px)' }}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Pleno (Maior Volume)</span>
                    <strong id="num-sen-pleno" className="text-2xl font-black text-white font-mono">0%</strong>
                  </div>
                  <div className="scroll-track h-2.5">
                    <div id="bar-sen-pleno" className="scroll-track-fill bg-indigo-500" style={{ width: '0%' }} />
                  </div>
                  <div className="text-xs text-slate-300 font-bold font-mono">{senioridadeStats.pleno} oportunidades</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    O centro gravitacional das contratações corporativas. Exige autonomia em modelagem de dados e impacto no negócio.
                  </p>
                </div>

                {/* Sênior */}
                <div className="spatial-tile p-6 space-y-4" style={{ transform: 'translateZ(70px) rotateY(-4deg)' }}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Sênior & Lead</span>
                    <strong id="num-sen-sr" className="text-2xl font-black text-white font-mono">0%</strong>
                  </div>
                  <div className="scroll-track h-2.5">
                    <div id="bar-sen-sr" className="scroll-track-fill bg-purple-500" style={{ width: '0%' }} />
                  </div>
                  <div className="text-xs text-slate-300 font-bold font-mono">{senioridadeStats.seniorLead} oportunidades</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Liderança técnica, arquitetura de sistemas e governança. Menor volume de inscritos por vaga e salários expressivos.
                  </p>
                </div>

              </div>

            </div>
          </div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 6: EMPRESAS LÍDERES                         */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-6" className="spatial-cluster">
            <div className="w-full space-y-6 text-left">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4" style={{ transform: 'translateZ(50px)' }}>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold uppercase mb-2">
                    Capítulo 06 • Ecossistema Contratante
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                    Organizações Mais Ativas
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                  Empresas líderes que mais concentram posições abertas no momento atual.
                </p>
              </div>

              {/* Grid 3D de Empresas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ transform: 'translateZ(80px)' }}>
                {topEmpresas.map((emp, index) => (
                  <div
                    key={emp.name}
                    className="spatial-tile p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        index === 0 ? 'bg-amber-500 text-white' :
                        index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-white/10 text-slate-300'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="font-bold text-sm text-white truncate block">{emp.name}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0 font-mono">
                      {emp.count}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ═════════════════════════════════════════════════════ */}
          {/* CAPÍTULO 7: PLAYBOOK ESTRATÉGICO & CTA               */}
          {/* ═════════════════════════════════════════════════ */}
          <div id="cluster-7" className="spatial-cluster">
            <div className="w-full space-y-8 text-center">
              
              <div className="space-y-3 max-w-2xl mx-auto" style={{ transform: 'translateZ(50px)' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
                  Capítulo 07 • Plano de Ação
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  Playbook Estratégico de Aprovação
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Diretrizes comprovadas pela análise de dados para reduzir o tempo de contratação.
                </p>
              </div>

              {/* 3 Pilares Estratégicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left" style={{ transform: 'translateZ(70px)' }}>
                <div className="spatial-tile p-6 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-base font-bold text-white">Sincronize Palavras-Chave</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Certifique-se de que SQL, Python, Power BI e Cloud estejam nos títulos, resumos e projetos do seu perfil.
                  </p>
                </div>

                <div className="spatial-tile p-6 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 text-white font-black text-sm flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-base font-bold text-white">Agilidade nas Primeiras 48h</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A triagem por recrutadores humanos é máxima nos dois primeiros dias pós-publicação da vaga.
                  </p>
                </div>

                <div className="spatial-tile p-6 space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
                    3
                  </div>
                  <h4 className="text-base font-bold text-white">Alavanca Remota & Híbrida</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mais de 50% das oportunidades dispensam 100% de presença física. Candidate-se a posições em outros estados.
                  </p>
                </div>
              </div>

              {/* CTA Board Final 3D */}
              <div
                className="spatial-tile p-8 sm:p-10 text-center space-y-5 max-w-2xl mx-auto border-indigo-500/40 bg-gradient-to-b from-indigo-950/60 to-slate-950/90 shadow-2xl"
                style={{ transform: 'translateZ(110px)' }}
              >
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Pronto para encontrar sua próxima vaga?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                    Explore todas as oportunidades com filtros avançados por tecnologia, modalidade e plataforma.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    href="/"
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/35 hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <span>Explorar Vagas no Radar Agora</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => scrollToChapter(0)}
                    className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    ↑ Voltar ao Início
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════ */}
      {/* 4. ESTEIRA VIRTUAL DE SCROLL NATIVO/LENIS                 */}
      {/* Fornece o espaço físico de rolagem para conduzir a câmera */}
      {/* ═════════════════════════════════════════════════════════ */}
      <div
        style={{ height: `${totalVirtualHeight}px` }}
        className="relative pointer-events-none w-full"
        aria-hidden="true"
      />

    </div>
  );
}
