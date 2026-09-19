import math
from typing import Dict, Any, Optional

class ScalingEngine:
    """
    Explainable Capacity Algorithm.
    Calculates target instances based on observed CPU/traffic load relative to targets,
    applies configurable safety margin, and bounds by min/max capacity and max scale delta.
    """

    def calculate_scale_out(
        self,
        current_instances: int,
        current_cpu: float,
        target_cpu: float = 60.0,
        safety_margin: float = 1.2,
        min_instances: int = 2,
        max_instances: int = 8,
        max_scale_delta: int = 4
    ) -> Dict[str, Any]:
        """
        Calculates recommended capacity when under elevated load.
        """
        if current_instances <= 0:
            current_instances = min_instances

        # Base estimated capacity required to return CPU to target
        raw_estimate = math.ceil(current_instances * current_cpu / target_cpu)
        
        # Apply safety margin
        estimated_with_margin = math.ceil(raw_estimate * safety_margin)

        # Enforce delta limit
        max_allowed_target = current_instances + max_scale_delta
        bounded_target = min(estimated_with_margin, max_allowed_target)

        # Enforce global bounds
        final_capacity = max(min_instances, min(max_instances, bounded_target))

        # Check if scaling is actually needed
        should_scale = final_capacity > current_instances

        return {
            "shouldScale": should_scale,
            "type": "SCALE_OUT" if should_scale else "NONE",
            "currentCapacity": current_instances,
            "recommendedCapacity": final_capacity if should_scale else current_instances,
            "delta": final_capacity - current_instances,
            "formula": f"ceil({current_instances} * {current_cpu} / {target_cpu}) = {raw_estimate}; with {safety_margin}x safety margin -> {final_capacity}",
            "isBoundedByMax": bounded_target >= max_instances,
            "isBoundedByDelta": estimated_with_margin > max_allowed_target
        }

    def calculate_scale_in(
        self,
        current_instances: int,
        current_cpu: float,
        target_cpu: float = 60.0,
        min_instances: int = 2
    ) -> Dict[str, Any]:
        """
        Calculates recommended capacity when under very low idle load.
        """
        if current_cpu < 25.0 and current_instances > min_instances:
            new_capacity = max(min_instances, current_instances - 1)
            return {
                "shouldScale": True,
                "type": "SCALE_IN",
                "currentCapacity": current_instances,
                "recommendedCapacity": new_capacity,
                "delta": new_capacity - current_instances,
                "formula": f"Idle CPU ({current_cpu}% < 25%) -> reduce capacity by 1 instance"
            }
        return {
            "shouldScale": False,
            "type": "NONE",
            "currentCapacity": current_instances,
            "recommendedCapacity": current_instances,
            "delta": 0,
            "formula": "Nominal load"
        }

scaling_engine = ScalingEngine()
