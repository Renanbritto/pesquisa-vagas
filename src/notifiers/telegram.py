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

    def _send_raw_message(self, message_text: str, target_chat_id: str = None) -> tuple:
        """Envia mensagem ao Telegram. Retorna (sucesso: bool, status_code: int)."""
        chat_id = target_chat_id or self.chat_id
        if not self.token or not chat_id:
            logger.warning("[Telegram] Token ou Chat ID não configurados.")
            return False, 0

        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message_text,
            "parse_mode": "HTML",
            "disable_web_page_preview": False
        }

        try:
            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                return True, 200
            else:
                logger.error(f"[Telegram] Falha no envio para {chat_id}: HTTP {response.status_code} - {response.text}")
                return False, response.status_code
        except requests.RequestException as e:
            logger.error(f"[Telegram] Erro de rede ao enviar para {chat_id}: {e}")
            return False, 0

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

    def send_job_alert(self, job: Job, target_chat_id: str = None) -> bool:
        msg = self.format_job_message(job)
        sucesso, _ = self._send_raw_message(msg, target_chat_id)
        return sucesso

    def disparar_matches_pendentes(self, repo) -> int:
        """
        Ciclo completo de Outbox do Telegram:
        1. Gera matches atômicos para as vagas novas que ainda não foram processadas.
        2. Promove inscritos da fila FIFO se houver slots liberados.
        3. Reserva lotes de outbox com SKIP LOCKED e lease de 5 minutos, despachando as mensagens.
        """
        import time

        # 1. Gera matches para novas vagas coletadas
        novos_matches = repo.gerar_matches()
        if novos_matches > 0:
            logger.info(f"[Matches] {novos_matches} novos matches registrados no banco.")

        # 2. Promove quem estava na fila de espera FIFO se liberou slot
        promovidos = repo.promover_espera()
        if promovidos:
            logger.info(f"[Waitlist] {len(promovidos)} inscritos promovidos da fila para vaga no Telegram.")

        # 3. Processa a Outbox em lotes de 50 com lock atômico
        total_enviados = 0

        while True:
            lote = repo.reservar_outbox(limite=50)
            if not lote:
                break

            sucessos_ids = []

            for m in lote:
                match_id = m.get("match_id")
                chat_id = m.get("chat_id")

                if not chat_id or not match_id:
                    continue

                # Monta o objeto Job para formatação da mensagem
                job_obj = Job(
                    id=m.get("vaga_id") or "vaga",
                    title=m.get("titulo") or "Oportunidade em Tecnologia",
                    company=m.get("empresa") or "Empresa Confidencial",
                    location=m.get("localizacao") or "Brasil",
                    link=m.get("link") or "https://google.com",
                    modality=m.get("modalidade") or "Remoto",
                    easy_apply=bool(m.get("easy_apply")),
                    platform=m.get("plataforma") or "LinkedIn",
                    search_term="Alerta Personalizado",
                    category="🎯 MEU RADAR VIP",
                    date_posted="Recente"
                )

                msg = self.format_job_message(job_obj)
                sucesso, status_code = self._send_raw_message(msg, target_chat_id=str(chat_id))

                if sucesso:
                    sucessos_ids.append(match_id)
                    total_enviados += 1
                elif status_code == 403:
                    # O usuário bloqueou o bot: libera o slot imediatamente
                    logger.warning(f"[Telegram] Usuário {chat_id} bloqueou o bot. Liberando slot.")
                    repo.marcar_bloqueado(chat_id)
                else:
                    # Outro erro: registra falha com backoff
                    repo.registrar_falha_envio(match_id, f"HTTP {status_code}")

                # Rate limit amigável (~20 msgs/s)
                time.sleep(0.05)

            if sucessos_ids:
                repo.marcar_enviado(sucessos_ids)

            # Se o lote foi menor que 50, significa que a fila esvaziou
            if len(lote) < 50:
                break

        if total_enviados > 0:
            logger.info(f"[Telegram Outbox] Total de {total_enviados} alertas entregues nesta rodada.")

        return total_enviados

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
        sucesso, _ = self._send_raw_message(test_msg)
        return {
            "success": sucesso,
            "message": "Mensagem enviada com sucesso ao seu Telegram!" if sucesso else "Falha ao enviar."
        }
