from abc import ABC, abstractmethod
from typing import List
from src.models.job import Job

class BaseScraper(ABC):
    """Classe base abstrata para todos os scrapers de plataformas de emprego."""

    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Nome legível da plataforma (ex: 'LinkedIn', 'Indeed', 'Gupy')."""
        pass

    @abstractmethod
    def search(
        self,
        keyword: str,
        location: str = "Brazil",
        work_type: str = "2",
        easy_apply: bool = False,
        category_name: str = "Geral",
        modality_name: str = "Remoto",
        max_pages: int = 1
    ) -> List[Job]:
        """
        Executa a busca de vagas na respectiva plataforma.
        
        Args:
            keyword: Palavra-chave (ex: 'Power BI')
            location: Localização desejada (ex: 'São Paulo, Brasil')
            work_type: '2' (Remoto), '3' (Híbrido), '1' (Presencial)
            easy_apply: Flag de candidatura simplificada
            category_name: Nome formatado da categoria
            modality_name: Nome amigável da modalidade
            max_pages: Quantidade de páginas a consultar
            
        Returns:
            Lista de objetos Job qualificados.
        """
        pass
