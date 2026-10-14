import requests
import unicodedata
from typing import List
from src.scrapers.base import BaseScraper
from src.models.job import Job
from src.utils.filters import is_title_relevant
from src.utils.logger import logger

def _strip_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

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
        
        url = "https://portal.gupy.io/api/job-search/jobs"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "pt-BR,pt;q=0.9",
            "Referer": "https://portal.gupy.io/job-search"
        }
        
        max_pages_to_fetch = 10
        
        for page in range(max_pages_to_fetch):
            params = {
                "jobName": keyword,
                "limit": limit_per_page,
                "offset": page * limit_per_page
            }
            if workplace_types:
                params["workplaceType"] = workplace_types[0]
            
            try:
                response = requests.get(url, params=params, headers=headers, timeout=15)
                if response.status_code != 200:
                    logger.warning(f"[{self.platform_name}] Erro na requisição: HTTP {response.status_code}")
                    break
                
                resp_json = response.json()
                data = resp_json.get("data", [])
                if not data:
                    break
                
                for item in data:
                    job_title = item.get("name", "Sem título")
                    if not is_title_relevant(job_title):
                        continue
                        
                    raw_modality = item.get("workplaceType", "Indefinido")
                    if workplace_types and raw_modality not in workplace_types:
                        continue
                        
                    job_city = item.get("city", "")
                    job_state = item.get("state", "")
                    job_country = item.get("country", "")
                    job_location = ", ".join(filter(None, [job_city, job_state, job_country]))
                    if not job_location:
                        job_location = "Brasil"
                        
                    if location.lower() not in ["brasil", "brazil", "qualquer"]:
                        loc_main = _strip_accents(location.split(",")[0].strip().lower())
                        job_loc_clean = _strip_accents(job_location.lower())
                        
                        if loc_main not in job_loc_clean:
                            continue
                    
                    modality_display = {
                        "remote": "Remoto",
                        "hybrid": "Híbrido",
                        "on-site": "Presencial"
                    }.get(raw_modality.lower(), raw_modality.capitalize())
                    
                    job_id = str(item.get("id", ""))
                    job_link = item.get("jobUrl") or f"https://portal.gupy.io/job-search/id={job_id}"
                    
                    job = Job(
                        id=job_id,
                        title=job_title,
                        company=item.get("careerPageName", "Empresa Confidencial"),
                        location=job_location,
                        link=job_link,
                        date_posted=item.get("publishedDate", "Recente"),
                        search_term=keyword,
                        modality=modality_display,
                        easy_apply=False,
                        category=category_name,
                        platform=self.platform_name
                    )
                    jobs.append(job)
                
                total_in_api = resp_json.get("pagination", {}).get("total", 0)
                if (page + 1) * limit_per_page >= total_in_api:
                    break
                    
            except Exception as e:
                logger.error(f"[{self.platform_name}] Erro: {e}")
                break
                
        return jobs
