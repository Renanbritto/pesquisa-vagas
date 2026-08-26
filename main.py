import sys
import time
import argparse
from datetime import datetime

# Garante compatibilidade UTF-8 no Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from src.config.settings import settings
from src.database.repository import JobRepository
from src.scrapers.factory import ScraperFactory
from src.notifiers.telegram import TelegramNotifier
from src.utils.logger import logger

def print_header(scrapers_names: list):
    print("=" * 75)
    print("🚀  PESQUISA VAGAS v2.0 - MONITOR MULTIPLATAFORMA")
    print(f"⏰  Iniciado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🌐  Plataformas: {', '.join(scrapers_names)}")
    print(f"🔍  Palavras-chave: {', '.join(settings.SEARCH_KEYWORDS)}")
    print(f"📍  Cidades Foco: Juiz de Fora, São Paulo, Rio de Janeiro, Florianópolis")
    print(f"⚡  Filtro de Nível: Exclusivo Júnior e Pleno")
    print("=" * 75)

def run_pipeline(repo: JobRepository, notifier: TelegramNotifier, scrapers: list) -> int:
    """Executa a busca nas 6 categorias com cache em tempo de execução e deduplicação inteligente."""
    categorias = [
        # 1. Remoto com Easy Apply
        {
            "nome": "🏠 REMOTO | ⚡ EASY APPLY (SIMPLIFICADA)",
            "work_type": "2",
            "easy_apply": True,
            "locations": ["Brazil"],
            "modalidade": "Remoto"
        },
        # 2. Remoto sem Easy Apply
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
            "locations": settings.TARGET_CITIES,
            "modalidade": "Híbrido"
        },
        # 4. Híbrido sem Easy Apply
        {
            "nome": "🏢🔄 HÍBRIDO | 🌐 SITE DA EMPRESA",
            "work_type": "3",
            "easy_apply": False,
            "locations": settings.TARGET_CITIES,
            "modalidade": "Híbrido"
        },
        # 5. Presencial com Easy Apply
        {
            "nome": "🏢 PRESENCIAL | ⚡ EASY APPLY (SIMPLIFICADA)",
            "work_type": "1",
            "easy_apply": True,
            "locations": settings.TARGET_CITIES,
            "modalidade": "Presencial"
        },
        # 6. Presencial sem Easy Apply
        {
            "nome": "🏢 PRESENCIAL | 🌐 SITE DA EMPRESA",
            "work_type": "1",
            "easy_apply": False,
            "locations": settings.TARGET_CITIES,
            "modalidade": "Presencial"
        }
    ]

    total_novas = 0
    # Cache em memória para esta rodada evitar envio duplo entre categorias (ex: Easy Apply vs Geral)
    session_seen_ids = set()
    session_seen_fingerprints = set()

    for cat in categorias:
        cat_name = cat["nome"]
        work_type = cat["work_type"]
        easy_apply = cat["easy_apply"]
        locations = cat["locations"]
        modalidade = cat["modalidade"]

        print(f"\n📂 [{cat_name}]")

        for scraper in scrapers:
            for loc in locations:
                for keyword in settings.SEARCH_KEYWORDS:
                    loc_label = "Brasil" if work_type == "2" else loc.split(",")[0]
                    print(f"  [{scraper.platform_name}] Buscando: '{keyword}' em {loc_label}...")

                    jobs = scraper.search(
                        keyword=keyword,
                        location=loc,
                        work_type=work_type,
                        easy_apply=easy_apply,
                        category_name=cat_name,
                        modality_name=modalidade,
                        max_pages=1
                    )

                    for job in jobs:
                        # 1. Checa cache da sessão atual
                        if job.id in session_seen_ids or job.fingerprint in session_seen_fingerprints:
                            continue

                        # 2. Checa banco de dados SQLite persistente
                        if not repo.is_seen(job.id, job.fingerprint):
                            salvou = repo.save(job)
                            if salvou:
                                total_novas += 1
                                session_seen_ids.add(job.id)
                                session_seen_fingerprints.add(job.fingerprint)

                                print(f"    ✨ [{job.platform}] {job.title} @ {job.company} ({job.location})")

                                enviado = notifier.send_job_alert(job)
                                if enviado:
                                    print("       📲 Notificação enviada ao Telegram!")
                                else:
                                    print("       ⚠️ Falha no envio para o Telegram.")

                                time.sleep(1.2)

                    time.sleep(0.4)

    stats = repo.get_stats()
    print("\n" + "=" * 75)
    print("📊 Resumo da Varredura:")
    print(f"  • Novas vagas enviadas nesta rodada: {total_novas}")
    print(f"  • Total acumulado no banco de dados: {stats['total_vagas_armazenadas']}")
    print(f"  • Por Plataforma:                   {stats['por_plataforma']}")
    print("=" * 75)
    return total_novas

def main():
    parser = argparse.ArgumentParser(description="Pesquisa Vagas v2.0 - Monitor de Oportunidades")
    parser.add_argument("--loop", action="store_true", help="Executa continuamente em intervalos regulares")
    parser.add_argument("--stats", action="store_true", help="Exibe estatísticas do banco de dados")
    parser.add_argument("--platform", choices=["all", "linkedin", "indeed"], default="all", help="Plataforma a executar")
    args = parser.parse_args()

    repo = JobRepository()
    notifier = TelegramNotifier()

    if args.stats:
        stats = repo.get_stats()
        print("\n📊 Estatísticas do Banco de Vagas:")
        print(f"  • Total de vagas:    {stats['total_vagas_armazenadas']}")
        print(f"  • Easy Apply:        {stats['total_easy_apply']}")
        print(f"  • Por Plataforma:    {stats['por_plataforma']}")
        print(f"  • Por Modalidade:    {stats['por_modalidade']}\n")
        return

    if args.platform == "all":
        scrapers = ScraperFactory.get_all_scrapers()
    else:
        scrapers = [ScraperFactory.get_scraper(args.platform)]

    scrapers_names = [s.platform_name for s in scrapers]
    print_header(scrapers_names)

    if args.loop:
        print(f"🔄 Modo Contínuo ativado: Varredura a cada {settings.CHECK_INTERVAL_MINUTES} minutos.")
        print("💡 Pressione CTRL+C a qualquer momento para pausar.\n")
        try:
            while True:
                run_pipeline(repo, notifier, scrapers)
                print(f"\n⏳ Aguardando {settings.CHECK_INTERVAL_MINUTES} minutos para a próxima busca...")
                time.sleep(settings.CHECK_INTERVAL_MINUTES * 60)
        except KeyboardInterrupt:
            print("\n👋 Robô pausado com sucesso.")
    else:
        run_pipeline(repo, notifier, scrapers)
        print("\n✅ Varredura única finalizada. Para manter rodando, use: python main.py --loop")

if __name__ == "__main__":
    main()
