from unittest.mock import MagicMock, patch
import pytest
from src.database.repository import JobRepository
from src.models.job import Job

@pytest.fixture
def temp_repo():
    fake_db = []
    
    mock_supabase = MagicMock()
    
    def fake_table(name):
        table_mock = MagicMock()
        
        def fake_select(*args, **kwargs):
            query_mock = MagicMock()
            
            def fake_eq(col, val):
                res = MagicMock()
                matched = [row for row in fake_db if row.get(col) == val]
                res.limit.return_value.execute.return_value.data = matched
                res.execute.return_value.data = matched
                return res
            
            def fake_in(col, vals):
                res = MagicMock()
                matched = [row for row in fake_db if row.get(col) in vals]
                res.limit.return_value.execute.return_value.data = matched
                res.execute.return_value.data = matched
                return res

            query_mock.eq = fake_eq
            query_mock.in_ = fake_in
            query_mock.execute.return_value.count = len(fake_db)
            return query_mock

        def fake_insert(data):
            ins_mock = MagicMock()
            def fake_execute():
                fake_db.append(data)
                return MagicMock(data=[data])
            ins_mock.execute = fake_execute
            return ins_mock

        table_mock.select = fake_select
        table_mock.insert = fake_insert
        return table_mock

    mock_supabase.table = fake_table

    with patch("src.database.repository.create_client", return_value=mock_supabase):
        repo = JobRepository()
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
