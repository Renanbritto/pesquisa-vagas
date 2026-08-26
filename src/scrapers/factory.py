from typing import List, Dict, Type
from src.scrapers.base import BaseScraper
from src.scrapers.linkedin import LinkedInScraper
from src.scrapers.indeed import IndeedScraper

class ScraperFactory:
    """Fábrica para gerenciamento e instanciação de scrapers registrados."""

    _SCRAPERS: Dict[str, Type[BaseScraper]] = {
        "linkedin": LinkedInScraper,
        "indeed": IndeedScraper
    }

    @classmethod
    def get_scraper(cls, name: str) -> BaseScraper:
        """Retorna uma instância do scraper pelo nome."""
        scraper_cls = cls._SCRAPERS.get(name.lower())
        if not scraper_cls:
            raise ValueError(f"Scraper '{name}' não encontrado. Disponíveis: {list(cls._SCRAPERS.keys())}")
        return scraper_cls()

    @classmethod
    def get_all_scrapers(cls) -> List[BaseScraper]:
        """Retorna instâncias de todos os scrapers registrados."""
        return [scraper_cls() for scraper_cls in cls._SCRAPERS.values()]

    @classmethod
    def register_scraper(cls, name: str, scraper_cls: Type[BaseScraper]) -> None:
        """Permite que a comunidade registre novos scrapers dinamicamente."""
        cls._SCRAPERS[name.lower()] = scraper_cls
