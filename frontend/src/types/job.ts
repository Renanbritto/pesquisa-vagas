export interface Vaga {
  id: string;
  titulo: string;
  empresa: string;
  localizacao: string;
  link: string;
  modalidade: string;
  easy_apply: boolean | number;
  plataforma: string;
  data_coleta?: string;
  data_postagem?: string;
  termo_busca?: string;
  is_nova?: boolean;
  _timestamp?: number;
}

export interface Estatisticas {
  total: number;
  remotas: number;
  hibridas: number;
  presenciais: number;
  easy_apply: number;
  novas: number;
}

export type QuickFilterType = 'total' | 'novas' | 'remoto' | 'hibrido' | 'presencial' | null;

export type UserViewTab = 'todas' | 'salvas' | 'candidatadas' | 'ocultadas';
