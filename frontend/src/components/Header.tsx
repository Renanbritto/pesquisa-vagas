'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sun, Moon, Layers, BarChart3, Sparkles, Send, LogOut, User as UserIcon } from "lucide-react";
import { TelegramModal } from "./TelegramModal";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  activePage: 'vagas' | 'dashboard';
  isTelegramOpen?: boolean;
  setIsTelegramOpen?: (open: boolean) => void;
  onPreferenciasSalvas?: () => void;
}

export function Header({ 
  activePage, 
  isTelegramOpen: externalIsOpen, 
  setIsTelegramOpen: externalSetIsOpen,
  onPreferenciasSalvas 
}: HeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isTelegramOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsTelegramOpen = externalSetIsOpen !== undefined ? externalSetIsOpen : setInternalIsOpen;
  const { user, telegramLink, logout } = useAuth();

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
    <header className="pb-3 sm:pb-5 border-b border-white/10 space-y-2.5 sm:space-y-0">
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
                <h1 className="text-base sm:text-xl md:text-2xl font-black font-heading tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                  Pesquisa Vagas
                </h1>
              </Link>

              {/* Badges contextuais: 'On' no radar de vagas e 'Radar Analytics' no dashboard */}
              {activePage === 'vagas' ? (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-semibold tracking-wide shrink-0">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]"></span>
                  </span>
                  <span>On</span>
                </div>
              ) : (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#06b6d4]/15 border border-[#06b6d4]/30 text-[#06b6d4] text-[10px] font-semibold tracking-wide shrink-0">
                  <Sparkles className="w-3 h-3 text-[#06b6d4]" />
                  <span>Radar Analytics</span>
                </div>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-400 font-medium font-heading">
              {activePage === 'vagas' 
                ? 'Radar de oportunidades' 
                : 'Raio-x do mercado'}
            </p>
          </div>
        </div>

        {/* Ações à direita */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Navegação Desktop (Pills integradas) */}
          <nav className="hidden sm:flex items-center bg-[#0b0f1a]/95 backdrop-blur-2xl p-1 rounded-2xl border border-white/10 text-xs font-semibold shadow-lg">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activePage === 'vagas'
                  ? 'bg-white/10 border border-white/15 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#06b6d4]" />
              <span className="font-heading">Explorar Vagas</span>
            </Link>
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activePage === 'dashboard'
                  ? 'bg-white/10 border border-white/15 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#06b6d4]" />
              <span className="font-heading">Dashboard</span>
            </Link>
          </nav>

          {/* Ações do Bot do Telegram / Perfil */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsTelegramOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  telegramLink?.status === 'ativo'
                    ? 'bg-[#10b981]/15 border-[#10b981]/30 text-[#10b981]'
                    : telegramLink?.status === 'espera'
                    ? 'bg-[#f59e0b]/15 border-[#f59e0b]/30 text-[#f59e0b]'
                    : 'bg-[#06b6d4]/15 border-[#06b6d4]/30 text-[#06b6d4]'
                }`}
                title="Configurar preferências do Meu Radar e do Bot"
              >
                <svg
                  className="w-3.5 h-3.5 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
                </svg>
                <span className="font-heading">
                  {telegramLink?.status === 'ativo'
                    ? 'Bot Ativo'
                    : telegramLink?.status === 'espera'
                    ? 'Fila VIP'
                    : 'Conectar Bot'}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    telegramLink?.status === 'ativo'
                      ? 'bg-[#10b981] animate-pulse'
                      : telegramLink?.status === 'espera'
                      ? 'bg-[#f59e0b]'
                      : 'bg-[#06b6d4]'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-2 sm:p-2.5 rounded-2xl border border-white/10 bg-[#0b0f1a]/95 text-slate-400 hover:text-[#f43f5e] hover:border-[#f43f5e]/30 transition-colors cursor-pointer"
                title="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsTelegramOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-100 transition-all cursor-pointer font-semibold text-xs shadow-md group shrink-0"
              title="Ativar Bot de Vagas no Telegram (Beta VIP)"
            >
              <svg
                className="w-3.5 h-3.5 fill-[#06b6d4] transition-transform group-hover:scale-110 shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
              </svg>
              <span className="font-heading font-bold tracking-tight text-slate-100">Ativar Bot</span>
            </button>
          )}

          {/* Alternador de Tema (Modo Claro / Escuro) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-2xl border border-white/10 bg-[#0b0f1a]/95 backdrop-blur-2xl hover:bg-white/[0.06] text-slate-300 transition-all cursor-pointer shadow-sm shrink-0"
            title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#f59e0b] hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-[#06b6d4] hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Navegação Mobile Segmentada: 100% de largura, toque perfeito, sem cortes nem sobreposições */}
      <div className="sm:hidden pt-1">
        <nav className="grid grid-cols-2 p-1 bg-[#0b0f1a]/95 backdrop-blur-2xl rounded-2xl border border-white/10 text-xs font-semibold shadow-lg">
          <Link
            href="/"
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
              activePage === 'vagas'
                ? 'bg-white/10 text-white border border-white/15 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-[#06b6d4]" />
            <span className="font-heading">Vagas</span>
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
              activePage === 'dashboard'
                ? 'bg-white/10 text-white border border-white/15 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#06b6d4]" />
            <span className="font-heading">Dashboard</span>
          </Link>
        </nav>
      </div>

      {/* Modal de Configuração e Inscrição de Alertas do Telegram */}
      <TelegramModal 
        isOpen={isTelegramOpen} 
        onClose={() => setIsTelegramOpen(false)} 
        onPreferenciasSalvas={onPreferenciasSalvas}
      />
    </header>
  );
}
