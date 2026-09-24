// Utilitarios de estilizacao e dados de empresas

const GRADIENT_PALETTES = [
  'from-violet-600 to-indigo-600 text-white',
  'from-emerald-600 to-teal-700 text-white',
  'from-sky-600 to-blue-700 text-white',
  'from-amber-600 to-orange-700 text-white',
  'from-rose-600 to-pink-700 text-white',
  'from-cyan-600 to-blue-600 text-white',
  'from-fuchsia-600 to-purple-700 text-white',
  'from-slate-700 to-zinc-800 text-white',
];

/**
 * Extrai iniciais elegantes para exibicao no avatar (ex: "Nubank" -> "NU", "Banco Inter" -> "BI").
 */
export function getCompanyInitials(name?: string): string {
  if (!name || name.trim() === "") return "CO";

  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  const parts = clean.split(/\s+/).filter(part => {
    const lower = part.toLowerCase();
    return !['de', 'da', 'do', 'dos', 'das', 'e', 'ltda', 'sa', 's/a', 'inc', 'corp', 'the'].includes(lower);
  });

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase() || "CO";
}

/**
 * Retorna uma classe de gradiente deterministica baseada no nome da empresa.
 */
export function getCompanyGradient(name?: string): string {
  if (!name) return GRADIENT_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}
