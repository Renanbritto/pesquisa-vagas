import re
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
    """
    Verifica se o título da vaga é estritamente relevante para nível Júnior / Pleno
    e não contém níveis sênior, liderança ou áreas fora de dados/tech.
    """
    if not title:
        return False
    title_lower = title.lower()

    # 1. Filtro Rígido de Exclusão (Senioridade alta, Especialistas, Gestão e outras áreas)
    for excluded in settings.TITLE_EXCLUDE:
        if excluded in title_lower:
            return False

    # Regex extra para detectar variações de 'sr' como palavra isolada (ex: 'analista sr', 'power bi - sr')
    if re.search(r"\b(sr|snr|sr\.|iii|iv|v|lead|staff|head)\b", title_lower):
        return False

    # 2. Verifica se contém pelo menos uma palavra-chave permitida da área
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

def is_modality_compatible(title: str, location: str, target_work_type: str) -> bool:
    """
    Validação rigorosa de modalidade para impedir que vagas presenciais ou híbridas
    sejam classificadas erroneamente como Remoto (Home Office).
    
    target_work_type:
      '2' = Remoto (Home Office estrito)
      '3' = Híbrido
      '1' = Presencial
    """
    text_to_check = f"{title or ''} {location or ''}".lower()

    # Cues explícitos de Presencial
    presencial_cues = [
        "presencial", "on-site", "onsite", "in-office", "in loco",
        "100% presencial", "no escritório", "no escritorio",
        "modelo presencial", "vaga presencial", "atuação presencial", "atuacao presencial"
    ]

    # Cues explícitos de Híbrido
    hibrido_cues = [
        "híbrido", "hibrido", "hybrid", "híbrida", "hibrida", "modelo híbrido", "modelo hibrido"
    ]

    # Cues explícitos de Remoto
    remoto_cues = [
        "100% remoto", "totalmente remoto", "exclusivamente remoto",
        "remoto", "remote", "home office", "home-office", "teletrabalho"
    ]

    has_presencial = any(cue in text_to_check for cue in presencial_cues)
    has_hibrido = any(cue in text_to_check for cue in hibrido_cues)
    has_remoto = any(cue in text_to_check for cue in remoto_cues)

    # 1. Validação para Categoria REMOTO ('2')
    if target_work_type == "2":
        # Se contiver qualquer menção a presencial ou híbrido, REJEITA imediatamente da categoria Remoto
        if has_presencial or has_hibrido:
            return False
        return True

    # 2. Validação para Categoria HÍBRIDO ('3')
    if target_work_type == "3":
        # Se for explicitamente '100% presencial' sem híbrido, ou '100% remoto', rejeita
        if "100% presencial" in text_to_check or "100% remoto" in text_to_check:
            return False
        return True

    # 3. Validação para Categoria PRESENCIAL ('1')
    if target_work_type == "1":
        # Se for explicitamente '100% remoto' ou 'home office', rejeita de presencial
        if "100% remoto" in text_to_check or "100% home office" in text_to_check:
            return False
        return True

    return True
