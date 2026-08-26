import sqlite3
from typing import Dict, Any, List
from src.config.settings import settings
from src.models.job import Job

class JobRepository:
    """Repositório para persistência e deduplicação de vagas em SQLite."""

    def __init__(self, db_path: str = None):
        self.db_path = db_path or settings.DATABASE_PATH
        self._is_memory = (self.db_path == ":memory:")
        self._shared_conn = sqlite3.connect(":memory:") if self._is_memory else None
        self.init_db()

    def _get_connection(self) -> sqlite3.Connection:
        if self._is_memory:
            return self._shared_conn
        return sqlite3.connect(self.db_path)

    def init_db(self) -> None:
        """Cria as tabelas necessárias se não existirem e aplica migrações."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vagas (
                id TEXT PRIMARY KEY,
                titulo TEXT NOT NULL,
                empresa TEXT,
                localizacao TEXT,
                link TEXT NOT NULL,
                data_postagem TEXT,
                termo_busca TEXT,
                modalidade TEXT,
                easy_apply INTEGER DEFAULT 0,
                categoria TEXT,
                plataforma TEXT DEFAULT 'LinkedIn',
                fingerprint TEXT,
                data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Migrações seguras
        try:
            cursor.execute("ALTER TABLE vagas ADD COLUMN plataforma TEXT DEFAULT 'LinkedIn'")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE vagas ADD COLUMN fingerprint TEXT")
        except Exception:
            pass

        # Cria índices para acelerar deduplicação
        try:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_vagas_fingerprint ON vagas(fingerprint)")
        except Exception:
            pass

        conn.commit()
        if not self._is_memory:
            conn.close()

    def is_seen(self, job_id: str, fingerprint: str = None) -> bool:
        """
        Verificação em 3 camadas de deduplicação:
        1. ID exato (ex: 'li_4459043628')
        2. ID numérico legado (ex: '4459043628' sem prefixo)
        3. Fingerprint semântico (Cargo + Empresa)
        """
        conn = self._get_connection()
        cursor = conn.cursor()

        clean_id = job_id.replace("li_", "").replace("ind_", "")

        if fingerprint:
            query = """
                SELECT 1 FROM vagas 
                WHERE id = ? OR id = ? OR id = ? OR fingerprint = ?
                LIMIT 1
            """
            cursor.execute(query, (job_id, f"li_{clean_id}", clean_id, fingerprint))
        else:
            query = """
                SELECT 1 FROM vagas 
                WHERE id = ? OR id = ? OR id = ?
                LIMIT 1
            """
            cursor.execute(query, (job_id, f"li_{clean_id}", clean_id))

        result = cursor.fetchone() is not None
        if not self._is_memory:
            conn.close()
        return result

    def save(self, job: Job) -> bool:
        """Salva a vaga no banco de dados se não for duplicada."""
        if self.is_seen(job.id, job.fingerprint):
            return False

        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO vagas (
                id, titulo, empresa, localizacao, link, data_postagem, 
                termo_busca, modalidade, easy_apply, categoria, plataforma, fingerprint, data_coleta
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job.id,
            job.title,
            job.company,
            job.location,
            job.link,
            job.date_posted,
            job.search_term,
            job.modality,
            1 if job.easy_apply else 0,
            job.category,
            job.platform,
            job.fingerprint,
            job.created_at
        ))
        conn.commit()
        if not self._is_memory:
            conn.close()
        return True

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas detalhadas sobre as vagas salvas."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM vagas")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM vagas WHERE easy_apply = 1")
        easy_total = cursor.fetchone()[0]

        cursor.execute("SELECT plataforma, COUNT(*) FROM vagas GROUP BY plataforma")
        por_plataforma = dict(cursor.fetchall())

        cursor.execute("SELECT modalidade, COUNT(*) FROM vagas GROUP BY modalidade")
        por_modalidade = dict(cursor.fetchall())

        if not self._is_memory:
            conn.close()

        return {
            "total_vagas_armazenadas": total,
            "total_easy_apply": easy_total,
            "por_plataforma": por_plataforma,
            "por_modalidade": por_modalidade
        }

    def clear(self) -> None:
        """Limpa todos os registros da tabela de vagas."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM vagas")
        conn.commit()
        if not self._is_memory:
            conn.close()
