'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export interface TelegramLinkInfo {
  status: 'sem_bot' | 'pendente' | 'ativo' | 'pausado' | 'bloqueado' | 'espera';
  username?: string;
  chat_id?: number;
  token_expira_em?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramLink, setTelegramLink] = useState<TelegramLinkInfo | null>(null);

  const fetchBotStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabaseBrowser
        .from('telegram_links')
        .select('status, username, chat_id, token_expira_em')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setTelegramLink(data as TelegramLinkInfo);
      } else {
        setTelegramLink({ status: 'sem_bot' });
      }
    } catch (err) {
      console.error('[useAuth] Erro ao buscar status do bot:', err);
    }
  }, []);

  useEffect(() => {
    // 1. Obtém a sessão inicial
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchBotStatus(session.user.id);
      }
      setLoading(false);
    });

    // 2. Escuta mudanças na autenticação
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchBotStatus(session.user.id);
        } else {
          setTelegramLink(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBotStatus]);

  const loginWithEmail = async (email: string) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '');
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: siteUrl,
      },
    });
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '');
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: siteUrl,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabaseBrowser.auth.signOut();
    setUser(null);
    setTelegramLink(null);
  };

  return {
    user,
    loading,
    telegramLink,
    loginWithEmail,
    loginWithGoogle,
    logout,
    refreshBotStatus: () => user && fetchBotStatus(user.id),
  };
}
