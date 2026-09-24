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

    m_mes = re.search(r"(\d+)\s*(?:m[eê]s|month)", s)
    if m_mes:
        return now - datetime.timedelta(days=int(m_mes.group(1)) * 30)

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
    resp_total = supabase.table("vagas").select("id", count="exact").execute()
    resp_remoto = supabase.table("vagas").select("id", count="exact").or_("modalidade.ilike.%remot%,modalidade.ilike.%remote%").execute()
    resp_hibrido = supabase.table("vagas").select("id", count="exact").or_("modalidade.ilike.%hibrid%,modalidade.ilike.%hybrid%").execute()
    resp_presencial = supabase.table("vagas").select("id", count="exact").or_("modalidade.ilike.%presenc%,modalidade.ilike.%site%").execute()
    resp_easy = supabase.table("vagas").select("id", count="exact").eq("easy_apply", 1).execute()

    # Identificar a última rodada de coleta no banco
    resp_latest = supabase.table("vagas").select("data_coleta").order("data_coleta", desc=True).limit(1).execute()
    total_novas = 0
    if resp_latest.data and resp_latest.data[0].get("data_coleta"):
        try:
            latest_dt = datetime.datetime.fromisoformat(resp_latest.data[0]["data_coleta"].replace("Z", "+00:00"))
            janela_inicio = (latest_dt - datetime.timedelta(minutes=30)).isoformat()
            resp_novas = supabase.table("vagas").select("id", count="exact").gte("data_coleta", janela_inicio).execute()
            total_novas = resp_novas.count or 0
        except Exception:
            pass

    return {
        "total": resp_total.count or 0,
        "remotas": resp_remoto.count or 0,
        "hibridas": resp_hibrido.count or 0,
        "presenciais": resp_presencial.count or 0,
        "easy_apply": resp_easy.count or 0,
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
