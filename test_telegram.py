import sys

# Garante suporte a UTF-8/emojis no terminal Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from telegram_notifier import test_telegram_connection
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

def main():
    print("=" * 60)
    print("🤖 Teste de Conexão com o Telegram Bot")
    print("=" * 60)
    
    if not TELEGRAM_BOT_TOKEN:
        print("❌ ERRO: TELEGRAM_BOT_TOKEN não foi configurado no arquivo .env!")
        print("👉 Consulte o arquivo GUIA_CONFIGURACAO_TELEGRAM.md para ver o passo a passo.")
        sys.exit(1)
        
    if not TELEGRAM_CHAT_ID:
        print("❌ ERRO: TELEGRAM_CHAT_ID não foi configurado no arquivo .env!")
        print("👉 Consulte o arquivo GUIA_CONFIGURACAO_TELEGRAM.md para ver o passo a passo.")
        sys.exit(1)
        
    print(f"🔹 Bot Token: {TELEGRAM_BOT_TOKEN[:8]}...{TELEGRAM_BOT_TOKEN[-4:]}")
    print(f"🔹 Chat ID:   {TELEGRAM_CHAT_ID}")
    print("\nEnviando mensagem de teste...")
    
    result = test_telegram_connection()
    if result["success"]:
        print("\n✅ SUCESSO! A notificação foi enviada ao seu Telegram. Verifique seu aplicativo!")
    else:
        print(f"\n❌ FALHA: {result['message']}")
        print("Dicas de solução:")
        print("1. Certifique-se de ter aberto o chat com o seu Bot no Telegram e clicado em 'INICIAR' (/start).")
        print("2. Verifique se o Token e Chat ID no arquivo .env foram copiados sem espaços extras.")

if __name__ == "__main__":
    main()
