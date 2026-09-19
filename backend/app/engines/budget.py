from typing import Dict, Any, List

class BudgetEngine:
    """
    Financial Gatekeeper Engine.
    Validates proposed infrastructure actions against monthly budget allocation,
    warning thresholds (80%), and hard limit (100%).
    """

    def evaluate_budget(
        self,
        current_spend: float,
        proposed_additional: float,
        monthly_budget: float = 30000.0,
        warning_threshold_pct: float = 0.8
    ) -> Dict[str, Any]:
        projected_total = current_spend + proposed_additional
        utilization_pct = (projected_total / monthly_budget) * 100.0 if monthly_budget > 0 else 0.0

        is_allowed = projected_total <= monthly_budget
        is_warning = (projected_total / monthly_budget) >= warning_threshold_pct

        reasons: List[str] = []
        if is_allowed:
            reasons.append(
                f"Projected spend ₹{projected_total:,.0f} is within the ₹{monthly_budget:,.0f} monthly budget ({round(utilization_pct, 1)}% utilization)"
            )
            if is_warning:
                reasons.append(f"Notice: Projected spend exceeds {int(warning_threshold_pct * 100)}% warning threshold")
        else:
            reasons.append(
                f"Projected spend ₹{projected_total:,.0f} exceeds total monthly budget of ₹{monthly_budget:,.0f} by ₹{projected_total - monthly_budget:,.0f}"
            )

        return {
            "result": "PASS" if is_allowed else "FAIL",
            "passed": is_allowed,
            "currentSpend": current_spend,
            "additionalSpend": proposed_additional,
            "projectedTotal": projected_total,
            "monthlyBudget": monthly_budget,
            "utilizationPercent": round(utilization_pct, 1),
            "isWarning": is_warning,
            "reasons": reasons
        }

budget_engine = BudgetEngine()
