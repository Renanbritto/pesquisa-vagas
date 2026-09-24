import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEYS = {
  SAVED: 'pesquisa_vagas_saved_ids',
  APPLIED: 'pesquisa_vagas_applied_ids',
  HIDDEN: 'pesquisa_vagas_hidden_ids',
};

export function useUserInteractions() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEYS.SAVED);
      const appliedRaw = localStorage.getItem(STORAGE_KEYS.APPLIED);
      const hiddenRaw = localStorage.getItem(STORAGE_KEYS.HIDDEN);

      if (savedRaw) setSavedIds(new Set(JSON.parse(savedRaw)));
      if (appliedRaw) setAppliedIds(new Set(JSON.parse(appliedRaw)));
      if (hiddenRaw) setHiddenIds(new Set(JSON.parse(hiddenRaw)));
    } catch (e) {
      console.error('Erro ao ler preferencias locais:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const toggleApplied = useCallback((id: string) => {
    setAppliedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(STORAGE_KEYS.APPLIED, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const toggleHide = useCallback((id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(STORAGE_KEYS.HIDDEN, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const unhideAll = useCallback(() => {
    setHiddenIds(new Set());
    localStorage.removeItem(STORAGE_KEYS.HIDDEN);
  }, []);

  return {
    savedIds,
    appliedIds,
    hiddenIds,
    isLoaded,
    toggleSave,
    toggleApplied,
    toggleHide,
    unhideAll,
    isSaved: (id: string) => savedIds.has(id),
    isApplied: (id: string) => appliedIds.has(id),
    isHidden: (id: string) => hiddenIds.has(id),
  };
}
