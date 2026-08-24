# 📱 Guia de Configuração do Telegram Bot (2 Minutos)

Para que o robô envie notificações de vagas direto para o seu celular ou computador via Telegram, precisamos de apenas duas informações no arquivo `.env`:

1. `TELEGRAM_BOT_TOKEN`
2. `TELEGRAM_CHAT_ID`

---

## 🛠️ Passo 1: Criar o seu Bot no Telegram (Obter o TOKEN)

1. Abra o seu Telegram e pesquise pelo usuário oficial: **`@BotFather`** (ele tem o selo de verificado azul) ou acesse direto: [https://t.me/BotFather](https://t.me/BotFather)
2. Clique em **Iniciar** (ou envie `/start`).
3. Envie o comando:
   ```text
   /newbot
   ```
4. O BotFather vai perguntar o nome do seu bot (Exemplo: `Meu Alerta de Vagas`).
5. Depois vai pedir um username terminando em `bot` (Exemplo: `renan_vagas_dados_bot`).
6. **Pronto!** O BotFather vai te responder com uma mensagem contendo o **HTTP API Token**. Ele se parece com algo assim:
   `7123456789:AAFrTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
7. Copie esse token e cole no seu arquivo `.env` no campo:
   ```env
   TELEGRAM_BOT_TOKEN=seu_token_aqui
   ```

---

## 🆔 Passo 2: Pegar o seu CHAT ID

1. No Telegram, pesquise pelo bot: **`@userinfobot`** ou acesse: [https://t.me/userinfobot](https://t.me/userinfobot)
2. Clique em **Iniciar** (ou envie `/start`).
3. O bot vai te responder com suas informações, incluindo o campo **`Id:`** (Exemplo: `123456789`).
4. Copie esse número e cole no seu arquivo `.env`:
   ```env
   TELEGRAM_CHAT_ID=123456789
   ```

---

## ⚡ Passo 3: Iniciar a conversa com o seu Bot (MUITO IMPORTANTE!)

> [!IMPORTANT]
> O Telegram só permite que o bot envie mensagens para você depois que **você** der um primeiro "Oi" ou clicar em Iniciar nele.

1. Abra a conversa com o bot que você acabou de criar (o link dele veio na mensagem do BotFather, exemplo: `t.me/renan_vagas_dados_bot`).
2. Clique no botão **INICIAR** (ou envie `/start`).

---

## 🧪 Passo 4: Testar a Conexão

Abra o terminal na pasta `pesquisa-vagas` e execute:

```bash
python test_telegram.py
```

Se tudo estiver correto, uma mensagem de boas-vindas vai apitar no seu celular na mesma hora! 🚀

---

## 🏃 Passo 5: Rodar o Robô de Vagas

* **Executar uma varredura agora:**
  ```bash
  python main.py
  ```

* **Deixar rodando continuamente (a cada 15 min):**
  ```bash
  python main.py --loop
  ```

* **Ver estatísticas de vagas capturadas:**
  ```bash
  python main.py --stats
  ```
