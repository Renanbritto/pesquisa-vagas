import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

interface InscricaoPayload {
  palavras_incluidas?: string[];
  palavras_excluidas?: string[];
  cidades_slug?: string[];
  modalidades?: ('remoto' | 'hibrido' | 'presencial')[];
  senioridades?: ('estagio' | 'junior' | 'pleno')[];
  apenas_easy_apply?: boolean;
  turnstile_token?: string;
}

// Validação opcional de Cloudflare Turnstile (se configurado no ambiente)
async function validarTurnstile(token?: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // Se não tiver secret configurado, ignora para não quebrar o desenvolvimento local
    return true;
  }
  if (!token) return false;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });
    const outcome = await res.json();
    return outcome.success === true;
  } catch (err) {
    console.error('[Turnstile] Erro ao validar token:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: InscricaoPayload = await req.json();

    // 1. Proteção contra bots (Turnstile se configurado)
    const clientIp = req.headers.get('x-forwarded-for') || undefined;
    const isHuman = await validarTurnstile(body.turnstile_token, clientIp);
    if (!isHuman) {
      return NextResponse.json(
        { erro: 'Validação de segurança falhou. Por favor, tente novamente.' },
        { status: 403 }
      );
    }

    // 2. Sanitização e valores padrão
    const palavrasIncluidas = Array.isArray(body.palavras_incluidas)
      ? body.palavras_incluidas.map((p) => p.trim()).filter(Boolean)
      : ['Power BI', 'Python', 'Analista de Dados'];

    const palavrasExcluidas = Array.isArray(body.palavras_excluidas)
      ? body.palavras_excluidas.map((p) => p.trim()).filter(Boolean)
      : [];

    const cidadesSlug = Array.isArray(body.cidades_slug)
      ? body.cidades_slug
          .map((c) => c.trim().toLowerCase())
          .filter((c) => Boolean(c) && c !== 'qualquer' && c !== 'todas')
      : [];

    const modalidadesValidas = ['remoto', 'hibrido', 'presencial'];
    const modalidades = Array.isArray(body.modalidades) && body.modalidades.length > 0
      ? body.modalidades.filter((m) => modalidadesValidas.includes(m))
      : ['remoto', 'hibrido', 'presencial'];

    const senioridadesValidas = ['estagio', 'junior', 'pleno'];
    const senioridades = Array.isArray(body.senioridades) && body.senioridades.length > 0
      ? body.senioridades.filter((s) => senioridadesValidas.includes(s))
      : ['junior', 'pleno'];

    const apenasEasyApply = Boolean(body.apenas_easy_apply);

    // 3. Geração de Token Criptográfico Seguro (base64url, 32 caracteres, URL-safe)
    const token = crypto.randomBytes(24).toString('base64url');

    // 4. Chamada atômica à função SQL no Supabase (com lock transacional pg_advisory_xact_lock)
    const { data: resultado, error } = await supabaseServer.rpc('fn_reservar_slot', {
      p_palavras_incluidas: palavrasIncluidas,
      p_palavras_excluidas: palavrasExcluidas,
      p_cidades_slug: cidadesSlug,
      p_modalidades: modalidades,
      p_senioridades: senioridades,
      p_apenas_easy_apply: apenasEasyApply,
      p_token: token,
      p_max_slots: 10,
    });

    if (error) {
      console.error('[API Inscrição] Erro no fn_reservar_slot:', error);
      return NextResponse.json(
        { erro: 'Erro ao reservar slot no banco de dados.' },
        { status: 500 }
      );
    }

    // Se o banco indicar que atingiu o limite de 10
    if (!resultado?.sucesso) {
      return NextResponse.json(
        {
          sucesso: false,
          motivo: resultado?.motivo || 'lotado',
          mensagem: resultado?.mensagem || 'Todas as 10 vagas do Beta estão ocupadas no momento.',
          total_ativos: resultado?.total_ativos || 10,
        },
        { status: 409 }
      );
    }

    // 5. Monta o link oficial de ativação no Telegram
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'horus22bot';
    const telegramLink = `https://t.me/${botUsername}?start=${token}`;

    return NextResponse.json({
      sucesso: true,
      token,
      telegram_link: telegramLink,
      expira_em: resultado.expira_em,
      slots_restantes: resultado.slots_restantes,
    });
  } catch (err: any) {
    console.error('[API Inscrição] Exceção inesperada:', err);
    return NextResponse.json(
      { erro: 'Erro interno ao processar inscrição.' },
      { status: 500 }
    );
  }
}
