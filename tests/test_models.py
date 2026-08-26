import pytest
from src.models.job import Job

def test_job_creation_and_to_dict():
    job = Job(
        id="li_12345",
        title="Analista de Dados Júnior",
        company="Tech Corp",
        location="São Paulo, Brasil",
        link="https://www.linkedin.com/jobs/view/12345",
        modality="Híbrido",
        easy_apply=True,
        platform="LinkedIn"
    )
    
    d = job.to_dict()
    assert d["id"] == "li_12345"
    assert d["titulo"] == "Analista de Dados Júnior"
    assert d["empresa"] == "Tech Corp"
    assert d["easy_apply"] == 1
    assert d["plataforma"] == "LinkedIn"

def test_job_from_dict():
    data = {
        "id": "ind_98765",
        "titulo": "Power BI Analyst",
        "empresa": "Data Solutions",
        "localizacao": "Remoto",
        "link": "https://br.indeed.com/viewjob?jk=98765",
        "modalidade": "Remoto",
        "easy_apply": 0,
        "plataforma": "Indeed"
    }
    
    job = Job.from_dict(data)
    assert job.id == "ind_98765"
    assert job.title == "Power BI Analyst"
    assert job.platform == "Indeed"
    assert job.easy_apply is False
