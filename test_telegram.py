import sys

# Garante suporte a UTF-8 no Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from src.notifiers.telegram import TelegramNotifier
from src.config.settings import settings

def main():
    print("=" * 60)
    print("🤖 Teste de Conexão - Telegram Bot (Pesquisa Vagas v2.0)")
    print("=" * 60)

    if not settings.TELEGRAM_BOT_TOKEN:
        print("❌ ERRO: TELEGRAM_BOT_TOKEN não foi configurado no arquivo .env!")
        sys.exit(1)

    if not settings.TELEGRAM_CHAT_ID:
        print("❌ ERRO: TELEGRAM_CHAT_ID não foi configurado no arquivo .env!")
        sys.exit(1)

    print(f"🔹 Bot Token: {settings.TELEGRAM_BOT_TOKEN[:8]}...{settings.TELEGRAM_BOT_TOKEN[-4:]}")
    print(f"🔹 Chat ID:   {settings.TELEGRAM_CHAT_ID}")
    print("\nEnviando mensagem de teste...")

    notifier = TelegramNotifier()
    result = notifier.test_connection()

    if result["success"]:
        print("\n✅ SUCESSO! A notificação foi enviada ao seu Telegram. Verifique seu aplicativo!")
    else:
        print(f"\n❌ FALHA: {result['message']}")

if __name__ == "__main__":
    main()
