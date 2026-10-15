/**
 * Utilitários para tratamento de links e deep linking nativo para aplicativos móveis (LinkedIn, etc.)
 */

export interface JobLinkConfig {
  href: string;
  target?: string;
  rel?: string;
}

/**
 * Extrai o ID numérico de uma vaga do LinkedIn a partir de diferentes padrões de URL
 * Exemplos aceitos:
 * - https://www.linkedin.com/jobs/view/analista-de-dados-at-empresa-4477311395
 * - https://www.linkedin.com/jobs/view/4477311395/
 * - https://br.linkedin.com/jobs/view/4477311395?refId=...
 * - https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4477311395
 */
export function extractLinkedInJobId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:jobs\/view\/(?:[^\/]*?-)?|currentJobId=)(\d{7,})/i);
  return match ? match[1] : null;
}

/**
 * Detecta o ambiente do dispositivo do usuário (Android, iOS ou Desktop)
 */
export function getMobileEnvironment(): { isMobile: boolean; isAndroid: boolean; isIOS: boolean } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isMobile: false, isAndroid: false, isIOS: false };
  }
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile = isAndroid || isIOS || /Mobile|Opera Mini|IEMobile|WPDesktop/i.test(ua);
  return { isMobile, isAndroid, isIOS };
}

/**
 * Gera a configuração ideal de link para o botão "Ver Vaga":
 * 
 * 1. No Android com LinkedIn:
 *    Retorna o URI Intent oficial do Android (intent://) direcionado para o pacote `com.linkedin.android`.
 *    Isso força o sistema operacional Android a abrir diretamente no app instalado do LinkedIn.
 *    Se o usuário não possuir o aplicativo instalado, o parâmetro `S.browser_fallback_url` instrui
 *    o navegador a carregar a página web da vaga sem erro.
 * 
 * 2. No iOS com LinkedIn:
 *    Retorna a Universal Link canônica sem target="_blank".
 *    No Safari e Chrome do iOS, links sem target="_blank" permitem que o sistema operacional
 *    intercepte o toque e transite diretamente para o aplicativo oficial do LinkedIn.
 * 
 * 3. No Desktop ou em outras plataformas (Gupy, Indeed, etc.):
 *    Mantém target="_blank" e rel="noopener noreferrer" para abrir com conforto em nova aba.
 */
export function getJobLinkConfig(vaga: { plataforma?: string; link: string }): JobLinkConfig {
  if (!vaga.link) {
    return { href: '#', target: '_self' };
  }

  const isLinkedIn =
    vaga.plataforma?.toLowerCase() === 'linkedin' ||
    vaga.link.toLowerCase().includes('linkedin.com');

  const { isMobile, isAndroid, isIOS } = getMobileEnvironment();

  if (isMobile && isLinkedIn) {
    const jobId = extractLinkedInJobId(vaga.link);
    const canonicalWebUrl = jobId
      ? `https://www.linkedin.com/jobs/view/${jobId}/`
      : vaga.link;

    if (isAndroid) {
      // Android Intent URI para o pacote com.linkedin.android
      const intentUrl = jobId
        ? `intent://www.linkedin.com/jobs/view/${jobId}/#Intent;package=com.linkedin.android;scheme=https;S.browser_fallback_url=${encodeURIComponent(canonicalWebUrl)};end;`
        : `intent://${vaga.link.replace(/^https?:\/\//, '')}#Intent;package=com.linkedin.android;scheme=https;S.browser_fallback_url=${encodeURIComponent(vaga.link)};end;`;

      return {
        href: intentUrl,
        target: '_self',
      };
    }

    if (isIOS) {
      // Universal Link no iOS requer target="_self" para o Safari passar a navegação para o app
      return {
        href: canonicalWebUrl,
        target: '_self',
      };
    }

    return {
      href: canonicalWebUrl,
      target: '_self',
    };
  }

  // Comportamento padrão para Desktop e outras plataformas
  return {
    href: vaga.link,
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}
