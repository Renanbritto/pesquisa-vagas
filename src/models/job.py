from dataclasses import dataclass, field
import re
import datetime
from typing import Dict, Any

@dataclass
class Job:
    id: str
    title: str
    company: str
    location: str
    link: str
    date_posted: str = "Recente"
    search_term: str = ""
    modality: str = "Indefinido"
    easy_apply: bool = False
    category: str = "Geral"
    platform: str = "LinkedIn"
    fingerprint_override: str = None
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())

    @property
    def fingerprint(self) -> str:
        """Gera um identificador semântico único baseado no Cargo + Empresa."""
        if self.fingerprint_override:
            return self.fingerprint_override
        t = re.sub(r"[^a-zA-Z0-9]", "", (self.title or "").lower())
        c = re.sub(r"[^a-zA-Z0-9]", "", (self.company or "").lower())
        return f"{t}_{c}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "titulo": self.title,
            "empresa": self.company,
            "localizacao": self.location,
            "link": self.link,
            "data_postagem": self.date_posted,
            "termo_busca": self.search_term,
            "modalidade": self.modality,
            "easy_apply": 1 if self.easy_apply else 0,
            "categoria": self.category,
            "plataforma": self.platform,
            "fingerprint": self.fingerprint,
            "data_coleta": self.created_at
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Job":
        return cls(
            id=str(data.get("id", "")),
            title=data.get("titulo") or data.get("title", "Sem título"),
            company=data.get("empresa") or data.get("company", "Empresa Confidencial"),
            location=data.get("localizacao") or data.get("location", "Brasil"),
            link=data.get("link", ""),
            date_posted=data.get("data_postagem") or data.get("date_posted", "Recente"),
            search_term=data.get("termo_busca") or data.get("search_term", ""),
            modality=data.get("modalidade") or data.get("modality", "Indefinido"),
            easy_apply=bool(data.get("easy_apply", False)),
            category=data.get("categoria") or data.get("category", "Geral"),
            platform=data.get("plataforma") or data.get("platform", "LinkedIn"),
            fingerprint_override=data.get("fingerprint"),
            created_at=data.get("data_coleta") or data.get("created_at", datetime.datetime.now().isoformat())
        )
