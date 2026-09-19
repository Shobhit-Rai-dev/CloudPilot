from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.providers import get_cloud_provider

class MonitoringEngine:
    """
    Ingests, normalizes and aggregates infrastructure and application telemetry metrics.
    Metric types: CPU_UTILIZATION, MEMORY_UTILIZATION, LATENCY, REQUEST_COUNT, ERROR_RATE, INSTANCE_COUNT
    """

    METRIC_TYPES = [
        "CPU_UTILIZATION",
        "MEMORY_UTILIZATION",
        "NETWORK_IN",
        "NETWORK_OUT",
        "DISK_USAGE",
        "REQUEST_COUNT",
        "ERROR_RATE",
        "LATENCY",
        "INSTANCE_COUNT"
    ]

    def get_resource_metrics(self, resource_id: str, time_range: str = "1h") -> List[Dict[str, Any]]:
        provider = get_cloud_provider()
        return provider.get_metrics(resource_id, time_range)

    def normalize_metric(self, raw_type: str, value: float, unit: str) -> Dict[str, Any]:
        return {
            "metricType": raw_type.upper(),
            "value": round(value, 2),
            "unit": unit,
            "timestamp": datetime.utcnow().isoformat()
        }

monitoring_engine = MonitoringEngine()
