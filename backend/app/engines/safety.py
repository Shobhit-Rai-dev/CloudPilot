from typing import Dict, Any, List

class SafetyEngine:
    """
    Safety Engine. Independent safety limits enforcing hard operational constraints:
    maximum scale delta per step, absolute maximum capacity limits, and sanity checks.
    """

    def __init__(self, max_scale_delta: int = 4, absolute_max_instances: int = 10):
        self.max_scale_delta = max_scale_delta
        self.absolute_max_instances = absolute_max_instances

    def evaluate_safety(
        self,
        current_capacity: int,
        requested_capacity: int
    ) -> Dict[str, Any]:
        delta = abs(requested_capacity - current_capacity)
        reasons: List[str] = []
        is_safe = True

        if requested_capacity > self.absolute_max_instances:
            is_safe = False
            reasons.append(
                f"Requested capacity {requested_capacity} exceeds absolute hard safety limit of {self.absolute_max_instances} instances"
            )

        if delta > self.max_scale_delta:
            is_safe = False
            reasons.append(
                f"Scale jump of +{delta} instances exceeds maximum allowed delta limit (+{self.max_scale_delta} per action)"
            )

        if is_safe:
            reasons.append(f"Scale step (+{delta} instances) is well within safety delta limit (+{self.max_scale_delta})")
            reasons.append(f"Target capacity ({requested_capacity}) is within safe ceiling ({self.absolute_max_instances})")

        return {
            "result": "PASS" if is_safe else "FAIL",
            "passed": is_safe,
            "delta": delta,
            "maxDeltaAllowed": self.max_scale_delta,
            "absoluteMax": self.absolute_max_instances,
            "reasons": reasons
        }

safety_engine = SafetyEngine()
