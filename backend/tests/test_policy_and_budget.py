import pytest
from backend.app.engines.policy import policy_engine
from backend.app.engines.budget import budget_engine
from backend.app.engines.safety import safety_engine

def test_policy_allowed_region():
    res = policy_engine.evaluate_scaling_policy(
        proposed_capacity=4,
        region="ap-south-1",
        min_instances=2,
        max_instances=8,
        allowed_regions=["ap-south-1", "ap-south-2"]
    )
    assert res["passed"] is True
    assert res["result"] == "PASS"

def test_policy_forbidden_region():
    res = policy_engine.evaluate_scaling_policy(
        proposed_capacity=4,
        region="us-east-1",
        allowed_regions=["ap-south-1"]
    )
    assert res["passed"] is False
    assert res["result"] == "FAIL"

def test_budget_within_limits():
    res = budget_engine.evaluate_budget(
        current_spend=18000.0,
        proposed_additional=7200.0,
        monthly_budget=30000.0
    )
    assert res["passed"] is True
    assert res["projectedTotal"] == 25200.0
    assert res["result"] == "PASS"

def test_budget_exceeded():
    res = budget_engine.evaluate_budget(
        current_spend=25000.0,
        proposed_additional=8000.0,
        monthly_budget=30000.0
    )
    assert res["passed"] is False
    assert res["projectedTotal"] == 33000.0
    assert res["result"] == "FAIL"

def test_safety_bounds_and_delta():
    # Normal delta of 2 is safe
    safe_res = safety_engine.evaluate_safety(current_capacity=2, requested_capacity=4)
    assert safe_res["passed"] is True

    # Dangerous jump of 10 instances blocked
    danger_res = safety_engine.evaluate_safety(current_capacity=2, requested_capacity=12)
    assert danger_res["passed"] is False
