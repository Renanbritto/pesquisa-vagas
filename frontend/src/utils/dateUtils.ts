// Utilitarios de manipulacao e formatacao temporal padronizada

/**
 * Converte datas relativas (ex: "Ha 13 minutos", "Ha 2 horas", "3 dias") 
 * e formatos ISO em timestamp numerico para ordenacao cronologica precisa.
 */
export function parseDataPostagemTimestamp(dataPostagem?: string, dataColeta?: string): number {
  const baseTime = dataColeta ? new Date(dataColeta).getTime() : Date.now();
  if (!dataPostagem || dataPostagem.trim() === "") {
    return baseTime;
  }

  // Formato ISO ou YYYY-MM-DD
  if (dataPostagem.includes("T") || (dataPostagem.includes("-") && dataPostagem.length >= 10)) {
    const timestamp = new Date(dataPostagem).getTime();
    if (!isNaN(timestamp)) return timestamp;
  }

  const s = dataPostagem.toLowerCase();
  const minMatch = s.match(/(\d+)\s*(?:minuto|min)/);
  if (minMatch) return baseTime - parseInt(minMatch[1], 10) * 60 * 1000;

  const horaMatch = s.match(/(\d+)\s*(?:hora|hour|h\b)/);
  if (horaMatch) return baseTime - parseInt(horaMatch[1], 10) * 3600 * 1000;

  const diaMatch = s.match(/(\d+)\s*(?:dia|day)/);
  if (diaMatch) return baseTime - parseInt(diaMatch[1], 10) * 24 * 3600 * 1000;

  const semMatch = s.match(/(\d+)\s*(?:semana|week)/);
  if (semMatch) return baseTime - parseInt(semMatch[1], 10) * 7 * 24 * 3600 * 1000;

  const mesMatch = s.match(/(\d+)\s*(?:m[eêé]s(?:es)?|months?)/);
  if (mesMatch) return baseTime - parseInt(mesMatch[1], 10) * 30 * 24 * 3600 * 1000;

  const anoMatch = s.match(/(\d+)\s*(?:ano|year)/);
  if (anoMatch) return baseTime - parseInt(anoMatch[1], 10) * 365 * 24 * 3600 * 1000;

  return baseTime;
}

/**
 * Formata para tempo relativo amigavel (ex.: "Ha 12 min", "Ha 3 horas", "Ontem", "Ha 2 dias").
 */
export function formatRelativeTime(dataPostagem?: string, dataColeta?: string, precalculatedTimestamp?: number): string {
  if (!dataPostagem && !dataColeta && !precalculatedTimestamp) return "Recente";

  const timestamp = precalculatedTimestamp ?? parseDataPostagemTimestamp(dataPostagem, dataColeta);
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) {
    return "Agora mesmo";
  }
  if (diffMin < 60) {
    return `Há ${diffMin} min`;
  }
  if (diffHoras === 1) {
    return "Há 1 hora";
  }
  if (diffHoras < 24) {
    return `Há ${diffHoras} horas`;
  }
  if (diffDias === 1) {
    return "Ontem";
  }
  if (diffDias < 7) {
    return `Há ${diffDias} dias`;
  }
  const diffSemanas = Math.floor(diffDias / 7);
  if (diffSemanas < 4) {
    return diffSemanas === 1 ? "Há 1 semana" : `Há ${diffSemanas} semanas`;
  }
  const diffMeses = Math.floor(diffDias / 30);
  return diffMeses <= 1 ? "Há 1 mês" : `Há ${diffMeses} meses`;
}

/**
 * Formata para data e hora completa legivel para tooltips nativos (title).
 * Ex: "Publicado em 23/09/2026 as 15:30"
 */
export function formatFullDateTooltip(dataPostagem?: string, dataColeta?: string, precalculatedTimestamp?: number): string {
  const timestamp = precalculatedTimestamp ?? parseDataPostagemTimestamp(dataPostagem, dataColeta);
  const d = new Date(timestamp);
  
  if (isNaN(d.getTime())) {
    return dataPostagem || "Data não informada";
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');

  return `Publicado em ${dia}/${mes}/${ano} às ${horas}:${minutos}`;
}

/**
 * Normaliza o rotulo da modalidade para portugues padronizado.
 */
export function normalizarModalidade(mod?: string): 'Remoto' | 'Híbrido' | 'Presencial' | 'Indefinido' {
  if (!mod) return 'Indefinido';
  const m = mod.toLowerCase();
  if (m.includes('remot')) return 'Remoto';
  if (m.includes('hibrid') || m.includes('hybrid')) return 'Híbrido';
  if (m.includes('presenc') || m.includes('site')) return 'Presencial';
  return 'Indefinido';
}
