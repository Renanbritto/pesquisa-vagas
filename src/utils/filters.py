import urllib.parse
from src.config.settings import settings

def clean_url(url: str) -> str:
    """Remove parâmetros de rastreamento (tracking) da URL."""
    if not url:
        return ""
    parsed = urllib.parse.urlparse(url)
    clean_path = parsed.path.split("?")[0]
    if not clean_path.startswith("http"):
        if "linkedin.com" in parsed.netloc:
            return f"https://www.linkedin.com{clean_path}"
        elif "indeed.com" in parsed.netloc:
            return f"https://br.indeed.com{clean_path}"
    return f"{parsed.scheme}://{parsed.netloc}{clean_path}" if parsed.netloc else url

def is_title_relevant(title: str) -> bool:
    """Verifica se o título da vaga é relevante e não contém palavras excluídas."""
    if not title:
        return False
    title_lower = title.lower()

    # 1. Verifica termos excluídos (ex: senior, diretores, fora de tech)
    for excluded in settings.TITLE_EXCLUDE:
        if excluded in title_lower:
            return False

    # 2. Verifica se contém pelo menos uma palavra-chave permitida
    if settings.TITLE_MUST_CONTAIN:
        matches = any(required in title_lower for required in settings.TITLE_MUST_CONTAIN)
        if not matches:
            return False

    return True

def is_location_relevant(location: str, is_remote_search: bool = False) -> bool:
    """Verifica se a localização da vaga pertence ao Brasil e às regiões permitidas."""
    if not location:
        return is_remote_search

    loc_lower = location.lower()

    # 1. Bloqueia qualquer localidade no exterior
    for blocked in settings.BLOCKED_LOCATIONS:
        if blocked in loc_lower:
            return False

    # 2. Se for busca remota nacional e não for de fora, é válida
    if is_remote_search:
        return True

    # 3. Para vagas presenciais/híbridas, valida se está nas cidades/estados permitidos
    if loc_lower and loc_lower != "local não especificado":
        matches = any(allowed in loc_lower for allowed in settings.ALLOWED_LOCATIONS)
        if not matches:
            return False

    return True
