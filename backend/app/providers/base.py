from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class CloudProvider(ABC):
    """
    Abstract Base Class for Cloud Providers (Mock, AWS, and future GCP/Azure).
    Ensures generic application services never directly couple to provider-specific SDKs.
    """

    @abstractmethod
    def list_resources(self) -> List[Dict[str, Any]]:
        """List all resources discovered in the cloud account."""
        pass

    @abstractmethod
    def get_resource(self, resource_id: str) -> Optional[Dict[str, Any]]:
        """Get full details for a single resource by its ID."""
        pass

    @abstractmethod
    def get_metrics(self, resource_id: str, time_range: str = "1h") -> List[Dict[str, Any]]:
        """Fetch telemetry timeseries metrics for a resource."""
        pass

    @abstractmethod
    def get_health(self, resource_id: str) -> Dict[str, Any]:
        """Fetch current evaluated health status and diagnostic reasons."""
        pass

    @abstractmethod
    def get_costs(self) -> Dict[str, Any]:
        """Fetch normalized current spend, breakdown by service, and trend."""
        pass

    @abstractmethod
    def get_pricing(self, service_type: str = "COMPUTE") -> Dict[str, Any]:
        """Get unit pricing model (e.g. per-instance-hour or per-instance-month)."""
        pass

    @abstractmethod
    def scale_resource(self, resource_id: str, target_capacity: int) -> Dict[str, Any]:
        """Execute scale out / scale in mutation to target capacity."""
        pass

    @abstractmethod
    def start_resource(self, resource_id: str) -> Dict[str, Any]:
        """Start a stopped resource."""
        pass

    @abstractmethod
    def stop_resource(self, resource_id: str) -> Dict[str, Any]:
        """Stop a running resource."""
        pass
