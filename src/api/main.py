from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import datetime
import re
from supabase import create_client, Client
from src.config.settings import settings

app = FastAPI(
    title="Vaga Dados API",
    description="API para listar vagas extraídas do LinkedIn, Indeed e Gupy.",
    version="1.3.0"
)

# Permitir que o Frontend (Next.js) consuma a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexão com Supabase
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def parse_post_date(data_postagem: Optional[str], data_coleta: Optional[str]) -> datetime.datetime:
    now = datetime.datetime.now(datetime.timezone.utc)
    if data_coleta:
        try:
            now = datetime.datetime.fromisoformat(data_coleta.replace("Z", "+00:00"))
        except Exception:
            pass

    if not data_postagem or data_postagem.strip() == "" or data_postagem.lower() == "recente":
        return now

    # Se for formato ISO ex: 2026-07-27T19:26:23.335Z
    if "T" in data_postagem:
        try:
            return datetime.datetime.fromisoformat(data_postagem.replace("Z", "+00:00"))
        except Exception:
            pass

    s = data_postagem.lower()
    m_min = re.search(r"(\d+)\s*(?:minuto|min)", s)
    if m_min:
        return now - datetime.timedelta(minutes=int(m_min.group(1)))
    
    m_hora = re.search(r"(\d+)\s*(?:hora|hour|h\b)", s)
    if m_hora:
        return now - datetime.timedelta(hours=int(m_hora.group(1)))
        
    m_dia = re.search(r"(\d+)\s*(?:dia|day)", s)
    if m_dia:
        return now - datetime.timedelta(days=int(m_dia.group(1)))
        
    m_sem = re.search(r"(\d+)\s*(?:semana|week)", s)
    if m_sem:
        return now - datetime.timedelta(weeks=int(m_sem.group(1)))

    m_mes = re.search(r"(\d+)\s*(?:m[eêé]s(?:es)?|months?|month)", s)
    if m_mes:
        return now - datetime.timedelta(days=int(m_mes.group(1)) * 30)

    m_ano = re.search(r"(\d+)\s*(?:ano|year)", s)
    if m_ano:
        return now - datetime.timedelta(days=int(m_ano.group(1)) * 365)

    try:
        return datetime.datetime.strptime(data_postagem[:10], "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)
    except Exception:
        pass

    return now

@app.get("/")
def read_root():
    return {"status": "API rodando", "docs": "/docs"}

@app.get("/estatisticas")
def resumo_estatisticas():
    resp = supabase.table("vagas").select("id, modalidade, easy_apply, data_postagem, data_coleta").execute()
    todas_vagas = resp.data or []

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    cutoff_60_days = now_utc - datetime.timedelta(days=60)

    # Filtrar apenas postadas nos ultimos 60 dias
    vagas = [v for v in todas_vagas if parse_post_date(v.get("data_postagem"), v.get("data_coleta")) >= cutoff_60_days]

    total = len(vagas)
    remotas = sum(1 for v in vagas if any(x in str(v.get("modalidade", "")).lower() for x in ["remot", "remote"]))
    hibridas = sum(1 for v in vagas if any(x in str(v.get("modalidade", "")).lower() for x in ["hibrid", "hybrid"]))
    presenciais = sum(1 for v in vagas if any(x in str(v.get("modalidade", "")).lower() for x in ["presenc", "site"]))
    easy_apply = sum(1 for v in vagas if v.get("easy_apply") in [1, True, "1", "true"])

    latest_dt = None
    for v in vagas:
        c_str = v.get("data_coleta")
        if c_str:
            try:
                dt = datetime.datetime.fromisoformat(c_str.replace("Z", "+00:00"))
                if latest_dt is None or dt > latest_dt:
                    latest_dt = dt
            except Exception:
                pass

    total_novas = 0
    if latest_dt:
        for v in vagas:
            c_str = v.get("data_coleta")
            if c_str:
                try:
                    c_dt = datetime.datetime.fromisoformat(c_str.replace("Z", "+00:00"))
                    if (latest_dt - c_dt).total_seconds() <= 1800:
                        total_novas += 1
                except Exception:
                    pass

    return {
        "total": total,
        "remotas": remotas,
        "hibridas": hibridas,
        "presenciais": presenciais,
        "easy_apply": easy_apply,
        "novas": total_novas
    }

@app.get("/vagas")
def listar_vagas(
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tecnologia: Optional[str] = None,
    modalidade: Optional[str] = None,
    plataforma: Optional[str] = None,
    easy_apply: Optional[bool] = None,
    apenas_novas: Optional[bool] = None
):
    query = supabase.table("vagas").select("*", count="exact")
    
    if tecnologia:
        query = query.ilike("termo_busca", f"%{tecnologia}%")
        
    if modalidade and modalidade != "Todas":
        m = modalidade.lower()
        if "remot" in m:
            query = query.or_("modalidade.ilike.%remot%,modalidade.ilike.%remote%")
        elif "hibrid" in m or "hybrid" in m:
            query = query.or_("modalidade.ilike.%hibrid%,modalidade.ilike.%hybrid%")
        elif "presenc" in m or "site" in m:
            query = query.or_("modalidade.ilike.%presenc%,modalidade.ilike.%site%")
        else:
            query = query.ilike("modalidade", f"%{modalidade}%")
            
    if plataforma and plataforma != "Todas":
        query = query.ilike("plataforma", f"%{plataforma}%")
        
    if easy_apply is not None:
        query = query.eq("easy_apply", easy_apply)
        
    response = query.execute()
    vagas = response.data or []
    
    # Determinar a data da última coleta geral no banco
    resp_latest = supabase.table("vagas").select("data_coleta").order("data_coleta", desc=True).limit(1).execute()
    latest_dt = None
    if resp_latest.data and resp_latest.data[0].get("data_coleta"):
        try:
            latest_dt = datetime.datetime.fromisoformat(resp_latest.data[0]["data_coleta"].replace("Z", "+00:00"))
        except Exception:
            pass

    # Para cada vaga, marca se é da última rodada de entrada (dentro de 30 minutos da inserção mais recente)
    for v in vagas:
        c_str = v.get("data_coleta")
        is_nova = False
        if latest_dt and c_str:
            try:
                c_dt = datetime.datetime.fromisoformat(c_str.replace("Z", "+00:00"))
                if (latest_dt - c_dt).total_seconds() <= 1800:
                    is_nova = True
            except Exception:
                pass
        v["is_nova"] = is_nova

    # Filtrar por apenas novas se solicitado
    if apenas_novas:
        vagas = [v for v in vagas if v.get("is_nova")]

    # Filtrar apenas postadas no máximo há 60 dias
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    cutoff_60_days = now_utc - datetime.timedelta(days=60)
    vagas = [v for v in vagas if parse_post_date(v.get("data_postagem"), v.get("data_coleta")) >= cutoff_60_days]

    # Ordenar por data de postagem real: da mais recente para a mais antiga
    vagas.sort(key=lambda x: parse_post_date(x.get("data_postagem"), x.get("data_coleta")), reverse=True)
    
    total = len(vagas)
    paginated = vagas[offset : offset + limit]
    
    return {
        "total": total,
        "vagas": paginated,
        "limit": limit,
        "offset": offset
    }
