import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const MAX_SLOTS = 10;

export async function GET() {
  try {
    const agora = new Date().toISOString();

    // Consulta inscritos com status ativo ou pendente com token válido
    const { data, error, count } = await supabaseServer
      .from('telegram_inscritos')
      .select('id, status, token_expira_em', { count: 'exact' })
      .or(`status.eq.ativo,and(status.eq.pendente,token_expira_em.gte.${agora})`);

    if (error) {
      console.error('[API Telegram Status] Erro ao consultar ocupação:', error);
      return NextResponse.json(
        { erro: 'Erro ao verificar disponibilidade de slots.' },
        { status: 500 }
      );
    }

    const totalOcupado = count ?? (data?.length || 0);
    const vagasDisponiveis = Math.max(0, MAX_SLOTS - totalOcupado);
    const estaLotado = totalOcupado >= MAX_SLOTS;

    return NextResponse.json({
      max_slots: MAX_SLOTS,
      total_ocupado: totalOcupado,
      vagas_disponiveis: vagasDisponiveis,
      esta_lotado: estaLotado,
    });
  } catch (err: any) {
    console.error('[API Telegram Status] Exceção inesperada:', err);
    return NextResponse.json(
      { erro: 'Erro interno ao consultar status.' },
      { status: 500 }
    );
  }
}
