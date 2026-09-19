import pytest
from backend.app.engines.scaling import scaling_engine

def test_scale_out_under_high_cpu():
    """Verify that when CPU rises to 86%, capacity scales from 2 to 4 instances."""
    res = scaling_engine.calculate_scale_out(
        current_instances=2,
        current_cpu=86.4,
        target_cpu=60.0,
        safety_margin=1.2,
        min_instances=2,
        max_instances=8,
        max_scale_delta=4
    )
    assert res["shouldScale"] is True
    assert res["type"] == "SCALE_OUT"
    assert res["currentCapacity"] == 2
    assert res["recommendedCapacity"] == 4
    assert res["delta"] == 2

def test_scale_in_under_idle_load():
    """Verify that when CPU is idle (<25%), capacity scales in towards minimum."""
    res = scaling_engine.calculate_scale_in(
        current_instances=4,
        current_cpu=18.0,
        min_instances=2
    )
    assert res["shouldScale"] is True
    assert res["type"] == "SCALE_IN"
    assert res["recommendedCapacity"] == 3

def test_respects_max_capacity_bounds():
    """Verify scaling never exceeds policy maximum capacity."""
    res = scaling_engine.calculate_scale_out(
        current_instances=7,
        current_cpu=99.0,
        target_cpu=40.0,
        max_instances=8
    )
    assert res["recommendedCapacity"] <= 8

def test_respects_max_scale_delta():
    """Verify scaling never jumps more than the allowed delta limit."""
    res = scaling_engine.calculate_scale_out(
        current_instances=2,
        current_cpu=99.0,
        target_cpu=20.0,
        max_instances=20,
        max_scale_delta=4
    )
    assert res["delta"] <= 4
