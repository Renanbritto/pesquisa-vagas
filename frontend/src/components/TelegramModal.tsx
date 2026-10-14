'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  ExternalLink,
  Mail,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferenciasSalvas?: () => void;
  initialStep?: 'filtros' | 'auth';
}

const PALAVRAS_SUGERIDAS = ['Power BI', 'Python', 'SQL', 'Analista de Dados', 'Excel', 'Engenheiro de Dados'];
const CIDADES_SUGERIDAS = [
  { nome: 'Qualquer Cidade', slug: 'qualquer' },
  { nome: 'São Paulo', slug: 'sao-paulo' },
  { nome: 'Rio de Janeiro', slug: 'rio-de-janeiro' },
  { nome: 'Juiz de Fora', slug: 'juiz-de-fora' },
  { nome: 'Florianópolis', slug: 'florianopolis' },
  { nome: 'Belo Horizonte', slug: 'belo-horizonte' },
  { nome: 'Curitiba', slug: 'curitiba' }
];

export function TelegramModal({ isOpen, onClose, onPreferenciasSalvas, initialStep = 'filtros' }: TelegramModalProps) {
  const { user, loginWithEmail, loginWithGoogle } = useAuth();

  // Filtros Selecionados
  const [palavras, setPalavras] = useState<string[]>(['Power BI', 'Python', 'Analista de Dados']);
  const [palavrasExcluidas, setPalavrasExcluidas] = useState<string[]>([]);
  const [inputPalavra, setInputPalavra] = useState('');
  const [senioridades, setSenioridades] = useState<string[]>(['junior', 'pleno']);
  const [modalidades, setModalidades] = useState<string[]>(['remoto', 'hibrido', 'presencial']);
  const [cidades, setCidades] = useState<string[]>(['qualquer']);
  const [inputCidade, setInputCidade] = useState('');
  const [cidadesCustom, setCidadesCustom] = useState<{ nome: string; slug: string }[]>([]);
  const [apenasEasyApply, setApenasEasyApply] = useState(false);

  // Estados de Fluxo
  const [passo, setPasso] = useState<'filtros' | 'auth' | 'link' | 'espera'>(initialStep);
  const [emailInput, setEmailInput] = useState('');
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Retorno do Bot
  const [linkTelegram, setLinkTelegram] = useState<string | null>(null);
  const [posicaoFila, setPosicaoFila] = useState<number | null>(null);

  // Carrega preferências existentes se o usuário já estiver logado
  useEffect(() => {
    if (!isOpen) return;

    setErro(null);
    setLinkTelegram(null);
    setEmailEnviado(false);
    setPasso(initialStep);

    async function carregarPreferenciasUsuario() {
      if (!user) return;
      try {
        const { data, error } = await supabaseBrowser
          .from('preferencias')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          if (data.palavras_incluidas?.length) setPalavras(data.palavras_incluidas);
          if (data.palavras_excluidas?.length) setPalavrasExcluidas(data.palavras_excluidas);
          if (data.cidades_slug && data.cidades_slug.length > 0) {
            setCidades(data.cidades_slug);
            const slugsPadrao = new Set(CIDADES_SUGERIDAS.map((c) => c.slug));
            const custom = data.cidades_slug
              .filter((s: string) => !slugsPadrao.has(s) && s !== 'qualquer')
              .map((s: string) => ({
                nome: s.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                slug: s,
              }));
            if (custom.length) setCidadesCustom(custom);
          } else {
            setCidades(['qualquer']);
          }
          if (data.modalidades?.length) setModalidades(data.modalidades);
          if (data.senioridades?.length) setSenioridades(data.senioridades);
          setApenasEasyApply(Boolean(data.apenas_easy_apply));
        }
      } catch (err) {
        console.error('Erro ao carregar preferências:', err);
      }
    }

    carregarPreferenciasUsuario();
  }, [isOpen, user]);

  // Handlers de Filtros
  const togglePalavra = (p: string) => {
    if (palavras.includes(p)) {
      if (palavras.length > 1) setPalavras(palavras.filter((item) => item !== p));
    } else {
      if (palavras.length < 10) setPalavras([...palavras, p]);
    }
  };

  const adicionarPalavraCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPalavra.trim() && !palavras.includes(inputPalavra.trim()) && palavras.length < 10) {
      setPalavras([...palavras, inputPalavra.trim()]);
      setInputPalavra('');
    }
  };

  const toggleSenioridade = (s: string) => {
    if (senioridades.includes(s)) {
      setSenioridades(senioridades.filter((item) => item !== s));
    } else {
      setSenioridades([...senioridades, s]);
    }
  };

  const toggleModalidade = (m: string) => {
    if (modalidades.includes(m)) {
      setModalidades(modalidades.filter((item) => item !== m));
    } else {
      setModalidades([...modalidades, m]);
    }
  };

  const toggleCidade = (c: string) => {
    if (c === 'qualquer') {
      setCidades(['qualquer']);
      return;
    }

    const semQualquer = cidades.filter((item) => item !== 'qualquer');
    if (semQualquer.includes(c)) {
      const rest = semQualquer.filter((item) => item !== c);
      setCidades(rest.length === 0 ? ['qualquer'] : rest);
    } else {
      if (semQualquer.length < 10) {
        setCidades([...semQualquer, c]);
      }
    }
  };

  const adicionarCidadeCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = inputCidade.trim();
    if (!nomeLimpo) return;

    const slug = nomeLimpo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) return;

    if (!CIDADES_SUGERIDAS.some((c) => c.slug === slug) && !cidadesCustom.some((c) => c.slug === slug)) {
      setCidadesCustom((prev) => [...prev, { nome: nomeLimpo, slug }]);
    }

    const semQualquer = cidades.filter((item) => item !== 'qualquer');
    if (!semQualquer.includes(slug) && semQualquer.length < 10) {
      setCidades([...semQualquer, slug]);
    }
    setInputCidade('');
  };

  // Salva preferências e pede slot do bot (executado quando o usuário está logado)
  const executarSalvarESolicitarBot = async () => {
    setEnviando(true);
    setErro(null);

    try {
      // Se 'qualquer' estiver selecionado, envia array vazio para dar match em todas as cidades no SQL
      const cidadesParaSalvar = cidades.includes('qualquer') || cidades.length === 0 ? [] : cidades;

      // 1. Salva preferências e gera backfill
      const { data: resPref, error: errPref } = await supabaseBrowser.rpc('fn_salvar_preferencias', {
        p_palavras_incluidas: palavras,
        p_palavras_excluidas: palavrasExcluidas,
        p_cidades_slug: cidadesParaSalvar,
        p_modalidades: modalidades,
        p_senioridades: senioridades,
        p_apenas_easy_apply: apenasEasyApply,
      });

      if (errPref || !resPref?.sucesso) {
        setErro(resPref?.erro || 'Erro ao salvar preferências.');
        setEnviando(false);
        return;
      }

      // Notifica o componente pai para recarregar o Meu Radar
      if (onPreferenciasSalvas) onPreferenciasSalvas();

      // 2. Solicita slot do bot (RPC atômica no servidor)
      const { data: resBot, error: errBot } = await supabaseBrowser.rpc('fn_solicitar_bot');

      if (errBot || !resBot?.sucesso) {
        setErro(resBot?.erro || 'Erro ao solicitar conexão com o bot.');
        setEnviando(false);
        return;
      }

      if (resBot.status_bot === 'pendente') {
        const botUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'pesquisa_vagas_dados_bot';
        setLinkTelegram(`https://t.me/${botUser}?start=${resBot.token}`);
        setPasso('link');
      } else if (resBot.status_bot === 'espera') {
        setPosicaoFila(resBot.posicao_fila || 1);
        setPasso('espera');
      } else if (resBot.status_bot === 'ativo') {
        // Já está ativo
        setPasso('link');
      }
    } catch (err: any) {
      console.error('Erro geral ao processar:', err);
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  // Clique no botão principal do passo de filtros
  const handleAvancarFiltros = () => {
    if (user) {
      // Já está logado: salva direto
      executarSalvarESolicitarBot();
    } else {
      // Precisa autenticar primeiro
      setPasso('auth');
    }
  };

  // Autenticação com Magic Link
  const handleLoginEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setEnviando(true);
    setErro(null);

    try {
      await loginWithEmail(emailInput.trim());
      setEmailEnviado(true);
    } catch (err: any) {
      setErro(err.message || 'Falha ao enviar link de acesso. Verifique seu e-mail.');
    } finally {
      setEnviando(false);
    }
  };

  // Se o usuário autenticar enquanto o modal estiver aberto no passo de autenticação
  useEffect(() => {
    if (!isOpen || !user || passo !== 'auth') return;

    if (initialStep === 'auth') {
      if (onPreferenciasSalvas) onPreferenciasSalvas();
      onClose();
    } else {
      executarSalvarESolicitarBot();
    }
  }, [user, isOpen, passo, initialStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#090d16]/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0b0f1a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-5 sm:p-7 text-slate-100">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/25 shrink-0">
            {passo === 'auth' && initialStep === 'auth' ? (
              <UserIcon className="w-5 h-5 text-[#06b6d4]" />
            ) : (
              <Send className="w-5 h-5 -rotate-12" />
            )}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold tracking-tight text-white">
              {passo === 'auth' 
                ? (initialStep === 'auth' ? 'Acesse sua Conta' : 'Acesse para Salvar seu Radar') 
                : 'Configurar Alertas & Meu Radar'}
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              {passo === 'auth' && initialStep === 'auth'
                ? 'Entre para carregar seu Meu Radar personalizado e gerenciar suas notificações.'
                : 'Receba no Telegram e veja no feed do site exatamente as vagas que você quer.'}
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PASSO 1: CONFIGURAÇÃO DE FILTROS                          */}
        {/* ========================================================= */}
        {passo === 'filtros' && (
          <div className="space-y-4">
            {/* 1. Senioridade */}
            <div>
              <label className="block text-xs font-heading font-bold text-slate-300 mb-1.5">
                1. Nível de Senioridade
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'estagio', label: 'Estágio' },
                  { id: 'junior', label: 'Júnior' },
                  { id: 'pleno', label: 'Pleno' },
                ].map((s) => {
                  const sel = senioridades.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSenioridade(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all border cursor-pointer ${
                        sel
                          ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/50 shadow-sm'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Modalidade */}
            <div>
              <label className="block text-xs font-heading font-bold text-slate-300 mb-1.5">
                2. Modelo de Trabalho
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'remoto', label: '🏠 Remoto' },
                  { id: 'hibrido', label: '🏢🔄 Híbrido' },
                  { id: 'presencial', label: '🏢 Presencial' },
                ].map((m) => {
                  const sel = modalidades.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModalidade(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all border cursor-pointer ${
                        sel
                          ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/50 shadow-sm'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Cidades */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-heading font-bold text-slate-300">
                  3. Cidades Foco (Híbrido e Presencial)
                </label>
                {(cidades.includes('qualquer') || cidades.length === 0) && (
                  <span className="text-[10px] text-[#06b6d4] font-medium font-sans">
                    Sem restrição geográfica
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[...CIDADES_SUGERIDAS, ...cidadesCustom].map((c) => {
                  const sel = c.slug === 'qualquer'
                    ? (cidades.includes('qualquer') || cidades.length === 0)
                    : cidades.includes(c.slug);
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => toggleCidade(c.slug)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-medium transition-all border cursor-pointer ${
                        sel
                          ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/50 shadow-sm'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {c.slug === 'qualquer' && <span className="mr-1">🌐</span>}
                      {c.nome}
                    </button>
                  );
                })}
              </div>

              {/* Inserir cidade customizada */}
              <form onSubmit={adicionarCidadeCustom} className="flex gap-2">
                <input
                  type="text"
                  value={inputCidade}
                  onChange={(e) => setInputCidade(e.target.value)}
                  placeholder="Adicionar outra cidade (ex: Campinas, Brasília)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-white/[0.04] focus:outline-none focus:border-[#06b6d4]/50 text-slate-100 placeholder-slate-500 font-sans"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl text-xs font-heading font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 cursor-pointer"
                >
                  Adicionar
                </button>
              </form>
            </div>

            {/* 4. Palavras-chave */}
            <div>
              <label className="block text-xs font-heading font-bold text-slate-300 mb-1.5">
                4. Palavras-chave Incluídas (1 a 10)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PALAVRAS_SUGERIDAS.map((p) => {
                  const sel = palavras.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePalavra(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-medium transition-all border cursor-pointer ${
                        sel
                          ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/50 shadow-sm'
                          : 'bg-white/[0.04] text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Inserir palavra custom */}
              <form onSubmit={adicionarPalavraCustom} className="flex gap-2">
                <input
                  type="text"
                  value={inputPalavra}
                  onChange={(e) => setInputPalavra(e.target.value)}
                  placeholder="Adicionar outra (ex: Tableau, AWS, dbt)..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-white/10 bg-white/[0.04] focus:outline-none focus:border-[#06b6d4]/50 text-slate-100"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl text-xs font-heading font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 cursor-pointer"
                >
                  Adicionar
                </button>
              </form>
            </div>

            {/* 5. Apenas Easy Apply Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-xs font-heading font-medium text-slate-300">
                Apenas Candidatura Simplificada (Easy Apply)
              </span>
              <button
                type="button"
                onClick={() => setApenasEasyApply(!apenasEasyApply)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  apenasEasyApply ? 'bg-[#10b981]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    apenasEasyApply ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {erro && (
              <p className="text-xs text-[#f43f5e] flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {erro}
              </p>
            )}

            {/* Botão de Avanço */}
            <button
              type="button"
              disabled={enviando || palavras.length === 0}
              onClick={handleAvancarFiltros}
              className="w-full py-3.5 px-6 rounded-2xl font-heading font-bold text-slate-950 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {enviando ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{user ? 'Salvar Filtros e Conectar Bot' : 'Continuar para Conectar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 2: AUTENTICAÇÃO SEM SENHA (MAGIC LINK / GOOGLE)     */}
        {/* ========================================================= */}
        {passo === 'auth' && (
          <div className="space-y-5 py-2">
            {emailEnviado ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-white">
                  Confira seu e-mail!
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Enviamos um link mágico de acesso para <b className="text-white font-mono">{emailInput}</b>. Basta clicar nele para entrar na hora, salvar seu Radar e ativar o bot!
                </p>
                <button
                  type="button"
                  onClick={() => setEmailEnviado(false)}
                  className="text-xs font-heading font-semibold text-[#06b6d4] hover:underline cursor-pointer"
                >
                  Tentar com outro e-mail
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {initialStep === 'auth' ? (
                    <>Faça login com sua conta Google ou e-mail para acessar seu feed <b className="text-white">Meu Radar</b> sincronizado e gerenciar seus alertas:</>
                  ) : (
                    <>Crie sua conta ou faça login em 1 clique para salvar suas preferências e acessar seu feed <b className="text-white">Meu Radar</b> sincronizado:</>
                  )}
                </p>

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full py-3 px-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] font-heading font-semibold text-xs text-white flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Entrar com Google</span>
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] text-slate-500 font-sans">ou via Magic Link</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Magic Link Form */}
                <form onSubmit={handleLoginEmail} className="space-y-3">
                  <div>
                    <label className="block text-xs font-heading font-semibold mb-1 text-slate-300">
                      Seu E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-white/10 bg-white/[0.04] focus:outline-none focus:border-[#06b6d4]/50 text-slate-100 placeholder-slate-500 font-sans"
                    />
                  </div>

                  {erro && (
                    <p className="text-xs text-[#f43f5e] flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {erro}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full py-3 rounded-2xl font-heading font-bold text-slate-950 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all text-xs disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    {enviando ? 'Enviando link...' : 'Enviar Link Mágico por E-mail'}
                  </button>
                </form>

                {initialStep === 'auth' ? (
                  <button
                    type="button"
                    onClick={() => setPasso('filtros')}
                    className="w-full text-center text-xs text-[#06b6d4] hover:underline transition-colors pt-1 cursor-pointer font-sans"
                  >
                    Novo por aqui? Criar conta e configurar filtros do Radar →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPasso('filtros')}
                    className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors pt-1 cursor-pointer font-sans"
                  >
                    ← Voltar para editar filtros
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 3: LINK DO TELEGRAM GERADO COM SUCESSO              */}
        {/* ========================================================= */}
        {passo === 'link' && (
          <div className="space-y-5 py-3 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-heading font-bold text-white">
                Filtros Salvos & Meu Radar Ativado!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-sans">
                Agora basta 1 clique para ativar as notificações no seu celular. Abra a conversa com o robô e aperte <b className="text-white">Iniciar</b> (Start):
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-400 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-[#f59e0b] shrink-0" />
              <span>Esse token expira em 15 minutos para liberar a vaga caso não seja iniciado.</span>
            </div>

            {linkTelegram && (
              <a
                href={linkTelegram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-2xl font-heading font-bold text-slate-950 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-[1.01] shadow-lg shadow-cyan-500/25 text-sm sm:text-base cursor-pointer"
              >
                <span>Abrir no Telegram e Iniciar</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 4: FILA DE ESPERA DO TELEGRAM                       */}
        {/* ========================================================= */}
        {passo === 'espera' && (
          <div className="space-y-5 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#f59e0b] flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-heading font-bold text-white">
                Seu Radar no Site Está Ativo!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed font-sans">
                As 10 vagas de envio instantâneo no Telegram estão ocupadas no momento. Você está na <b className="text-[#f59e0b] font-mono">posição #{posicaoFila}</b> da fila prioritária!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-xs text-cyan-300 text-left space-y-1 font-sans">
              <p className="font-heading font-bold text-white">💡 O que acontece agora:</p>
              <p>• Suas vagas já aparecem filtradas na aba <b className="text-cyan-200">🎯 Meu Radar</b> aqui no site.</p>
              <p>• Assim que uma vaga no Telegram liberar, seu acesso será ativado com prioridade!</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-heading font-bold text-slate-950 bg-white hover:bg-slate-200 transition-all text-xs cursor-pointer"
            >
              Ir para o Meu Radar no Site
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
