import os
from dotenv import load_dotenv

load_dotenv()

# Configurações do Telegram
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "").strip()

# Intervalo padrão de checagem em minutos (modo loop)
CHECK_INTERVAL_MINUTES = int(os.getenv("CHECK_INTERVAL_MINUTES", "15"))

# Caminho do banco de dados SQLite
DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vagas.db")

# Palavras-chave exatas definidas pelo usuário (SQL removido)
SEARCH_KEYWORDS = [
    "Power BI",
    "Python",
    "Analista de Dados"
]

# Cidades / Regiões para vagas Presenciais e Híbridas
TARGET_CITIES = [
    "Juiz de Fora, Minas Gerais, Brasil",
    "São Paulo, Brasil",
    "Rio de Janeiro, Brasil",
    "Florianópolis, Santa Catarina, Brasil"
]

# GeoID do Brasil no LinkedIn
BRAZIL_GEO_ID = "106057199"

# Filtro de tempo no LinkedIn: últimas 24 horas
TIME_POSTED_FILTER = "r86400"

# Palavras-chave obrigatórias no título para garantir relevância
TITLE_MUST_CONTAIN = [
    "dados", "data", "bi", "power bi", "business intelligence", 
    "analytics", "python", "analista", "dashboard", "relatórios",
    "inteligência", "insights", "database", "banco de dados"
]

# Termos para ignorar automaticamente no título (cargos fora de escopo)
TITLE_EXCLUDE = [
    "senior", "sênior", "sr.", "sr ", "lead", "staff", "head of",
    "diretor", "director", "gerente", "manager", "estágio de direito", 
    "enfermagem", "médico", "recepcionista", "farmacêutico", "advogado",
    "professor", "vendedor", "atendente", "motorista"
]

# Localidades permitidas para validação geográfica rigorosa
ALLOWED_LOCATIONS = [
    "brasil", "brazil", "remoto", "remote", "home office",
    "juiz de fora", "jf", "minas gerais", "mg",
    "são paulo", "sp", "campinas", "santos", "sorocaba", "guarulhos", "abc",
    "rio de janeiro", "rj", "niterói",
    "florianópolis", "floripa", "santa catarina", "sc", "joinville", "blumenau"
]

# Bloqueio de localidades estrangeiras
BLOCKED_LOCATIONS = [
    "estados unidos", "united states", "usa", "new york", "california",
    "texas", "florida", "charlotte", "san diego", "los angeles",
    "arlington", "virginia", "ohio", "alaska", "india", "europe", "colombia", "argentina", "portugal", "mexico"
]
