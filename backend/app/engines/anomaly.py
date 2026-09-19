from typing import Dict, Any, List, Optional

class AnomalyDetectionEngine:
    """
    Explainable Anomaly Detection using statistical drift, percentage deviation,
    and sustained threshold persistence rather than opaque black-box models.
    """

    def detect_traffic_anomaly(
        self,
        current_traffic: float,
        baseline_traffic: float = 8000.0,
        surge_threshold_pct: float = 40.0
    ) -> Optional[Dict[str, Any]]:
        if baseline_traffic <= 0:
            return None
        
        change_pct = ((current_traffic - baseline_traffic) / baseline_traffic) * 100.0

        if change_pct >= surge_threshold_pct:
            return {
                "type": "TRAFFIC_ANOMALY",
                "severity": "HIGH" if change_pct >= 50.0 else "MEDIUM",
                "current": current_traffic,
                "baseline": baseline_traffic,
                "changePercent": round(change_pct, 1),
                "explanation": f"Traffic increased by {round(change_pct, 1)}% ({round(current_traffic):,} vs baseline {round(baseline_traffic):,} req/min)"
            }
        return None

    def detect_cpu_anomaly(
        self,
        current_cpu: float,
        target_cpu: float = 60.0
    ) -> Optional[Dict[str, Any]]:
        if current_cpu >= 80.0:
            return {
                "type": "CPU_ANOMALY",
                "severity": "CRITICAL" if current_cpu >= 85.0 else "HIGH",
                "current": current_cpu,
                "target": target_cpu,
                "explanation": f"CPU utilization ({current_cpu}%) is significantly above the target ({target_cpu}%)"
            }
        return None

anomaly_engine = AnomalyDetectionEngine()
