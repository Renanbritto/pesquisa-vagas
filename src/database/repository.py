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
                "data_coleta": str(job.created_at) if job.created_at else None
            }
            self.supabase.table("vagas").insert(data).execute()
            return True
        except Exception as e:
            print(f"Erro ao salvar vaga {job.id}: {e}")
            return False

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
