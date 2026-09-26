'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sun, Moon, Layers, BarChart3, Sparkles } from "lucide-react";

interface HeaderProps {
  activePage: 'vagas' | 'dashboard';
}

export function Header({ activePage }: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Sincronização do tema com o localStorage e o documento HTML
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

  return (
    <header className="pb-3 sm:pb-5 border-b border-slate-200/80 dark:border-slate-800/80 space-y-2.5 sm:space-y-0">
      {/* Linha Principal: Brand (Logo + Nome) à esquerda, Ações à direita */}
      <div className="flex items-center justify-between gap-3">
        {/* Identidade Visual: Logo e Titulo (Nunca trunca no mobile) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Link 
            href="/" 
            className="relative group cursor-pointer transition-transform hover:scale-[1.03] shrink-0"
            title="Ir para Início"
          >
            <Image 
              src="/logo.webp" 
              alt="Logo Radar" 
              width={48}
              height={48}
              priority
              sizes="48px"
              className="h-9 w-9 sm:h-11 sm:w-11 object-contain drop-shadow-md"
            />
          </Link>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <Link href="/">
                <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                  Pesquisa Vagas
                </h1>
              </Link>

              {/* Badges contextuais: exibidos apenas a partir de sm: para evitar aperto no mobile */}
              {activePage === 'vagas' ? (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold tracking-wide shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Ao vivo</span>
                </div>
              ) : (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/25 text-violet-700 dark:text-violet-400 text-[10px] font-semibold tracking-wide shrink-0">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  <span>Radar Analytics</span>
                </div>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              {activePage === 'vagas' 
                ? 'Radar de oportunidades' 
                : 'Raio-x do mercado'}
            </p>
          </div>
        </div>

        {/* Ações à direita */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Navegação Desktop (Pills integradas) */}
          <nav className="hidden sm:flex items-center bg-slate-200/60 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePage === 'vagas'
                  ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explorar Vagas</span>
            </Link>
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePage === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </nav>

          {/* Alternador de Tema (Modo Claro / Escuro) */}
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
      </div>

      {/* Navegação Mobile Segmentada: 100% de largura, toque perfeito, sem cortes nem sobreposições */}
      <div className="sm:hidden pt-1">
        <nav className="grid grid-cols-2 p-1 bg-slate-200/70 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
          <Link
            href="/"
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activePage === 'vagas'
                ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Vagas</span>
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              activePage === 'dashboard'
                ? 'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Dashboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
