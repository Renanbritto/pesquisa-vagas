import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { nome, contato } = await req.json();

    if (!nome || !contato) {
      return NextResponse.json(
        { erro: 'Nome e contato (email ou @telegram) são obrigatórios.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('telegram_waitlist')
      .insert({
        nome: String(nome).trim().slice(0, 100),
        contato: String(contato).trim().slice(0, 100),
      })
      .select('posicao')
      .single();

    if (error) {
      console.error('[API Waitlist] Erro ao inserir na lista de espera:', error);
      return NextResponse.json(
        { erro: 'Erro ao registrar na lista de espera.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Você foi adicionado à lista de espera com prioridade!',
      posicao: data?.posicao,
    });
  } catch (err: any) {
    console.error('[API Waitlist] Exceção inesperada:', err);
    return NextResponse.json(
      { erro: 'Erro interno ao salvar na lista de espera.' },
      { status: 500 }
    );
  }
}
