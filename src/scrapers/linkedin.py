import re
import time
import random
import requests
from bs4 import BeautifulSoup
from typing import List

from src.scrapers.base import BaseScraper
from src.models.job import Job
from src.config.settings import settings
from src.utils.filters import clean_url, is_title_relevant, is_location_relevant
from src.utils.logger import logger

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
]

class LinkedInScraper(BaseScraper):
    """Scraper para o LinkedIn Guest Job Search API."""

    @property
    def platform_name(self) -> str:
        return "LinkedIn"

    def _extract_job_id(self, card_element, url: str) -> str:
        # 1. Tenta extrair do data-entity-urn
        base_card = card_element.find("div", {"class": re.compile(r"base-card|job-search-card")}) or card_element
        entity_urn = base_card.get("data-entity-urn")
        if entity_urn:
            match = re.search(r"urn:li:jobPosting:(\d+)", entity_urn)
            if match:
                return f"li_{match.group(1)}"

        # 2. Tenta extrair do data-id
        data_id = base_card.get("data-id")
        if data_id:
            return f"li_{data_id}"

        # 3. Tenta extrair o ID numérico final da URL (mesmo com slug longo /view/cargo-empresa-123456789)
        if url:
            match = re.search(r"(?:view/|currentJobId=)?.*?(\d{8,12})\b", url)
            if match:
                return f"li_{match.group(1)}"

        return f"li_{abs(hash(clean_url(url)))}"

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
        base_url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
        jobs: List[Job] = []
        is_remote = (work_type == "2")

        for page in range(max_pages):
            start = page * 25
            params = {
                "keywords": keyword,
                "location": location,
                "geoId": settings.BRAZIL_GEO_ID,
                "sortBy": "DD",
                "start": start
            }

            if settings.TIME_POSTED_FILTER:
                params["f_TPR"] = settings.TIME_POSTED_FILTER

            if work_type:
                params["f_WT"] = work_type

            if easy_apply:
                params["f_AL"] = "true"

            headers = {
                "User-Agent": random.choice(USER_AGENTS),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
                        cleaned_link = clean_url(raw_link)

                        date_elem = card.find("time")
                        post_date = date_elem.get_text(strip=True) if date_elem else "Recente"

                        job_id = self._extract_job_id(card, cleaned_link)

                        if job_id and cleaned_link:
                            job = Job(
                                id=job_id,
                                title=title,
                                company=company,
                                location=job_location,
                                link=cleaned_link,
                                date_posted=post_date,
                                search_term=keyword,
                                modality=modality_name,
                                easy_apply=easy_apply,
                                category=category_name,
                                platform=self.platform_name
                            )
                            jobs.append(job)
                    except Exception:
                        continue

                time.sleep(random.uniform(0.8, 1.5))

            except requests.RequestException as e:
                logger.debug(f"[LinkedIn] Erro de requisição: {e}")
                break

        return jobs
