import re
import unicodedata

def extrair_senioridade(titulo: str) -> str:
    """Extrai a senioridade da vaga a partir do título."""
    if not titulo:
        return "indefinido"

    t = titulo.lower()

    if re.search(r"\b(?:est[aá]gio|estagi[aá]ri[oa]|intern|trainee)\b", t):
        return "estagio"
    if re.search(r"\b(?:j[uú]nior|jr\.?|entry)\b", t):
        return "junior"
    if re.search(r"\b(?:pleno|pl\.?|mid)\b", t):
        return "pleno"
    if re.search(r"\b(?:s[eê]nior|sr\.?)\b", t):
        return "senior"
    if re.search(r"\b(?:lead|tech lead|especialista|specialist|principal|staff)\b", t):
        return "lead"

    return "indefinido"

def extrair_modalidade(modalidade_str: str) -> str:
    """Normaliza a modalidade de trabalho para o enum do banco."""
    if not modalidade_str:
        return "indefinido"

    m = modalidade_str.lower()

    if "remot" in m or "home office" in m or "teletrabalho" in m:
        return "remoto"
    if "h[ií]brid" in m or "hybrid" in m:
        return "hibrido"
    if "presenc" in m or "site" in m or "local" in m:
        return "presencial"

    return "indefinido"

def gerar_cidade_slug(localizacao: str) -> str:
    """Normaliza a cidade para slug sem acentos (ex: 'São Paulo, SP' -> 'sao-paulo')."""
    if not localizacao:
        return ""

    # Pega apenas a primeira parte antes de vírgula, hífen ou barra
    primeira_parte = re.split(r"[,/\\-]", localizacao)[0].strip()

    # Remove acentos
    nfkd = unicodedata.normalize("NFKD", primeira_parte)
    sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)]).lower()

    # Mantém apenas letras, números e espaços, substituindo espaços por hífens
    slug = re.sub(r"[^a-z0-9\s]", "", sem_acento)
    slug = re.sub(r"\s+", "-", slug).strip("-")

    return slug
