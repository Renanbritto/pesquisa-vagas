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
    """Verifica se a localização da vaga pertence estritamente ao Brasil e às regiões permitidas."""
    if not location:
        return is_remote_search

    loc_lower = location.lower()

    # 1. Bloqueia rigorosamente qualquer localidade/país no exterior
    for blocked in settings.BLOCKED_LOCATIONS:
        if blocked in loc_lower:
            return False

    # 2. Se for busca remota, valida se contém indicadores válidos de Brasil / Home Office
    if is_remote_search:
        has_allowed = any(allowed in loc_lower for allowed in settings.ALLOWED_LOCATIONS)
        if not has_allowed:
            return False
        return True

    # 3. Para vagas presenciais/híbridas, valida se está nas cidades/estados permitidos
    if loc_lower and loc_lower != "local não especificado":
        matches = any(allowed in loc_lower for allowed in settings.ALLOWED_LOCATIONS)
        if not matches:
            return False

    return True

def is_target_city(location: str) -> bool:
    """Verifica se a localização pertence especificamente às cidades-alvo do usuário."""
    if not location:
        return False
    loc_lower = location.lower()
    target_names = [
        "juiz de fora", "jf",
        "são paulo", "sao paulo", "sp",
        "rio de janeiro", "rj",
        "florianópolis", "florianopolis", "floripa"
    ]
    for city in settings.TARGET_CITIES:
        base = city.split(",")[0].strip().lower()
        if base in loc_lower:
            return True
    return any(t in loc_lower for t in target_names)

def classify_job_modality(title: str, location: str, search_modality: str = "") -> str:
    """
    Classifica a modalidade real da vaga ('Remoto', 'Híbrido' ou 'Presencial')
    com base em análise semântica rigorosa do título e localização.
    """
    t_lower = (title or "").lower()
    l_lower = (location or "").lower()
    full_text = f"{t_lower} {l_lower}"

    # 1. Cues explícitos de Híbrido
    hibrido_cues = ["híbrido", "hibrido", "hybrid", "híbrida", "hibrida", "modelo híbrido", "modelo hibrido"]
    if any(cue in full_text for cue in hibrido_cues):
        return "Híbrido"

    # 2. Cues explícitos de Remoto
    remoto_cues = [
        "100% remoto", "totalmente remoto", "exclusivamente remoto",
        "remoto", "remote", "home office", "home-office", "teletrabalho", "anywhere"
    ]
    has_remoto_cue = any(cue in full_text for cue in remoto_cues)

    # 3. Cues explícitos de Presencial
    presencial_cues = [
        "presencial", "on-site", "onsite", "in-office", "in loco",
        "100% presencial", "no escritório", "no escritorio",
        "modelo presencial", "vaga presencial", "atuação presencial", "atuacao presencial"
    ]
    has_presencial_cue = any(cue in full_text for cue in presencial_cues)

    # 4. Detecção de cidade física/UF no título (ex: "- Chapecó/SC", "- Juiz de Fora", "/SC", "/MG")
    has_city_in_title = bool(re.search(
        r"[-–—/]\s*[^/]+/(?:AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b",
        title or "",
        re.IGNORECASE
    ))

    # Se tiver ambos menção a remoto e presencial -> Híbrido
    if has_remoto_cue and has_presencial_cue:
        return "Híbrido"

    # Se tiver presencial ou cidade física no título, e não tiver menção a remoto -> Presencial
    if (has_presencial_cue or has_city_in_title) and not has_remoto_cue:
        return "Presencial"

    # Se tiver menção explícita a remoto -> Remoto
    if has_remoto_cue:
        return "Remoto"

    # 5. Avaliação pela localização quando não há termos explícitos no título
    generic_remote_locations = [
        "brasil", "brazil", "remoto", "remote", "home office", "teletrabalho",
        "todo o brasil", "brazil (remote)", "brasil (remoto)"
    ]
    clean_loc = l_lower.strip()
    if clean_loc in generic_remote_locations or clean_loc.startswith("remoto"):
        if search_modality in ["Remoto", "Híbrido", "Presencial"]:
            return search_modality
        return "Remoto"

    # Se a localização especificar uma cidade física específica sem menção de remoto -> É presencial
    return "Presencial"

def build_category_name(modality: str, easy_apply: bool) -> str:
    """Gera o nome formatado da categoria para exibição no Telegram e persistência no banco."""
    apply_suffix = "⚡ EASY APPLY (SIMPLIFICADA)" if easy_apply else "🌐 SITE DA EMPRESA"
    if modality == "Remoto":
        return f"🏠 REMOTO | {apply_suffix}"
    elif modality == "Híbrido":
        return f"🏢🔄 HÍBRIDO | {apply_suffix}"
    else:
        return f"🏢 PRESENCIAL | {apply_suffix}"

def is_modality_compatible(title: str, location: str, target_work_type: str, detected_modality: str = None) -> bool:
    """
    Validação rigorosa de modalidade para impedir que vagas presenciais ou híbridas
    sejam classificadas erroneamente como Remoto (Home Office).
    
    target_work_type:
      '2' = Remoto (Home Office estrito)
      '3' = Híbrido
      '1' = Presencial
    """
    if detected_modality is None:
        search_mod = "Remoto" if target_work_type == "2" else ("Híbrido" if target_work_type == "3" else "Presencial")
        detected_modality = classify_job_modality(title, location, search_modality=search_mod)

    # 1. Validação para Categoria REMOTO ('2')
    if target_work_type == "2":
        return detected_modality == "Remoto"

    # 2. Validação para Categoria HÍBRIDO ('3')
    if target_work_type == "3":
        text_to_check = f"{title or ''} {location or ''}".lower()
        if "100% presencial" in text_to_check or "100% remoto" in text_to_check:
            return False
        return detected_modality in ["Híbrido", "Remoto"]

    # 3. Validação para Categoria PRESENCIAL ('1')
    if target_work_type == "1":
        text_to_check = f"{title or ''} {location or ''}".lower()
        if "100% remoto" in text_to_check or "100% home office" in text_to_check:
            return False
        return detected_modality in ["Presencial", "Híbrido"]

    return True
