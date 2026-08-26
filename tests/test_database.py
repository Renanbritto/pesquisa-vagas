import pytest
from src.database.repository import JobRepository
from src.models.job import Job

@pytest.fixture
def temp_repo():
    repo = JobRepository(db_path=":memory:")
    yield repo

def test_save_and_deduplication_exact_id(temp_repo):
    job = Job(
        id="li_4459043628",
        title="Analista Power BI",
        company="Banco XP",
        location="São Paulo, SP",
        link="https://linkedin.com/jobs/view/4459043628",
        easy_apply=True,
        platform="LinkedIn"
    )

    # Primeira inserção deve retornar True
    assert temp_repo.save(job) is True
    assert temp_repo.is_seen("li_4459043628") is True
    assert temp_repo.is_seen("4459043628") is True # Checagem com ID legado sem prefixo

    # Segunda inserção com ID legado deve ser bloqueada
    assert temp_repo.save(job) is False

def test_save_and_deduplication_semantic_fingerprint(temp_repo):
    job1 = Job(
        id="li_11111111",
        title="Python Engineer (Remote)",
        company="Hired",
        location="Brasil",
        link="https://linkedin.com/jobs/view/11111111",
        platform="LinkedIn"
    )
    job2 = Job(
        id="li_22222222", # ID diferente no LinkedIn, mas mesma vaga da mesma empresa
        title="Python Engineer (Remote)",
        company="Hired",
        location="Brasil",
        link="https://linkedin.com/jobs/view/22222222",
        platform="LinkedIn"
    )

    assert temp_repo.save(job1) is True
    # job2 tem ID diferente, mas mesmo fingerprint (Cargo + Empresa) -> DEVE SER BLOQUEADO
    assert temp_repo.save(job2) is False

    stats = temp_repo.get_stats()
    assert stats["total_vagas_armazenadas"] == 1
