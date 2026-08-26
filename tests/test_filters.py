import pytest
from src.utils.filters import is_title_relevant, is_location_relevant, clean_url

def test_is_title_relevant_valid():
    assert is_title_relevant("Analista de Dados Júnior") is True
    assert is_title_relevant("Desenvolvedor Power BI & DAX") is True
    assert is_title_relevant("Python Data Analyst") is True
    assert is_title_relevant("Especialista em Business Intelligence") is True

def test_is_title_relevant_excluded():
    # Senior / Gerente / Fora da área
    assert is_title_relevant("Senior Data Analyst") is False
    assert is_title_relevant("Gerente de TI") is False
    assert is_title_relevant("Estágio de Direito") is False
    assert is_title_relevant("Recepcionista Bilíngue") is False

def test_is_location_relevant():
    # Brasil e cidades permitidas
    assert is_location_relevant("São Paulo, SP") is True
    assert is_location_relevant("Juiz de Fora, Minas Gerais") is True
    assert is_location_relevant("Rio de Janeiro, RJ") is True
    assert is_location_relevant("Florianópolis, SC") is True
    assert is_location_relevant("Remoto - Brasil", is_remote_search=True) is True

    # Exterior bloqueado
    assert is_location_relevant("New York, Estados Unidos") is False
    assert is_location_relevant("Lisboa, Portugal") is False
    assert is_location_relevant("Buenos Aires, Argentina") is False

def test_clean_url():
    dirty_url = "https://www.linkedin.com/jobs/view/123456789/?trackingId=abc123xyz&refId=999"
    cleaned = clean_url(dirty_url)
    assert "?" not in cleaned
    assert "https://www.linkedin.com/jobs/view/123456789" in cleaned
