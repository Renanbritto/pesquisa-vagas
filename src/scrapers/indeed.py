import re
import random
import requests
import xml.etree.ElementTree as ET
from typing import List

from src.scrapers.base import BaseScraper
from src.models.job import Job
from src.utils.filters import clean_url, is_title_relevant, is_location_relevant, is_modality_compatible
from src.utils.logger import logger

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
]

class IndeedScraper(BaseScraper):
    """Scraper para o Indeed Brasil utilizando RSS Feeds e consultas abertas."""

    @property
    def platform_name(self) -> str:
        return "Indeed"

    def _extract_indeed_id(self, link: str, guid: str = None) -> str:
        if guid and not guid.startswith("http"):
            return f"ind_{guid}"
        match = re.search(r"[?&]jk=([a-zA-Z0-9]+)", link or "")
        if match:
            return f"ind_{match.group(1)}"
        return f"ind_{abs(hash(clean_url(link)))}"

    def _search_via_rss(
        self,
        keyword: str,
        location: str,
        work_type: str,
        easy_apply: bool,
        category_name: str,
        modality_name: str
    ) -> List[Job]:
        """Consulta o feed RSS oficial do Indeed Brasil."""
        query = keyword
        if work_type == "2":
            query += " remoto"
        elif work_type == "3":
            query += " hibrido"

        loc_query = "Brasil" if work_type == "2" else location.split(",")[0].strip()
        url = "https://br.indeed.com/rss"
        params = {
            "q": query,
            "l": loc_query,
            "sort": "date",
            "fromage": "1"
        }

        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
            "Accept-Language": "pt-BR,pt;q=0.9"
        }

        jobs: List[Job] = []
        is_remote = (work_type == "2")

        try:
            response = requests.get(url, params=params, headers=headers, timeout=12)
            if response.status_code != 200:
                return jobs

            root = ET.fromstring(response.content)
            channel = root.find("channel")
            if channel is None:
                return jobs

            for item in channel.findall("item"):
                try:
                    title_elem = item.find("title")
                    title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
                    if not is_title_relevant(title):
                        continue

                    link_elem = item.find("link")
                    raw_link = link_elem.text.strip() if link_elem is not None and link_elem.text else ""
                    cleaned_link = clean_url(raw_link)

                    source_elem = item.find("source")
                    company = source_elem.text.strip() if source_elem is not None and source_elem.text else "Empresa Confidencial"

                    guid_elem = item.find("guid")
                    guid = guid_elem.text.strip() if guid_elem is not None and guid_elem.text else ""

                    date_elem = item.find("pubDate")
                    post_date = date_elem.text.strip() if date_elem is not None and date_elem.text else "Recente"

                    desc_elem = item.find("description")
                    desc_text = desc_elem.text if desc_elem is not None and desc_elem.text else ""
                    job_location = loc_query

                    if not is_location_relevant(job_location, is_remote_search=is_remote):
                        continue

                    # Validação de modalidade estrita
                    if not is_modality_compatible(f"{title} {desc_text}", job_location, work_type):
                        continue

                    job_id = self._extract_indeed_id(cleaned_link, guid)
                    
                    has_easy_apply = ("candidatura simplificada" in desc_text.lower() or 
                                      "candidatura rápida" in desc_text.lower() or 
                                      "indeed apply" in desc_text.lower())

                    job = Job(
                        id=job_id,
                        title=title,
                        company=company,
                        location=job_location,
                        link=cleaned_link,
                        date_posted=post_date,
                        search_term=keyword,
                        modality=modality_name,
                        easy_apply=has_easy_apply or easy_apply,
                        category=category_name,
                        platform=self.platform_name
                    )
                    jobs.append(job)

                except Exception:
                    continue

        except Exception as e:
            logger.debug(f"[Indeed RSS] Erro ao consultar RSS: {e}")

        return jobs

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
        return self._search_via_rss(
            keyword=keyword,
            location=location,
            work_type=work_type,
            easy_apply=easy_apply,
            category_name=category_name,
            modality_name=modality_name
        )
