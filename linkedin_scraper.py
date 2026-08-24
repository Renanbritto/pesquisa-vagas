import re
import urllib.parse
import requests
from bs4 import BeautifulSoup
import time
import random
from config import (
    BRAZIL_GEO_ID, TIME_POSTED_FILTER,
    TITLE_MUST_CONTAIN, TITLE_EXCLUDE, ALLOWED_LOCATIONS, BLOCKED_LOCATIONS
)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
]

def clean_linkedin_url(url: str) -> str:
    """Remove parâmetros extras da URL para manter o link limpo e direto."""
    if not url:
        return ""
    parsed = urllib.parse.urlparse(url)
    clean_path = parsed.path.split('?')[0]
    return f"https://www.linkedin.com{clean_path}" if not clean_path.startswith("http") else clean_path

def extract_job_id(element, url: str) -> str:
    """Extrai o ID exclusivo da vaga."""
    base_card = element.find("div", {"class": re.compile(r"base-card|job-search-card")}) or element
    entity_urn = base_card.get("data-entity-urn")
    if entity_urn:
        match = re.search(r"urn:li:jobPosting:(\d+)", entity_urn)
        if match:
            return match.group(1)
            
    data_id = base_card.get("data-id")
    if data_id:
        return str(data_id)
        
    if url:
        match = re.search(r"(?:view/|currentJobId=)(\d+)", url)
        if match:
            return match.group(1)
            
    return str(abs(hash(clean_linkedin_url(url))))

def is_title_relevant(title: str) -> bool:
    """Garante que a vaga é estritamente relevante e não é de cargos excluídos."""
    title_lower = title.lower()
    
    # 1. Rejeita títulos excluídos (ex: senior, diretores, fora de tech/dados)
    for excluded in TITLE_EXCLUDE:
        if excluded in title_lower:
            return False
            
    # 2. Deve conter pelo menos um termo chave no título
    if TITLE_MUST_CONTAIN:
        matches = any(required in title_lower for required in TITLE_MUST_CONTAIN)
        if not matches:
            return False
            
    return True

def is_location_relevant(location: str, is_remote_search: bool = False) -> bool:
    """Garante que a localização é estritamente do Brasil ou cidade desejada."""
    loc_lower = location.lower()
    
    # 1. Bloqueia qualquer localidade no exterior
    for blocked in BLOCKED_LOCATIONS:
        if blocked in loc_lower:
            return False
            
    # Se for busca remota nacional e a localização for geral ou remota no Brasil
    if is_remote_search:
        return True
        
    # 2. Para buscas presenciais/híbridas, valida se está nas cidades/estados permitidos
    if loc_lower and loc_lower != "local não especificado":
        matches = any(allowed in loc_lower for allowed in ALLOWED_LOCATIONS)
        if not matches:
            return False
            
    return True

def fetch_linkedin_jobs_categorized(
    keyword: str, 
    location: str = "Brazil", 
    work_type: str = "2", 
    easy_apply: bool = False,
    category_name: str = "Geral",
    modalidade_nome: str = "Remoto",
    max_pages: int = 1
) -> list:
    """
    Busca vagas no LinkedIn parametrizadas por modalidade e Easy Apply.
    - work_type: "2" = Remoto | "3" = Híbrido | "1" = Presencial
    - easy_apply: True -> f_AL=true | False -> sem restrição de Easy Apply
    """
    base_url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    jobs = []
    
    is_remote = (work_type == "2")
    
    for page in range(max_pages):
        start = page * 25
        params = {
            "keywords": keyword,
            "location": location,
            "geoId": BRAZIL_GEO_ID,
            "sortBy": "DD",  # Mais recentes primeiro
            "start": start
        }
        
        if TIME_POSTED_FILTER:
            params["f_TPR"] = TIME_POSTED_FILTER
            
        if work_type:
            params["f_WT"] = work_type
            
        if easy_apply:
            params["f_AL"] = "true"
            
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://www.linkedin.com/jobs"
        }
        
        try:
            response = requests.get(base_url, params=params, headers=headers, timeout=12)
            
            if response.status_code != 200:
                break
                
            soup = BeautifulSoup(response.text, "html.parser")
            job_cards = soup.find_all("li")
            
            if not job_cards:
                break
                
            for card in job_cards:
                try:
                    title_elem = card.find("h3", class_=re.compile(r"base-search-card__title"))
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)
                    
                    if not is_title_relevant(title):
                        continue
                    
                    location_elem = card.find("span", class_=re.compile(r"job-search-card__location"))
                    job_location = location_elem.get_text(strip=True) if location_elem else location
                    
                    if not is_location_relevant(job_location, is_remote_search=is_remote):
                        continue
                    
                    company_elem = card.find("h4", class_=re.compile(r"base-search-card__subtitle"))
                    company = company_elem.get_text(strip=True) if company_elem else "Empresa Confidencial"
                    
                    link_elem = card.find("a", class_=re.compile(r"base-card__full-link"))
                    raw_link = link_elem["href"] if link_elem and "href" in link_elem.attrs else ""
                    clean_link = clean_linkedin_url(raw_link)
                    
                    date_elem = card.find("time")
                    post_date = date_elem.get_text(strip=True) if date_elem else "Recente"
                    
                    job_id = extract_job_id(card, clean_link)
                    
                    if job_id and clean_link:
                        jobs.append({
                            "id": job_id,
                            "titulo": title,
                            "empresa": company,
                            "localizacao": job_location,
                            "link": clean_link,
                            "data_postagem": post_date,
                            "termo_busca": keyword,
                            "modalidade": modalidade_nome,
                            "easy_apply": easy_apply,
                            "categoria": category_name
                        })
                except Exception:
                    continue
                    
            time.sleep(random.uniform(0.8, 1.6))
            
        except requests.RequestException:
            break
            
    return jobs
