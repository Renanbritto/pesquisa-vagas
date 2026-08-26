from abc import ABC, abstractmethod
from src.models.job import Job

class BaseNotifier(ABC):
    """Interface abstrata para notificação de vagas."""

    @abstractmethod
    def send_job_alert(self, job: Job) -> bool:
        """Envia o alerta de uma vaga específica."""
        pass

    @abstractmethod
    def test_connection(self) -> dict:
        """Testa se as credenciais do notificador estão funcionando."""
        pass
