import requests
from typing import List
from src.scrapers.base import BaseScraper
from src.models.job import Job
from src.utils.filters import is_title_relevant

class GupyScraper(BaseScraper):
    @property
    def platform_name(self) -> str:
        return "Gupy"

    def search(
        self,
        keyword: str,
        location: str = "Brasil",
        work_type: str = "2",
        easy_apply: bool = False,
        category_name: str = "Geral",
        modality_name: str = "Remoto",
        max_pages: int = 1
    ) -> List[Job]:
        jobs: List[Job] = []
        limit_per_page = 50
        
        workplace_types = []
        if work_type == "2":
            workplace_types.append("remote")
        elif work_type == "3":
            workplace_types.append("hybrid")
        elif work_type == "1":
            workplace_types.append("on-site")
        
        url = "https://employability-portal.gupy.io/api/v1/jobs"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
        }
        
        # Como a Gupy não aceita mais os filtros na API (ex: workplaceTypes), 
        # precisamos buscar mais páginas para aplicar o filtro localmente sem perder vagas.
        max_pages_to_fetch = 20 # Limite de 1000 vagas por termo
        
        for page in range(max_pages_to_fetch):
            params = {
                "jobName": keyword,
                "limit": limit_per_page,
                "offset": page * limit_per_page
            }
            
            try:
                response = requests.get(url, params=params, headers=headers, timeout=15)
                if response.status_code != 200:
                    break
                
                data = response.json().get("data", [])
                if not data:
                    break
                
                for item in data:
                    job_title = item.get("name", "Sem título")
                    if not is_title_relevant(job_title):
                        continue
                        
                    job_modality = item.get("workplaceType", "Indefinido")
                    
                    if workplace_types and job_modality not in workplace_types:
                        continue
                        
                    job_city = item.get("city", "")
                    job_state = item.get("state", "")
                    job_country = item.get("country", "")
                    job_location = ", ".join(filter(None, [job_city, job_state, job_country]))
                    if not job_location:
                        job_location = "Brasil"
                        
                    if location.lower() not in ["brasil", "brazil", "qualquer"]:
                        # Tenta extrair a cidade principal do local buscado e remove acentos
                        import unicodedata
                        def strip_accents(s):
                            return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
                        
                        loc_main = strip_accents(location.split(",")[0].strip().lower())
                        job_loc_clean = strip_accents(job_location.lower())
                        
                        if loc_main not in job_loc_clean:
                            continue
                    
                    job = Job(
                        id=str(item.get("id", "")),
                        title=job_title,
                        company=item.get("careerPageName", "Empresa Confidencial"),
                        location=job_location,
                        link=item.get("jobUrl", ""),
                        date_posted=item.get("publishedDate", "Recente"),
                        search_term=keyword,
                        modality=job_modality.capitalize(),
                        easy_apply=False,
                        category=category_name,
                        platform=self.platform_name
                    )
                    jobs.append(job)
                    
            except Exception as e:
                print(f"[{self.platform_name}] Erro: {e}")
                break
                
        return jobs
