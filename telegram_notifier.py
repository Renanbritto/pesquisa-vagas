import requests
import html
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

def send_telegram_message(message_text: str) -> bool:
    """Envia uma mensagem de texto formatada em HTML para o Telegram."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[Telegram] Erro: TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não estão configurados no arquivo .env")
        return False
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message_text,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            return True
        else:
            print(f"[Telegram] Falha ao enviar mensagem: HTTP {response.status_code} - {response.text}")
            return False
    except requests.RequestException as e:
        print(f"[Telegram] Erro de conexão com o Telegram: {e}")
        return False

def format_job_message(job: dict) -> str:
    """Monta a notificação no Telegram com destaque para a categoria e modalidade."""
    titulo = html.escape(job.get("titulo", "Vaga de Dados"))
    empresa = html.escape(job.get("empresa", "Empresa não informada"))
    local = html.escape(job.get("localizacao", "Brasil"))
    postado = html.escape(job.get("data_postagem", "Recente"))
    termo = html.escape(job.get("termo_busca", "Geral"))
    link = job.get("link", "https://www.linkedin.com/jobs")
    categoria = job.get("categoria", "Vaga Recente")
    easy_apply = job.get("easy_apply", False)
    
    # Badge de candidatura
    if easy_apply:
        badge_btn = "⚡ CANDIDATURA SIMPLIFICADA (EASY APPLY)"
        call_action = "👉 <b><a href=\"" + link + "\">CANDIDATAR-SE COM 1 CLIQUE (EASY APPLY)</a></b>"
    else:
        badge_btn = "🌐 INSCRIÇÃO NO SITE DA EMPRESA"
        call_action = "👉 <b><a href=\"" + link + "\">ACESSAR VAGA NO LINKEDIN</a></b>"
        
    msg = (
        f"🏷️ <b>{html.escape(categoria)}</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"💼 <b>Cargo:</b> {titulo}\n"
        f"🏢 <b>Empresa:</b> {empresa}\n"
        f"📍 <b>Local:</b> {local}\n"
        f"🕒 <b>Publicação:</b> {postado}\n"
        f"🔍 <b>Filtro:</b> #{termo.replace(' ', '_')}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"{call_action}"
    )
    return msg

def send_job_alert(job: dict) -> bool:
    """Envia notificação formatada para o Telegram."""
    msg = format_job_message(job)
    return send_telegram_message(msg)

def test_telegram_connection() -> dict:
    """Valida a conexão com o bot."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return {
            "success": False,
            "message": "Token ou Chat ID estão vazios no .env"
        }
        
    test_msg = (
        "🚀 <b>Robô de Vagas Conectado!</b>\n\n"
        "Seus filtros por modalidade (Home Office, Híbrido, Presencial) e Easy Apply estão ativos!"
    )
    
    success = send_telegram_message(test_msg)
    return {
        "success": success,
        "message": "Mensagem de teste enviada com sucesso!" if success else "Falha no envio."
    }
