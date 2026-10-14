import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8716891734:AAHicHQ0ycdCetc7SitK-ZNSioNphG2pRp8';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

// Envia mensagem direta ao usuário via Telegram Bot API
async function enviarMensagem(chatId: number | string, textoHtml: string) {
  if (!BOT_TOKEN) {
    console.warn('[Webhook] TELEGRAM_BOT_TOKEN não configurado.');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: textoHtml,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('[Webhook] Falha ao enviar mensagem no Telegram:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validação de Segurança (Secret Token)
    if (WEBHOOK_SECRET) {
      const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (headerSecret !== WEBHOOK_SECRET) {
        console.warn('[Webhook] Secret token inválido ou ausente.');
        return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 });
      }
    }

    const update = await req.json();
    const message = update?.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const texto = message.text.trim();
    const firstName = message.from?.first_name || 'Usuário';
    const username = message.from?.username || '';

    // ==============================================================
    // 2. COMANDO: /start [TOKEN]
    // ==============================================================
    if (texto.startsWith('/start')) {
      const partes = texto.split(' ');
      const token = partes.length > 1 ? partes[1].trim() : '';

      if (token) {
        // Ativa o vínculo com o token gerado no servidor
        const { data: resultado, error } = await supabaseServer.rpc('fn_ativar_telegram_link', {
          p_token: token,
          p_chat_id: chatId,
          p_username: username,
        });

        if (error || !resultado?.sucesso) {
          const motivo = resultado?.erro === 'telegram_ja_vinculado_a_outra_conta'
            ? 'Este Telegram já está vinculado a outra conta no site.'
            : 'Este link de ativação expirou ou é inválido.';

          await enviarMensagem(
            chatId,
            `⚠️ <b>${motivo}</b>\n\n` +
            `Por favor, acesse o site, verifique sua conta e gere um novo link:\n` +
            `<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pesquisavagas.vercel.app'}">Acessar Pesquisa Vagas</a>`
          );
          return NextResponse.json({ ok: true });
        }

        // Sucesso na ativação
        await enviarMensagem(
          chatId,
          `🎉 <b>Parabéns, ${firstName}! Seu robô de alertas está ativo!</b>\n\n` +
          `Você garantiu um dos <b>10 slots exclusivos</b> do Telegram VIP. ` +
          `Assim que novas vagas compatíveis com suas preferências forem coletadas, ` +
          `você receberá a notificação aqui em primeira mão! ⚡\n\n` +
          `Além disso, acesse a aba <b>🎯 Meu Radar</b> no site para ver o feed completo sincronizado!\n\n` +
          `💡 <b>Comandos úteis:</b>\n` +
          `• <code>/filtros</code> - Ver suas preferências salvas\n` +
          `• <code>/pausar</code> - Pausar alertas temporariamente\n` +
          `• <code>/retomar</code> - Reativar alertas pausados\n` +
          `• <code>/parar</code> - Desvincular e liberar sua vaga`
        );
        return NextResponse.json({ ok: true });
      }

      // /start sem token: verifica vínculo existente
      const { data: link } = await supabaseServer
        .from('telegram_links')
        .select('status, user_id')
        .eq('chat_id', chatId)
        .single();

      if (link && link.status === 'ativo') {
        await enviarMensagem(
          chatId,
          `👋 <b>Olá, ${firstName}!</b> Seus alertas continuam <b>ativos</b>.\n\n` +
          `Envie <code>/filtros</code> para ver suas preferências ou <code>/pausar</code> para pausar.`
        );
      } else {
        await enviarMensagem(
          chatId,
          `👋 <b>Olá, ${firstName}! Bem-vindo ao Pesquisa Vagas!</b>\n\n` +
          `Para ativar os alertas no Telegram, acesse o site, crie sua conta gratuita e clique em <b>Ativar Bot</b>:\n\n` +
          `👉 <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://pesquisavagas.vercel.app'}">Acessar Pesquisa Vagas</a>`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ==============================================================
    // 3. COMANDO: /filtros ou /status
    // ==============================================================
    if (texto === '/filtros' || texto === '/status') {
      const { data: link } = await supabaseServer
        .from('telegram_links')
        .select('user_id, status')
        .eq('chat_id', chatId)
        .single();

      if (!link) {
        await enviarMensagem(
          chatId,
          `ℹ️ Este Telegram não está vinculado a nenhuma conta. Acesse o site para conectar!`
        );
        return NextResponse.json({ ok: true });
      }

      const { data: pref } = await supabaseServer
        .from('preferencias')
        .select('*')
        .eq('user_id', link.user_id)
        .single();

      const palavras = pref?.palavras_incluidas?.join(', ') || 'Nenhuma';
      const excluidas = pref?.palavras_excluidas?.join(', ') || 'Nenhuma';
      const cidades = pref?.cidades_slug && pref.cidades_slug.length > 0 ? pref.cidades_slug.join(', ') : 'Qualquer Cidade (Sem restrição)';
      const modalidades = pref?.modalidades?.join(', ') || 'Todas';
      const niveis = pref?.senioridades?.join(', ') || 'Todos';

      await enviarMensagem(
        chatId,
        `⚙️ <b>Suas Preferências no Pesquisa Vagas (Status: ${link.status.toUpperCase()}):</b>\n\n` +
        `• <b>Palavras-chave:</b> ${palavras}\n` +
        (excluidas !== 'Nenhuma' ? `• <b>Excluídas:</b> ${excluidas}\n` : '') +
        `• <b>Níveis:</b> ${niveis}\n` +
        `• <b>Modalidades:</b> ${modalidades}\n` +
        `• <b>Cidades:</b> ${cidades}\n` +
        `• <b>Apenas Easy Apply:</b> ${pref?.apenas_easy_apply ? 'Sim' : 'Não'}\n\n` +
        `Para editar seus filtros, acesse o site!`
      );
      return NextResponse.json({ ok: true });
    }

    // ==============================================================
    // 4. COMANDO: /pausar
    // ==============================================================
    if (texto === '/pausar') {
      await supabaseServer.rpc('fn_telegram_pausar', {
        p_chat_id: chatId,
        p_pausar: true,
      });

      await enviarMensagem(
        chatId,
        `⏸️ <b>Alertas pausados.</b>\n\n` +
        `Você não receberá novas mensagens no Telegram até enviar <code>/retomar</code>. ` +
        `Seu feed no site (Meu Radar) continua funcionando normalmente!`
      );
      return NextResponse.json({ ok: true });
    }

    // ==============================================================
    // 5. COMANDO: /retomar
    // ==============================================================
    if (texto === '/retomar') {
      await supabaseServer.rpc('fn_telegram_pausar', {
        p_chat_id: chatId,
        p_pausar: false,
      });

      await enviarMensagem(
        chatId,
        `▶️ <b>Alertas retomados com sucesso!</b>\n\n` +
        `Você voltará a receber mensagens assim que novas vagas compatíveis entrarem.`
      );
      return NextResponse.json({ ok: true });
    }

    // ==============================================================
    // 6. COMANDO: /parar ou /desvincular
    // ==============================================================
    if (texto === '/parar' || texto === '/desvincular') {
      await supabaseServer.rpc('fn_telegram_desvincular', {
        p_chat_id: chatId,
      });

      await enviarMensagem(
        chatId,
        `🛑 <b>Vínculo removido e vaga no bot liberada.</b>\n\n` +
        `Seu Telegram foi desvinculado e seu slot foi disponibilizado para a fila de espera. ` +
        `Sua conta no site continua ativa.`
      );
      return NextResponse.json({ ok: true });
    }

    // ==============================================================
    // 7. COMANDO: /ajuda ou /help
    // ==============================================================
    if (texto === '/ajuda' || texto === '/help') {
      await enviarMensagem(
        chatId,
        `🤖 <b>Comandos do Pesquisa Vagas:</b>\n\n` +
        `• <code>/filtros</code> - Ver filtros ativos\n` +
        `• <code>/pausar</code> - Pausar alertas temporariamente\n` +
        `• <code>/retomar</code> - Reativar alertas pausados\n` +
        `• <code>/parar</code> - Desvincular Telegram e liberar vaga\n` +
        `• <code>/ajuda</code> - Exibir esta lista`
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Webhook Telegram] Exceção inesperada:', err);
    return NextResponse.json({ ok: true });
  }
}
