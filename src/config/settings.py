import os
from dataclasses import dataclass, field
from typing import List
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Settings:
    # Credenciais do Telegram
    TELEGRAM_BOT_TOKEN: str = field(default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", "").strip())
    TELEGRAM_CHAT_ID: str = field(default_factory=lambda: os.getenv("TELEGRAM_CHAT_ID", "").strip())

    # Intervalo do loop (em minutos)
    CHECK_INTERVAL_MINUTES: int = field(
        default_factory=lambda: int(os.getenv("CHECK_INTERVAL_MINUTES", "15"))
    )

    # Caminho do banco SQLite
    DATABASE_PATH: str = field(
        default_factory=lambda: os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "vagas.db")
        )
    )

    # Termos de pesquisa principais
    SEARCH_KEYWORDS: List[str] = field(default_factory=lambda: [
        "Power BI",
        "Python",
        "Analista de Dados"
    ])

    # Cidades / Regiões para vagas Presenciais e Híbridas
    TARGET_CITIES: List[str] = field(default_factory=lambda: [
        "Juiz de Fora, Minas Gerais, Brasil",
        "São Paulo, Brasil",
        "Rio de Janeiro, Brasil",
        "Florianópolis, Santa Catarina, Brasil"
    ])

    # GeoID oficial do Brasil no LinkedIn
    BRAZIL_GEO_ID: str = "106057199"

    # Filtro de tempo (24 horas)
    TIME_POSTED_FILTER: str = "r86400"

    # Termos obrigatórios no título para qualificação
    TITLE_MUST_CONTAIN: List[str] = field(default_factory=lambda: [
        "dados", "data", "bi", "power bi", "business intelligence", 
        "analytics", "python", "analista", "dashboard", "relatórios",
        "inteligência", "insights", "database", "banco de dados"
    ])

    # Termos excluídos do título (senioridade incompatível ou outras áreas)
    TITLE_EXCLUDE: List[str] = field(default_factory=lambda: [
        "senior", "sênior", "sr.", "sr ", "lead", "staff", "head of",
        "diretor", "director", "gerente", "manager", "estágio de direito", 
        "enfermagem", "médico", "recepcionista", "farmacêutico", "advogado",
        "professor", "vendedor", "atendente", "motorista"
    ])

    # Localidades brasileiras permitidas
    ALLOWED_LOCATIONS: List[str] = field(default_factory=lambda: [
        "brasil", "brazil", "remoto", "remote", "home office",
        "juiz de fora", "jf", "minas gerais", "mg",
        "são paulo", "sp", "campinas", "santos", "sorocaba", "guarulhos", "abc",
        "rio de janeiro", "rj", "niterói",
        "florianópolis", "floripa", "santa catarina", "sc", "joinville", "blumenau"
    ])

    # Localidades estrangeiras expressamente bloqueadas
    BLOCKED_LOCATIONS: List[str] = field(default_factory=lambda: [
        "estados unidos", "united states", "usa", "new york", "california",
        "texas", "florida", "charlotte", "san diego", "los angeles",
        "arlington", "virginia", "ohio", "alaska", "india", "europe", "colombia",
        "argentina", "portugal", "mexico", "chile"
    ])

# Instância singleton para uso em todo o projeto
settings = Settings()
