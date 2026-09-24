import pytest
from src.scrapers.factory import ScraperFactory
from src.scrapers.base import BaseScraper
from src.scrapers.linkedin import LinkedInScraper
from src.scrapers.indeed import IndeedScraper

def test_scraper_factory_get_instances():
    li = ScraperFactory.get_scraper("linkedin")
    assert isinstance(li, LinkedInScraper)
    assert li.platform_name == "LinkedIn"

    ind = ScraperFactory.get_scraper("indeed")
    assert isinstance(ind, IndeedScraper)
    assert ind.platform_name == "Indeed"

def test_scraper_factory_get_all():
    scrapers = ScraperFactory.get_all_scrapers()
    assert len(scrapers) >= 2
    names = [s.platform_name for s in scrapers]
    assert "LinkedIn" in names
    assert "Indeed" in names

def test_scraper_factory_invalid():
    with pytest.raises(ValueError):
        ScraperFactory.get_scraper("plataforma_inexistente")

def test_linkedin_scraper_filters_out_chapeco_on_remote_search(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    
    html_sample = """
    <ul>
        <li>
            <div class="base-card" data-entity-urn="urn:li:jobPosting:4464361338">
                <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/analista-logistico-chapec%C3%B3-sc-at-frimesa-4464361338"></a>
                <div class="base-search-card__info">
                    <h3 class="base-search-card__title">ANALISTA LOGISTICO - Chapecó/SC</h3>
                    <h4 class="base-search-card__subtitle">Frimesa</h4>
                    <span class="job-search-card__location">Chapecó, SC</span>
                </div>
            </div>
        </li>
    </ul>
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = html_sample
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: mock_resp)

    scraper = LinkedInScraper()
    jobs = scraper.search(keyword="Power BI", location="Brazil", work_type="2", easy_apply=False)
    # Deve rejeitar a vaga de Chapecó na busca de remoto
    assert len(jobs) == 0

def test_linkedin_scraper_accepts_valid_remote(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    
    html_sample = """
    <ul>
        <li>
            <div class="base-card" data-entity-urn="urn:li:jobPosting:9999999999">
                <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/analista-de-dados-remoto-9999999999"></a>
                <div class="base-search-card__info">
                    <h3 class="base-search-card__title">Analista de Dados (Remoto)</h3>
                    <h4 class="base-search-card__subtitle">Tech Corp</h4>
                    <span class="job-search-card__location">Brasil</span>
                </div>
            </div>
        </li>
    </ul>
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = html_sample
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: mock_resp)

    scraper = LinkedInScraper()
    jobs = scraper.search(keyword="Analista de Dados", location="Brazil", work_type="2", easy_apply=False)
    assert len(jobs) == 1
    assert jobs[0].modality == "Remoto"
    assert "🏠 REMOTO" in jobs[0].category

def test_linkedin_scraper_accepts_target_city_presencial(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    
    html_sample = """
    <ul>
        <li>
            <div class="base-card" data-entity-urn="urn:li:jobPosting:8888888888">
                <a class="base-card__full-link" href="https://br.linkedin.com/jobs/view/analista-de-dados-8888888888"></a>
                <div class="base-search-card__info">
                    <h3 class="base-search-card__title">Analista de Dados Júnior</h3>
                    <h4 class="base-search-card__subtitle">Finance Corp</h4>
                    <span class="job-search-card__location">São Paulo, SP</span>
                </div>
            </div>
        </li>
    </ul>
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = html_sample
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: mock_resp)

    scraper = LinkedInScraper()
    jobs = scraper.search(keyword="Analista de Dados", location="São Paulo, Brasil", work_type="1", easy_apply=False)
    assert len(jobs) == 1
    assert jobs[0].modality == "Presencial"
    assert "🏢 PRESENCIAL" in jobs[0].category
