import sys
import time
import argparse
from datetime import datetime

# Garante suporte a UTF-8 no Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from config import SEARCH_KEYWORDS, TARGET_CITIES, CHECK_INTERVAL_MINUTES
from database import init_db, is_job_seen, save_job, get_stats
from linkedin_scraper import fetch_linkedin_jobs_categorized
from telegram_notifier import send_job_alert

def print_header():
    print("=" * 70)
    print("🚀  ROBÔ MONITOR DE VAGAS LINKEDIN (BRASIL / HOME OFFICE / HÍBRIDO)")
    print(f"⏰  Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🔍  Palavras-chave: {', '.join(SEARCH_KEYWORDS)}")
    print(f"📍  Cidades Foco: Juiz de Fora, São Paulo, Rio de Janeiro, Florianópolis")
    print(f"⚡  Categorias: Remoto, Híbrido, Presencial (com e sem Easy Apply)")
    print("=" * 70)

def search_category(categoria_info: dict) -> int:
    """Executa a busca para uma categoria específica."""
    cat_name = categoria_info["nome"]
    work_type = categoria_info["work_type"] # 2=Remoto, 3=Hibrido, 1=Presencial
    easy_apply = categoria_info["easy_apply"]
    locations = categoria_info["locations"]
    modalidade = categoria_info["modalidade"]
    
    novas_nesta_cat = 0
    print(f"\n📂 [{cat_name}]")
    
    for loc in locations:
        for keyword in SEARCH_KEYWORDS:
            loc_label = "Brasil (Home Office)" if work_type == "2" else loc.split(",")[0]
            ea_label = "Easy Apply" if easy_apply else "Geral"
            print(f"  🔍 Buscando: '{keyword}' em {loc_label} ({ea_label})...")
            
            jobs = fetch_linkedin_jobs_categorized(
                keyword=keyword,
                location=loc,
                work_type=work_type,
                easy_apply=easy_apply,
                category_name=cat_name,
                modalidade_nome=modalidade,
                max_pages=1
            )
            
            for job in jobs:
                if not is_job_seen(job["id"]):
                    salvou = save_job(job)
                    if salvou:
                        novas_nesta_cat += 1
                        print(f"    ✨ [{cat_name}] {job['titulo']} @ {job['empresa']} ({job['localizacao']})")
                        
                        enviado = send_job_alert(job)
                        if enviado:
                            print("       📲 Notificação enviada ao Telegram!")
                        else:
                            print("       ⚠️ Aviso: Falha ao enviar para o Telegram.")
                            
                        # Pausa de 1.2s para envio seguro
                        time.sleep(1.2)
                        
            time.sleep(0.5)
            
    return novas_nesta_cat

def run_full_pipeline():
    """Executa a varredura nas 6 categorias solicitadas."""
    print(f"\n🕒 [{datetime.now().strftime('%H:%M:%S')}] Iniciando ciclo de varredura...")
    
    categorias = [
        # 1. Remoto com Easy Apply
        {
            "nome": "🏠 REMOTO | ⚡ EASY APPLY (SIMPLIFICADA)",
            "work_type": "2",
            "easy_apply": True,
            "locations": ["Brazil"],
            "modalidade": "Remoto"
        },
        # 2. Remoto sem Easy Apply (Site da Empresa)
        {
            "nome": "🏠 REMOTO | 🌐 SITE DA EMPRESA",
            "work_type": "2",
            "easy_apply": False,
            "locations": ["Brazil"],
            "modalidade": "Remoto"
        },
        # 3. Híbrido com Easy Apply
        {
            "nome": "🏢🔄 HÍBRIDO | ⚡ EASY APPLY (SIMPLIFICADA)",
            "work_type": "3",
            "easy_apply": True,
            "locations": TARGET_CITIES,
            "modalidade": "Híbrido"
        },
        # 4. Híbrido sem Easy Apply
        {
            "nome": "🏢🔄 HÍBRIDO | 🌐 SITE DA EMPRESA",
            "work_type": "3",
            "easy_apply": False,
            "locations": TARGET_CITIES,
            "modalidade": "Híbrido"
        },
        # 5. Presencial com Easy Apply
        {
            "nome": "🏢 PRESENCIAL | ⚡ EASY APPLY (SIMPLIFICADA)",
            "work_type": "1",
            "easy_apply": True,
            "locations": TARGET_CITIES,
            "modalidade": "Presencial"
        },
        # 6. Presencial sem Easy Apply
        {
            "nome": "🏢 PRESENCIAL | 🌐 SITE DA EMPRESA",
            "work_type": "1",
            "easy_apply": False,
            "locations": TARGET_CITIES,
            "modalidade": "Presencial"
        }
    ]
    
    total_novas = 0
    for cat in categorias:
        total_novas += search_category(cat)
        
    stats = get_stats()
    print("\n" + "=" * 70)
    print("📊 Resumo da Varredura:")
    print(f"  • Novas vagas enviadas nesta rodada: {total_novas}")
    print(f"  • Total acumulado no banco de dados: {stats['total_vagas_armazenadas']}")
    print(f"  • Total de vagas com Easy Apply:    {stats['total_easy_apply']}")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="Robô de Vagas do LinkedIn Categorizado")
    parser.add_argument("--loop", action="store_true", help="Executa o robô continuamente em loop com intervalo")
    parser.add_argument("--stats", action="store_true", help="Exibe apenas as estatísticas do banco de dados")
    args = parser.parse_args()
    
    init_db()
    
    if args.stats:
        stats = get_stats()
        print("\n📊 Estatísticas do Banco de Vagas:")
        print(f"  • Total de vagas:      {stats['total_vagas_armazenadas']}")
        print(f"  • Vagas Easy Apply:    {stats['total_easy_apply']}\n")
        return
        
    print_header()
    
    if args.loop:
        print(f"🔄 Modo Contínuo ativado: Varredura a cada {CHECK_INTERVAL_MINUTES} minutos.")
        print("💡 Pressione CTRL+C para pausar/interromper a qualquer momento.\n")
        try:
            while True:
                run_full_pipeline()
                print(f"\n⏳ Aguardando {CHECK_INTERVAL_MINUTES} minutos para a próxima busca...")
                time.sleep(CHECK_INTERVAL_MINUTES * 60)
        except KeyboardInterrupt:
            print("\n👋 Robô pausado com sucesso.")
    else:
        run_full_pipeline()
        print("\n✅ Varredura única concluída. Para manter rodando, use: python main.py --loop")

if __name__ == "__main__":
    main()
