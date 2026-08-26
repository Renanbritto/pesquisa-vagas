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
