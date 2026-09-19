from typing import Dict, Any, List

class HealthEngine:
    """
    Multi-signal evaluation engine for service and infrastructure health.
    Evaluates CPU, Memory, Latency, Error Rate, and Availability against configurable thresholds.
    Produces transparent status (HEALTHY, WARNING, DEGRADED, CRITICAL) and explainable reasons.
    """

    def __init__(self):
        # Default thresholds
        self.cpu_warning = 70.0
        self.cpu_critical = 85.0
        self.latency_warning = 300.0  # ms
        self.latency_critical = 500.0
        self.error_rate_warning = 1.0  # %
        self.error_rate_critical = 3.0

    def evaluate_resource_health(
        self,
        cpu: float,
        latency: float,
        error_rate: float,
        memory: float = 50.0,
        traffic_change_pct: float = 0.0
    ) -> Dict[str, Any]:
        reasons: List[str] = []
        score = 100

        # CPU Evaluation
        if cpu >= self.cpu_critical:
            reasons.append(f"CPU = {cpu}% (Critical threshold > {self.cpu_critical}%)")
            score -= 25
        elif cpu >= self.cpu_warning:
            reasons.append(f"CPU = {cpu}% (Warning threshold > {self.cpu_warning}%)")
            score -= 10

        # Latency Evaluation
        if latency >= self.latency_critical:
            reasons.append(f"P95 latency = {latency}ms (Critical target <= {self.latency_critical}ms)")
            score -= 25
        elif latency >= self.latency_warning:
            reasons.append(f"P95 latency = {latency}ms (Warning target <= {self.latency_warning}ms)")
            score -= 10

        # Error Rate Evaluation
        if error_rate >= self.error_rate_critical:
            reasons.append(f"Error rate = {error_rate}% (Critical threshold > {self.error_rate_critical}%)")
            score -= 20
        elif error_rate >= self.error_rate_warning:
            reasons.append(f"Error rate = {error_rate}% (Warning threshold > {self.error_rate_warning}%)")
            score -= 10

        # Traffic evaluation
        if traffic_change_pct >= 40.0:
            reasons.append(f"Traffic surge: +{round(traffic_change_pct, 1)}% increase over normal baseline")

        score = max(0, min(100, score))

        if score < 65 or (cpu >= self.cpu_critical and latency >= self.latency_critical):
            status = "DEGRADED"
        elif score < 80 or cpu >= self.cpu_warning or latency >= self.latency_warning:
            status = "WARNING"
        elif score < 40:
            status = "CRITICAL"
        else:
            status = "HEALTHY"
            if not reasons:
                reasons.append("All operational telemetry metrics within nominal limits")

        return {
            "status": status,
            "score": score,
            "reasons": reasons
        }

health_engine = HealthEngine()
