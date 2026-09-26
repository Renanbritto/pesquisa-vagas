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

            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px] xs:max-w-xs sm:max-w-none">
              {activePage === 'vagas' 
                ? 'Radar de oportunidades em Dados e Tecnologia' 
                : 'Raio-X analítico e tendências do mercado'}
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

          {/* Redes Sociais no Desktop */}
          <a
            href="https://www.linkedin.com/in/renan-britto-7b3728212/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex group p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0a66c2] dark:text-[#60a5fa] transition-all shadow-xs cursor-pointer hover:scale-105 items-center justify-center"
            title="LinkedIn de Renan Nocelli"
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
            className="hidden md:flex group p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all shadow-xs cursor-pointer hover:scale-105 items-center justify-center"
            title="GitHub de Renan Nocelli"
            aria-label="GitHub"
          >
            <svg
              className="w-4 h-4 fill-current transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
            >
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
          </a>

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
