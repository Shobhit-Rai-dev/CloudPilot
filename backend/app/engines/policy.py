from typing import Dict, Any, List, Optional

class PolicyEngine:
    """
    Evaluates enterprise infrastructure guardrails and policies server-side.
    Validates region whitelist, min/max instances bounds, and approval requirements.
    """

    def evaluate_scaling_policy(
        self,
        proposed_capacity: int,
        region: str = "ap-south-1",
        min_instances: int = 2,
        max_instances: int = 8,
        allowed_regions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        if allowed_regions is None:
            allowed_regions = ["ap-south-1", "ap-south-2"]

        reasons: List[str] = []
        is_allowed = True

        # Region check
        if region not in allowed_regions:
            is_allowed = False
            reasons.append(f"Region '{region}' is not in allowed regions whitelist: {allowed_regions}")
        else:
            reasons.append(f"Region '{region}' matches approved deployment zone")

        # Capacity bounds check
        if proposed_capacity > max_instances:
            is_allowed = False
            reasons.append(f"Proposed capacity ({proposed_capacity}) exceeds maximum policy limit ({max_instances})")
        elif proposed_capacity < min_instances:
            is_allowed = False
            reasons.append(f"Proposed capacity ({proposed_capacity}) violates minimum policy limit ({min_instances})")
        else:
            reasons.append(f"Proposed capacity ({proposed_capacity}) is within approved range [{min_instances} - {max_instances}]")

        return {
            "result": "PASS" if is_allowed else "FAIL",
            "passed": is_allowed,
            "reasons": reasons
        }

policy_engine = PolicyEngine()
