import pytest
from src.database.repository import JobRepository
from src.models.job import Job

@pytest.fixture
def temp_repo():
    # SQLite em memória para testes rápidos e sem lock de arquivo
    repo = JobRepository(db_path=":memory:")
    yield repo

def test_save_and_deduplication(temp_repo):
    job = Job(
        id="test_001",
        title="Analista Power BI",
        company="Banco XP",
        location="São Paulo, SP",
        link="https://linkedin.com/jobs/view/test_001",
        easy_apply=True,
        platform="LinkedIn"
    )

    # Primeira inserção deve retornar True
    assert temp_repo.save(job) is True
    assert temp_repo.is_seen("test_001") is True

    # Segunda inserção da mesma vaga deve ser bloqueada (False)
    assert temp_repo.save(job) is False

    stats = temp_repo.get_stats()
    assert stats["total_vagas_armazenadas"] == 1
    assert stats["total_easy_apply"] == 1
    assert stats["por_plataforma"]["LinkedIn"] == 1
