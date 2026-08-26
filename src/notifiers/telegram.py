import html
import requests
from src.notifiers.base import BaseNotifier
from src.models.job import Job
from src.config.settings import settings
from src.utils.logger import logger

class TelegramNotifier(BaseNotifier):
    """Notificador via Telegram Bot API com templates em HTML."""

    def __init__(self, token: str = None, chat_id: str = None):
        self.token = token or settings.TELEGRAM_BOT_TOKEN
        self.chat_id = chat_id or settings.TELEGRAM_CHAT_ID

    def _send_raw_message(self, message_text: str) -> bool:
        if not self.token or not self.chat_id:
            logger.warning("[Telegram] Token ou Chat ID não configurados no .env")
            return False

        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message_text,
            "parse_mode": "HTML",
            "disable_web_page_preview": False
        }

        try:
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                return True
            else:
                logger.error(f"[Telegram] Falha no envio: HTTP {response.status_code} - {response.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"[Telegram] Erro de rede: {e}")
            return False

    def format_job_message(self, job: Job) -> str:
        titulo = html.escape(job.title)
        empresa = html.escape(job.company)
        local = html.escape(job.location)
        postado = html.escape(job.date_posted)
        termo = html.escape(job.search_term)
        link = job.link or "https://google.com"
        categoria = job.category
        plataforma = html.escape(job.platform)

        # Ícone da plataforma
        plat_icon = "💼 [LinkedIn]" if job.platform.lower() == "linkedin" else "🟦 [Indeed]"

        # Botão de candidatura
        if job.easy_apply:
            call_action = f"👉 <b><a href=\"{link}\">CANDIDATAR-SE COM 1 CLIQUE (EASY APPLY)</a></b>"
        else:
            call_action = f"👉 <b><a href=\"{link}\">ACESSAR VAGA NO {plataforma.upper()}</a></b>"

        msg = (
            f"🏷️ <b>{html.escape(categoria)}</b> • {plat_icon}\n"
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

    def send_job_alert(self, job: Job) -> bool:
        msg = self.format_job_message(job)
        return self._send_raw_message(msg)

    def test_connection(self) -> dict:
        if not self.token or not self.chat_id:
            return {
                "success": False,
                "message": "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausentes no .env"
            }

        test_msg = (
            "🚀 <b>Pesquisa Vagas v2.0 Conectado!</b>\n\n"
            "Robô atualizado com arquitetura modular, suporte a <b>LinkedIn + Indeed</b> "
            "e 6 categorias de monitoramento ativas!"
        )
        success = self._send_raw_message(test_msg)
        return {
            "success": success,
            "message": "Mensagem enviada com sucesso ao seu Telegram!" if success else "Falha ao enviar."
        }
