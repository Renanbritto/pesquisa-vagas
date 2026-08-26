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
                data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Migração segura para bancos existentes da v1.0
        try:
            cursor.execute("ALTER TABLE vagas ADD COLUMN plataforma TEXT DEFAULT 'LinkedIn'")
        except Exception:
            pass

        conn.commit()
        if not self._is_memory:
            conn.close()

    def is_seen(self, job_id: str) -> bool:
        """Verifica se a vaga já foi processada anteriormente."""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM vagas WHERE id = ?", (job_id,))
        result = cursor.fetchone() is not None
        if not self._is_memory:
            conn.close()
        return result

    def save(self, job: Job) -> bool:
        """Salva a vaga no banco de dados se não for duplicada."""
        if self.is_seen(job.id):
            return False

        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO vagas (
                id, titulo, empresa, localizacao, link, data_postagem, 
                termo_busca, modalidade, easy_apply, categoria, plataforma, data_coleta
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
