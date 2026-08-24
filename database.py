import sqlite3
import datetime
from config import DATABASE_PATH

def get_connection():
    return sqlite3.connect(DATABASE_PATH)

def init_db():
    """Inicializa a tabela de vagas no banco SQLite."""
    with get_connection() as conn:
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
                data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

def is_job_seen(job_id: str) -> bool:
    """Verifica se a vaga já foi processada anteriormente."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM vagas WHERE id = ?", (job_id,))
        return cursor.fetchone() is not None

def save_job(job: dict) -> bool:
    """Salva uma nova vaga com categoria e modalidade."""
    if is_job_seen(job["id"]):
        return False
        
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO vagas (id, titulo, empresa, localizacao, link, data_postagem, termo_busca, modalidade, easy_apply, categoria, data_coleta)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job.get("id"),
            job.get("titulo", "Sem título"),
            job.get("empresa", "Empresa confidencial"),
            job.get("localizacao", "Não informada"),
            job.get("link", ""),
            job.get("data_postagem", ""),
            job.get("termo_busca", ""),
            job.get("modalidade", "Indefinido"),
            1 if job.get("easy_apply") else 0,
            job.get("categoria", "Geral"),
            datetime.datetime.now().isoformat()
        ))
        conn.commit()
        return True

def get_stats() -> dict:
    """Retorna estatísticas detalhadas do banco."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM vagas")
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM vagas WHERE easy_apply = 1")
        easy_total = cursor.fetchone()[0]
        
        return {
            "total_vagas_armazenadas": total,
            "total_easy_apply": easy_total
        }
