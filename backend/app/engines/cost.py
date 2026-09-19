from typing import Dict, Any
from backend.app.providers import get_cloud_provider

class CostEngine:
    """
    Normalizes provider cost telemetry and calculates exact financial impact
    of scaling recommendations and projected monthly/daily burn rates.
    """

    def __init__(self, unit_monthly_rate: float = 3600.0, currency: str = "INR"):
        self.unit_monthly_rate = unit_monthly_rate  # ₹3,600 / month per instance
        self.currency = currency

    def get_cloud_costs(self) -> Dict[str, Any]:
        provider = get_cloud_provider()
        return provider.get_costs()

    def calculate_scaling_cost_impact(
        self,
        current_monthly: float,
        current_capacity: int,
        target_capacity: int
    ) -> Dict[str, Any]:
        delta_capacity = target_capacity - current_capacity
        additional_monthly = delta_capacity * self.unit_monthly_rate
        proposed_monthly = current_monthly + additional_monthly

        daily_impact = round(additional_monthly / 30.0, 2)
        hourly_impact = round(additional_monthly / 720.0, 2)

        return {
            "currency": self.currency,
            "currencySymbol": "₹",
            "currentMonthly": current_monthly,
            "proposedMonthly": proposed_monthly,
            "difference": additional_monthly,
            "estimatedDailyImpact": daily_impact,
            "estimatedHourlyImpact": hourly_impact,
            "calculationLabel": "ESTIMATED",
            "unitRate": self.unit_monthly_rate
        }

cost_engine = CostEngine()
