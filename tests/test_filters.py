import pytest
from src.utils.filters import is_title_relevant, is_location_relevant, clean_url

def test_is_title_relevant_valid_jr_pleno():
    # Vagas válidas Júnior e Pleno
    assert is_title_relevant("Analista de Dados Júnior") is True
    assert is_title_relevant("Analista de Dados Pleno") is True
    assert is_title_relevant("Desenvolvedor Power BI & DAX") is True
    assert is_title_relevant("Python Data Analyst Jr") is True
    assert is_title_relevant("Analista de Business Intelligence Pleno") is True
    assert is_title_relevant("Banco de Talentos - Análise de Dados") is True
    assert is_title_relevant("Assistente de BI / Relatórios") is True

def test_is_title_relevant_excluded_senior_and_specialists():
    # Níveis sênior, especialistas e liderança devem ser REJEITADOS
    assert is_title_relevant("Senior Data Analyst") is False
    assert is_title_relevant("Analista de Dados Sr") is False
    assert is_title_relevant("Analista de Dados Sr.") is False
    assert is_title_relevant("Especialista em Business Intelligence") is False
    assert is_title_relevant("Data Scientist Specialist") is False
    assert is_title_relevant("Tech Lead Power BI") is False
    assert is_title_relevant("Gerente de Dados e Analytics") is False
    assert is_title_relevant("Coordenador de BI") is False
    assert is_title_relevant("Head of Data") is False
    assert is_title_relevant("Data Analyst III") is False

def test_is_title_relevant_excluded_other_areas():
    # Áreas fora de dados/tech devem ser rejeitadas
    assert is_title_relevant("Estágio de Direito") is False
    assert is_title_relevant("Recepcionista Bilíngue") is False
    assert is_title_relevant("Enfermeiro de UTI") is False
    assert is_title_relevant("Advogado Trabalhista") is False

def test_is_location_relevant():
    # Brasil e cidades alvo
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
