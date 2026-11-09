from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import datetime
import re
import os
import logging
from supabase import create_client, Client
from src.config.settings import settings

logger = logging.getLogger("api")

app = FastAPI(
    title="Vaga Dados API",
    description="API para listar vagas extraídas do LinkedIn, Indeed e Gupy.",
    version="1.3.1"
)

# Middleware de Cabecalhos de Seguranca (OWASP Best Practices)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Tratamento Global de Erros: impede vazamento de stacktrace ou credenciais internas
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro interno não tratado na rota {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocorreu um erro interno no servidor ao processar a requisição."}
    )

# Configuracao Segura de CORS
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
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

def is_portugal_location(loc: Optional[str]) -> bool:
    """Verifica com precisão se a localização pertence a Portugal, evitando falso-positivos brasileiros."""
    if not loc or not isinstance(loc, str):
        return False
    loc_lower = loc.lower()
    pt_keywords = [
        "portugal", "lisboa", "lisbon", "braga", "coimbra", "aveiro", "faro",
        "setúbal", "setubal", "leiria", "funchal", "madeira", "açores", "acores",
        "oeiras", "cascais", "sintra", "matosinhos", "vila nova de gaia"
    ]
    if any(k in loc_lower for k in pt_keywords):
        return True
    # 'porto' em Portugal vs cidades brasileiras ('porto alegre', 'porto feliz', 'porto velho', etc.)
    if "porto" in loc_lower and not any(br in loc_lower for br in ["porto alegre", "porto feliz", "porto velho", "porto seguro", "brasil", "brazil", ", sp", ", rs"]):
        return True
    return False

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
    busca: Optional[str] = Query(None, max_length=100, description="Busca textual por cargo, tecnologia ou empresa"),
    tecnologia: Optional[str] = Query(None, max_length=100, description="Busca textual (retrocompatibilidade)"),
    empresa: Optional[str] = Query(None, max_length=100, description="Filtro específico por empresa"),
    modalidade: Optional[str] = Query(None, max_length=50),
    plataforma: Optional[str] = Query(None, max_length=50),
    pais: Optional[str] = Query(None, max_length=50, description="Filtro de localidade por país (Brasil ou Portugal)"),
    easy_apply: Optional[bool] = None,
    apenas_novas: Optional[bool] = None
):
    query = supabase.table("vagas").select("*", count="exact")
    
    # Busca unificada em título, empresa e termo de busca (tecnologia)
    search_query = busca if isinstance(busca, str) else (tecnologia if isinstance(tecnologia, str) else None)
    if search_query:
        # Sanitizacao contra injecao de caracteres de controle ou separadores de or_()
        clean_search = re.sub(r"[^\w\s\-\+\#\.]", "", search_query.strip())
        if clean_search:
            query = query.or_(
                f"titulo.ilike.%{clean_search}%,empresa.ilike.%{clean_search}%,termo_busca.ilike.%{clean_search}%"
            )

    if isinstance(empresa, str) and empresa.strip():
        clean_emp = re.sub(r"[^\w\s\-\+\#\.]", "", empresa.strip())
        if clean_emp:
            query = query.ilike("empresa", f"%{clean_emp}%")
        
    if isinstance(modalidade, str) and modalidade != "Todas":
        m = modalidade.lower()
        if "remot" in m:
            query = query.or_("modalidade.ilike.%remot%,modalidade.ilike.%remote%")
        elif "hibrid" in m or "hybrid" in m:
            query = query.or_("modalidade.ilike.%hibrid%,modalidade.ilike.%hybrid%")
        elif "presenc" in m or "site" in m:
            query = query.or_("modalidade.ilike.%presenc%,modalidade.ilike.%site%")
        else:
            query = query.ilike("modalidade", f"%{modalidade}%")
            
    if isinstance(plataforma, str) and plataforma != "Todas":
        query = query.ilike("plataforma", f"%{plataforma}%")

    if isinstance(pais, str) and pais.strip() and pais not in ["Todos", "Todas"]:
        p = pais.lower().strip()
        if "portugal" in p:
            query = query.or_(
                "localizacao.ilike.%portugal%,localizacao.ilike.%lisboa%,localizacao.ilike.%braga%,"
                "localizacao.ilike.%coimbra%,localizacao.ilike.%aveiro%,localizacao.ilike.%faro%,"
                "localizacao.ilike.%oeiras%,localizacao.ilike.%cascais%,localizacao.ilike.%sintra%"
            )
        elif "brasil" in p:
            query = (
                query
                .not_.ilike("localizacao", "%portugal%")
                .not_.ilike("localizacao", "%lisboa%")
                .not_.ilike("localizacao", "%lisbon%")
                .not_.ilike("localizacao", "%braga%")
                .not_.ilike("localizacao", "%coimbra%")
                .not_.ilike("localizacao", "%aveiro%")
                .not_.ilike("localizacao", "%faro%")
                .not_.ilike("localizacao", "%oeiras%")
                .not_.ilike("localizacao", "%cascais%")
                .not_.ilike("localizacao", "%sintra%")
            )
        
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

    # Filtrar por país em memória (garante precisão absoluta em casos especiais de cidades)
    if isinstance(pais, str) and pais.strip() and pais not in ["Todos", "Todas"]:
        p = pais.lower().strip()
        if "portugal" in p:
            vagas = [v for v in vagas if is_portugal_location(v.get("localizacao"))]
        elif "brasil" in p:
            vagas = [v for v in vagas if not is_portugal_location(v.get("localizacao"))]

    # Filtrar apenas postadas no máximo há 60 dias
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    cutoff_60_days = now_utc - datetime.timedelta(days=60)
    vagas = [v for v in vagas if parse_post_date(v.get("data_postagem"), v.get("data_coleta")) >= cutoff_60_days]

    # Ordenar por data de postagem real: da mais recente para a mais antiga
    vagas.sort(key=lambda x: parse_post_date(x.get("data_postagem"), x.get("data_coleta")), reverse=True)
    
    total = len(vagas)
    limit_val = limit if isinstance(limit, int) else 200
    offset_val = offset if isinstance(offset, int) else 0
    paginated = vagas[offset_val : offset_val + limit_val]
    
    return {
        "total": total,
        "vagas": paginated,
        "limit": limit_val,
        "offset": offset_val
    }
