'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { Vaga } from '@/types/job';

export interface MatchItem {
  id: number;
  vaga_id: string;
  matched_at: string;
  visto_em: string | null;
  vaga: Vaga;
}

export function useMeuRadar(userId: string | undefined) {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [novasContador, setNovasContador] = useState(0);

  const fetchMatches = useCallback(async () => {
    if (!userId) {
      setMatches([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabaseBrowser
        .from('matches')
        .select(`
          id,
          vaga_id,
          matched_at,
          visto_em,
          vagas (
            id,
            titulo,
            empresa,
            localizacao,
            link,
            data_postagem,
            termo_busca,
            modalidade,
            easy_apply,
            categoria,
            plataforma,
            data_coleta
          )
        `)
        .order('matched_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const formatados: MatchItem[] = data
          .filter((item: any) => item.vagas)
          .map((item: any) => ({
            id: item.id,
            vaga_id: item.vaga_id,
            matched_at: item.matched_at,
            visto_em: item.visto_em,
            vaga: item.vagas as Vaga,
          }));

        setMatches(formatados);
        const naoVistas = formatados.filter((m) => !m.visto_em).length;
        setNovasContador(naoVistas);
      }
    } catch (err) {
      console.error('[useMeuRadar] Erro ao carregar matches:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Marca match como visualizado
  const marcarComoVisto = async (matchId: number) => {
    try {
      await supabaseBrowser
        .from('matches')
        .update({ visto_em: new Date().toISOString() })
        .eq('id', matchId);

      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, visto_em: new Date().toISOString() } : m))
      );
      setNovasContador((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useMeuRadar] Erro ao marcar como visto:', err);
    }
  };

  useEffect(() => {
    fetchMatches();

    if (!userId) return;

    // Subscreve no Realtime do Supabase para novas vagas no Radar
    const channel = supabaseBrowser
      .channel(`radar-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [userId, fetchMatches]);

  return {
    matches,
    loading,
    novasContador,
    marcarComoVisto,
    recarregarMatches: fetchMatches,
  };
}
