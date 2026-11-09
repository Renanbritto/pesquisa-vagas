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

def test_gupy_scraper_search_success(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    from src.scrapers.gupy import GupyScraper

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "data": [
            {
                "id": 123456,
                "name": "Analista de Dados Pleno",
                "careerPageName": "Tech Ltda",
                "city": "São Paulo",
                "state": "São Paulo",
                "country": "Brasil",
                "jobUrl": "https://tech.gupy.io/job/123456",
                "publishedDate": "2026-10-06T12:00:00.000Z",
                "workplaceType": "remote"
            },
            {
                "id": 999999,
                "name": "Gerente de Vendas Sênior",
                "careerPageName": "Outra Empresa",
                "workplaceType": "remote"
            }
        ],
        "pagination": {"total": 2, "limit": 50, "offset": 0}
    }
    monkeypatch.setattr(requests, "get", lambda *args, **kwargs: mock_resp)

    scraper = GupyScraper()
    jobs = scraper.search(keyword="Analista de Dados", work_type="2", location="Brasil")
    # Deve aceitar 'Analista de Dados Pleno' e rejeitar 'Gerente de Vendas Sênior'
    assert len(jobs) == 1
    assert jobs[0].id == "123456"
    assert jobs[0].title == "Analista de Dados Pleno"
    assert jobs[0].company == "Tech Ltda"
    assert jobs[0].modality == "Remoto"
    assert jobs[0].platform == "Gupy"
    assert jobs[0].link == "https://tech.gupy.io/job/123456"

def test_linkedin_scraper_accepts_portugal_jobs(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    from src.config.settings import settings
    
    html_sample = """
    <ul>
        <li>
            <div class="base-card" data-entity-urn="urn:li:jobPosting:7777777777">
                <a class="base-card__full-link" href="https://pt.linkedin.com/jobs/view/analista-de-dados-remoto-lisboa-7777777777"></a>
                <div class="base-search-card__info">
                    <h3 class="base-search-card__title">Analista de Dados (Remoto)</h3>
                    <h4 class="base-search-card__subtitle">Lisbon Tech</h4>
                    <span class="job-search-card__location">Portugal</span>
                </div>
            </div>
        </li>
    </ul>
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = html_sample
    captured_params = {}
    def mock_get(url, params=None, **kwargs):
        captured_params.update(params or {})
        return mock_resp

    monkeypatch.setattr(requests, "get", mock_get)

    scraper = LinkedInScraper()
    jobs = scraper.search(keyword="Analista de Dados", location="Portugal", work_type="2", easy_apply=False)
    assert len(jobs) == 1
    assert jobs[0].location == "Portugal"
    assert jobs[0].modality == "Remoto"
    assert captured_params.get("geoId") == settings.PORTUGAL_GEO_ID

def test_indeed_scraper_uses_pt_endpoint_for_portugal(monkeypatch):
    from unittest.mock import MagicMock
    import requests
    
    xml_sample = """<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
        <channel>
            <item>
                <title>Analista de Dados Júnior</title>
                <link>https://pt.indeed.com/viewjob?jk=pt123456</link>
                <source>Porto Analytics</source>
                <guid>pt123456</guid>
                <pubDate>Mon, 09 Nov 2026 10:00:00 GMT</pubDate>
                <description>Vaga em Porto, Portugal (Remoto)</description>
            </item>
        </channel>
    </rss>
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = xml_sample.encode("utf-8")
    captured_url = []
    def mock_get(url, **kwargs):
        captured_url.append(url)
        return mock_resp

    monkeypatch.setattr(requests, "get", mock_get)

    scraper = IndeedScraper()
    jobs = scraper.search(keyword="Analista de Dados", location="Portugal", work_type="2", easy_apply=False)
    assert len(jobs) == 1
    assert "pt.indeed.com" in captured_url[0]
    assert jobs[0].company == "Porto Analytics"

