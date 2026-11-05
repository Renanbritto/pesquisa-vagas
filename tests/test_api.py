from unittest.mock import MagicMock, patch
import pytest
from src.api.main import listar_vagas

@pytest.fixture
def fake_supabase():
    fake_vagas = [
        {
            "id": "li_1",
            "titulo": "Engenheiro de Dados Pleno",
            "empresa": "Nubank",
            "localizacao": "São Paulo, SP",
            "link": "https://linkedin.com/jobs/view/1",
            "data_postagem": "2026-11-01T12:00:00Z",
            "data_coleta": "2026-11-01T12:00:00Z",
            "termo_busca": "dados",
            "modalidade": "Remoto",
            "easy_apply": True,
            "plataforma": "LinkedIn"
        },
        {
            "id": "ind_2",
            "titulo": "Analista de BI",
            "empresa": "Banco Itaú",
            "localizacao": "Remoto",
            "link": "https://indeed.com/viewjob?jk=2",
            "data_postagem": "2026-11-02T12:00:00Z",
            "data_coleta": "2026-11-02T12:00:00Z",
            "termo_busca": "power bi",
            "modalidade": "Remoto",
            "easy_apply": False,
            "plataforma": "Indeed"
        },
        {
            "id": "gupy_3",
            "titulo": "Desenvolvedor Python",
            "empresa": "PicPay",
            "localizacao": "Vitória, ES",
            "link": "https://picpay.gupy.io/job/3",
            "data_postagem": "2026-11-03T12:00:00Z",
            "data_coleta": "2026-11-03T12:00:00Z",
            "termo_busca": "python",
            "modalidade": "Híbrido",
            "easy_apply": False,
            "plataforma": "Gupy"
        }
    ]

    mock_sb = MagicMock()
    query_instance = MagicMock()
    query_instance.calls = []

    def fake_select(*args, **kwargs):
        return query_instance

    def fake_order(*args, **kwargs):
        return query_instance

    def fake_limit(val):
        return query_instance

    def fake_ilike(col, pattern):
        query_instance.calls.append(("ilike", col, pattern))
        return query_instance

    def fake_or(expr):
        query_instance.calls.append(("or_", expr))
        return query_instance

    def fake_eq(col, val):
        query_instance.calls.append(("eq", col, val))
        return query_instance

    def fake_execute():
        res = MagicMock()
        res.data = list(fake_vagas)
        res.count = len(fake_vagas)
        return res

    query_instance.select = fake_select
    query_instance.order = fake_order
    query_instance.limit = fake_limit
    query_instance.ilike = fake_ilike
    query_instance.or_ = fake_or
    query_instance.eq = fake_eq
    query_instance.execute = fake_execute

    table_mock = MagicMock()
    table_mock.select = fake_select
    mock_sb.table.return_value = table_mock
    mock_sb.query_instance = query_instance

    return mock_sb

def test_listar_vagas_busca_por_empresa(fake_supabase):
    with patch("src.api.main.supabase", fake_supabase):
        res = listar_vagas(busca="Nubank")
        assert "vagas" in res
        calls = fake_supabase.query_instance.calls
        assert any("empresa.ilike.%Nubank%" in str(arg) for call_type, arg in calls if call_type == "or_")

def test_listar_vagas_filtro_empresa_especifico(fake_supabase):
    with patch("src.api.main.supabase", fake_supabase):
        res = listar_vagas(empresa="PicPay")
        assert "vagas" in res
        calls = fake_supabase.query_instance.calls
        assert any(call_type == "ilike" and col == "empresa" and "%PicPay%" in pattern for call_type, col, pattern in calls)

def test_listar_vagas_tecnologia_retrocompatibilidade(fake_supabase):
    with patch("src.api.main.supabase", fake_supabase):
        res = listar_vagas(tecnologia="Itaú")
        assert "vagas" in res
        calls = fake_supabase.query_instance.calls
        assert any("empresa.ilike.%Itaú%" in str(arg) for call_type, arg in calls if call_type == "or_")
