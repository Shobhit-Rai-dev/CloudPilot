import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.app.engines.scaling import scaling_engine
from backend.app.engines.cost import cost_engine
from backend.app.engines.policy import policy_engine
from backend.app.engines.budget import budget_engine
from backend.app.engines.safety import safety_engine
from backend.app.engines.health import health_engine
from backend.app.providers import get_cloud_provider

class RecommendationEngine:
    """
    Intelligent Recommendation Engine.
    Aggregates telemetry, anomalies, capacity sizing formulas, cost impacts,
    and runs the 4-tier check (Policy, Budget, Permission, Safety) before yielding explainable proposals.
    """

    def generate_scaling_recommendation(
        self,
        resource: Dict[str, Any],
        user_role: str = "ADMIN",
        monthly_budget: float = 30000.0,
        current_spend: float = 18000.0
    ) -> Optional[Dict[str, Any]]:
        current_cap = resource.get("capacity", 2)
        cpu = resource.get("currentCpu", 45.0)
        latency = resource.get("currentLatency", 180.0)
        traffic = resource.get("currentTraffic", 8000.0)
        error_rate = resource.get("errorRate", 0.5)

        # Evaluate capacity requirement
        scaling_res = scaling_engine.calculate_scale_out(
            current_instances=current_cap,
            current_cpu=cpu,
            target_cpu=60.0,
            safety_margin=1.2,
            min_instances=resource.get("minCapacity", 2),
            max_instances=resource.get("maxCapacity", 8),
            max_scale_delta=4
        )

        if not scaling_res["shouldScale"]:
            return None

        proposed_cap = scaling_res["recommendedCapacity"]

        # Calculate explainable reasons
        reasons: List[str] = []
        if cpu >= 75.0:
            reasons.append(f"CPU utilization ({cpu}%) is critically above 75% target threshold")
        if latency >= 300.0:
            reasons.append(f"P95 latency ({latency}ms) violates SLA target of 300ms")
        if traffic > 9000.0:
            pct_rise = round(((traffic - 8000.0) / 8000.0) * 100, 1)
            reasons.append(f"Traffic surge: {traffic:,.0f} req/min (+{pct_rise}% over baseline)")
        if error_rate >= 1.0:
            reasons.append(f"Error rate elevated at {error_rate}%")

        if not reasons:
            reasons.append("Proactive capacity adjustment to maintain high availability")

        # Cost impact analysis
        cost_impact = cost_engine.calculate_scaling_cost_impact(
            current_monthly=resource.get("monthlyCost", 18000.0),
            current_capacity=current_cap,
            target_capacity=proposed_cap
        )

        # Policy check
        policy_res = policy_engine.evaluate_scaling_policy(
            proposed_capacity=proposed_cap,
            region=resource.get("region", "ap-south-1"),
            min_instances=resource.get("minCapacity", 2),
            max_instances=resource.get("maxCapacity", 8)
        )

        # Budget check
        budget_res = budget_engine.evaluate_budget(
            current_spend=current_spend,
            proposed_additional=cost_impact["difference"],
            monthly_budget=monthly_budget
        )

        # Safety check
        safety_res = safety_engine.evaluate_safety(
            current_capacity=current_cap,
            requested_capacity=proposed_cap
        )

        # Permission check
        has_exec_permission = user_role in ["ADMIN"]

        all_checks_passed = (
            policy_res["passed"]
            and budget_res["passed"]
            and safety_res["passed"]
            and has_exec_permission
        )

        rec_id = f"rec-{uuid.uuid4().hex[:8]}"

        return {
            "id": rec_id,
            "type": "SCALE_OUT",
            "resourceId": resource.get("id"),
            "resource": resource.get("name"),
            "currentCapacity": current_cap,
            "proposedCapacity": proposed_cap,
            "reasons": reasons,
            "cost": {
                "currency": "INR",
                "currencySymbol": "₹",
                "currentMonthly": cost_impact["currentMonthly"],
                "proposedMonthly": cost_impact["proposedMonthly"],
                "difference": cost_impact["difference"],
                "daily": cost_impact["estimatedDailyImpact"],
                "hourly": cost_impact["estimatedHourlyImpact"]
            },
            "checks": {
                "policy": policy_res["result"],
                "policyReasons": policy_res["reasons"],
                "budget": budget_res["result"],
                "budgetReasons": budget_res["reasons"],
                "permission": "PASS" if has_exec_permission else "FAIL",
                "permissionReasons": ["User has scaling.execute permission"] if has_exec_permission else ["User role lacks scaling.execute authorization"],
                "safety": safety_res["result"],
                "safetyReasons": safety_res["reasons"]
            },
            "requiresApproval": True,
            "status": "PENDING" if all_checks_passed else ("BLOCKED" if not budget_res["passed"] or not policy_res["passed"] or not safety_res["passed"] else "PENDING"),
            "createdAt": datetime.utcnow().isoformat()
        }

recommendation_engine = RecommendationEngine()
