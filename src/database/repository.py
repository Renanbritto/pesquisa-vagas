from typing import Dict, Any
from supabase import create_client, Client
from src.config.settings import settings
from src.models.job import Job

class JobRepository:
    """Repositorio para persistencia de vagas no Supabase."""

    def __init__(self):
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_KEY
        if not url or not key:
            raise ValueError("As credenciais do Supabase nao foram encontradas no .env")
        
        self.supabase: Client = create_client(url, key)

    def is_seen(self, job_id: str, fingerprint: str = None) -> bool:
        """
        Verifica se a vaga ja existe no Supabase usando o fingerprint ou ID.
        """
        try:
            if fingerprint:
                response = self.supabase.table("vagas").select("id").eq("fingerprint", fingerprint).limit(1).execute()
                if response.data:
                    return True
            
            clean_id = job_id.replace("li_", "").replace("ind_", "")
            
            # Checa os 3 formatos de ID por precaucao
            response = self.supabase.table("vagas").select("id").in_("id", [job_id, f"li_{clean_id}", clean_id]).limit(1).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Erro ao verificar vaga duplicada: {e}")
            return False

    def save(self, job: Job) -> bool:
        """Salva a vaga no Supabase se nao for duplicada."""
        if self.is_seen(job.id, job.fingerprint):
            return False

        try:
            # Normalização de atributos na ingestão
            from src.utils.normalizer import extrair_senioridade, extrair_modalidade, gerar_cidade_slug

            senioridade = extrair_senioridade(job.title)
            modalidade_norm = extrair_modalidade(job.modality)
            cidade_slug = gerar_cidade_slug(job.location)

            data = {
                "id": job.id,
                "titulo": job.title,
                "empresa": job.company,
                "localizacao": job.location,
                "link": job.link,
                "data_postagem": job.date_posted,
                "termo_busca": job.search_term,
                "modalidade": job.modality,
                "easy_apply": bool(job.easy_apply),
                "categoria": job.category,
                "plataforma": job.platform,
                "fingerprint": job.fingerprint,
                "data_coleta": str(job.created_at) if job.created_at else None,
                "senioridade": senioridade,
                "modalidade_norm": modalidade_norm,
                "cidade_slug": cidade_slug
            }
            self.supabase.table("vagas").insert(data).execute()
            return True
        except Exception as e:
            print(f"Erro ao salvar vaga {job.id}: {e}")
            return False

    def gerar_matches(self) -> int:
        """Gera matches atômicos para as vagas novas que ainda não foram processadas."""
        try:
            resp = self.supabase.rpc("fn_gerar_matches").execute()
            return resp.data or 0
        except Exception as e:
            print(f"Erro ao gerar matches: {e}")
            return 0

    def promover_espera(self) -> list:
        """Promove inscritos da fila FIFO e limpa tokens expirados."""
        try:
            resp = self.supabase.rpc("fn_promover_espera").execute()
            return resp.data or []
        except Exception as e:
            print(f"Erro ao promover fila de espera: {e}")
            return []

    def reservar_outbox(self, limite: int = 50) -> list:
        """Reserva um lote de matches para envio no Telegram com SKIP LOCKED e lease."""
        try:
            resp = self.supabase.rpc("fn_reservar_outbox", {"p_limite": limite}).execute()
            return resp.data or []
        except Exception as e:
            print(f"Erro ao reservar outbox do Telegram: {e}")
            return []

    def marcar_enviado(self, match_ids: list) -> int:
        """Marca matches como entregues com sucesso no Telegram."""
        if not match_ids:
            return 0
        try:
            resp = self.supabase.rpc("fn_marcar_enviado", {"p_match_ids": match_ids}).execute()
            return resp.data or 0
        except Exception as e:
            print(f"Erro ao marcar matches como enviados: {e}")
            return 0

    def registrar_falha_envio(self, match_id: int, erro: str) -> None:
        """Registra erro no match e aplica backoff para retry."""
        try:
            self.supabase.rpc("fn_registrar_falha_envio", {
                "p_match_id": match_id,
                "p_erro": str(erro)[:500]
            }).execute()
        except Exception as e:
            print(f"Erro ao registrar falha de envio no match {match_id}: {e}")

    def marcar_bloqueado(self, chat_id: int) -> None:
        """Marca o vínculo do Telegram como bloqueado (403), liberando a vaga no pool."""
        try:
            self.supabase.rpc("fn_telegram_bloquear", {"p_chat_id": chat_id}).execute()
        except Exception as e:
            print(f"Erro ao marcar chat {chat_id} como bloqueado: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatisticas simplificadas das vagas."""
        try:
            response = self.supabase.table("vagas").select("id", count="exact").execute()
            total = response.count
            return {
                "total_vagas_armazenadas": total,
                "status": "conectado ao supabase"
            }
        except Exception:
            return {"total_vagas_armazenadas": 0}

    def clear(self) -> None:
        """Aviso: Nao limpar a tabela em producao!"""
        print("Operacao de clear ignorada no Supabase para seguranca.")
