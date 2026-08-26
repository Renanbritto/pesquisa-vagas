# 🤝 Guia de Contribuição (Contributing Guide)

Obrigado por querer contribuir com o **Pesquisa Vagas**! 🚀  
Este projeto é mantido pela comunidade de dados e tecnologia, com o objetivo de conectar profissionais a vagas relevantes de forma ágil e automatizada.

---

## 🌳 Estratégia de Branches (GitFlow)

Para manter o repositório organizado e seguro, adotamos o seguinte padrão de branches:

| Branch | Descrição |
| :--- | :--- |
| **`main`** | Código estável de produção (o que está rodando no portfólio). |
| **`develop`** | Branch de integração contínua para próximas versões. |
| **`feature/<nome>`** | Novas funcionalidades, novos scrapers ou melhorias (ex: `feature/gupy-scraper`). |
| **`fix/<nome>`** | Correções de bugs ou ajustes em scrapers existentes (ex: `fix/linkedin-selector`). |
| **`docs/<nome>`** | Melhorias na documentação e guias (ex: `docs/update-readme`). |

---

## 🛠️ Como Começar a Desenvolver

### 1. Faça um Fork e Clone o Repositório
```bash
git clone https://github.com/SEU_USUARIO/pesquisa-vagas.git
cd pesquisa-vagas
```

### 2. Crie uma Branch para a sua Feature
```bash
git checkout -b feature/minha-melhoria
```

### 3. Configure o Ambiente Virtual
```bash
python -m venv venv
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate

# Instale as dependências de desenvolvimento:
pip install -r requirements-dev.txt
```

### 4. Configure as Variáveis de Ambiente
Copie o `.env.example` para `.env` e preencha com seu Token e Chat ID do Telegram de teste:
```bash
cp .env.example .env
```

---

## 🧩 Como Adicionar um Novo Scraper (Ex: Gupy, Glassdoor, Catho)

O projeto utiliza o **Strategy Pattern**. Para adicionar uma nova plataforma:

1. Crie um novo arquivo em `src/scrapers/meu_scraper.py`.
2. Herde da classe abstrata `BaseScraper`:

```python
from src.scrapers.base import BaseScraper
from src.models.job import Job
from typing import List

class MeuScraper(BaseScraper):
    @property
    def platform_name(self) -> str:
        return "Gupy"

    def search(
        self, 
        keyword: str, 
        location: str, 
        work_type: str, 
        easy_apply: bool = False,
        max_pages: int = 1
    ) -> List[Job]:
        jobs = []
        # Implemente a lógica de coleta aqui...
        return jobs
```

3. Registre o novo scraper em `src/scrapers/factory.py`.
4. Crie testes unitários em `tests/test_scrapers.py`.

---

## 🧪 Rodando os Testes & Linters

Antes de abrir um Pull Request, certifique-se de que todos os testes e padrões de código estão passando:

```bash
# Executar a suíte de testes
pytest

# Executar com cobertura
pytest --cov=src

# Verificar estilo de código com Ruff
ruff check .
```

---

## 📬 Enviando seu Pull Request (PR)

1. Faça o commit das suas alterações seguindo o padrão de **Conventional Commits**:
   ```bash
   git commit -m "feat(scrapers): adiciona suporte a coleta de vagas no Gupy"
   ```
2. Envie para o seu fork:
   ```bash
   git push origin feature/minha-melhoria
   ```
3. Abra um **Pull Request** apontando para a branch `develop` (ou `main`) do repositório principal.
4. Preencha o template de Pull Request descrevendo as mudanças feitas e screenshots de testes.

Obrigado por ajudar a comunidade a encontrar emprego mais rápido! 💼✨
