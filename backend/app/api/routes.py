import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.schema import (
    User, Role, Resource, CloudAccount, Policy, Budget,
    Recommendation, AuditLog, ActionExecution
)
from backend.app.auth.rbac import (
    get_current_user, require_permission, create_access_token, verify_password
)
from backend.app.providers import get_cloud_provider, mock_provider_instance
from backend.app.engines.monitoring import monitoring_engine
from backend.app.engines.health import health_engine
from backend.app.engines.cost import cost_engine
from backend.app.engines.recommendation import recommendation_engine
from backend.app.engines.action import action_engine
from backend.app.api.websocket import ws_manager

router = APIRouter()

# ----------------- Auth Schemas & Endpoints -----------------

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.name})
    
    # Audit log
    audit = AuditLog(
        user_name=user.name,
        action="LOGIN",
        result="SUCCESS",
        details=f"User {user.email} logged in with role {user.role.name}"
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.name
        }
    }

@router.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    user_perms = [rp.permission.code for rp in current_user.role.role_permissions if rp.permission] if current_user.role else []
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.name if current_user.role else "VIEWER",
        "permissions": user_perms
    }

# ----------------- Dashboard Summary -----------------

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    provider = get_cloud_provider()
    resources = provider.list_resources()
    costs = provider.get_costs()

    prod_res = provider.get_resource("production-api") or (resources[0] if resources else {})
    
    # Calculate health overview
    warning_count = sum(1 for r in resources if r.get("health") == "WARNING")
    degraded_count = sum(1 for r in resources if r.get("health") in ["DEGRADED", "CRITICAL"])
    overall_health = "DEGRADED" if degraded_count > 0 else ("WARNING" if warning_count > 0 else "HEALTHY")
    overall_score = round(sum(r.get("healthScore", 90) for r in resources) / len(resources)) if resources else 95

    # Check pending recommendations
    pending_recs = db.query(Recommendation).filter(Recommendation.status == "PENDING").count()

    traffic_baseline = 8000.0
    current_traffic = prod_res.get("currentTraffic", 8000.0)
    traffic_change = round(((current_traffic - traffic_baseline) / traffic_baseline) * 100, 1)

    return {
        "health": {
            "score": overall_score,
            "state": overall_health,
            "warningCount": warning_count,
            "degradedCount": degraded_count
        },
        "resources": {
            "total": len(resources),
            "running": sum(1 for r in resources if r.get("status") == "RUNNING"),
            "warning": warning_count,
            "critical": degraded_count
        },
        "cost": {
            "currency": "INR",
            "currencySymbol": "₹",
            "today": costs.get("todaySpend", 840.0),
            "month": costs.get("totalMonthlySpend", 18000.0),
            "budget": costs.get("monthlyBudget", 30000.0),
            "projected": costs.get("forecastMonthlySpend", 18720.0),
            "utilizationPercent": round((costs.get("totalMonthlySpend", 18000.0) / costs.get("monthlyBudget", 30000.0)) * 100, 1)
        },
        "traffic": {
            "current": current_traffic,
            "changePercent": traffic_change
        },
        "latency": {
            "p95": prod_res.get("currentLatency", 180.0)
        },
        "cpu": {
            "current": prod_res.get("currentCpu", 45.0)
        },
        "recommendationsCount": pending_recs,
        "isSimulationSpikeActive": getattr(mock_provider_instance, "_is_spike_active", False)
    }

# ----------------- Resources Endpoints -----------------

@router.get("/resources")
def list_resources(
    provider: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None
):
    cloud = get_cloud_provider()
    items = cloud.list_resources()
    if provider:
        items = [r for r in items if r.get("provider", "").lower() == provider.lower()]
    if type:
        items = [r for r in items if r.get("type", "").lower() == type.lower()]
    if status:
        items = [r for r in items if r.get("status", "").lower() == status.lower()]
    return items

@router.get("/resources/{id}")
def get_resource_detail(id: str):
    cloud = get_cloud_provider()
    res = cloud.get_resource(id)
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res

@router.get("/resources/{id}/metrics")
def get_resource_metrics(id: str, range: str = Query("1h", pattern="^(1h|6h|24h|7d)$")):
    cloud = get_cloud_provider()
    return cloud.get_metrics(id, time_range=range)

@router.get("/services/{id}/health")
def get_service_health(id: str):
    cloud = get_cloud_provider()
    return cloud.get_health(id)

# ----------------- External Metrics Ingestion -----------------

class IngestMetricPayload(BaseModel):
    service: str
    requests: Optional[float] = None
    latency_p95: Optional[float] = None
    error_rate: Optional[float] = None
    cpu: Optional[float] = None

@router.post("/metrics")
async def ingest_metrics(payload: IngestMetricPayload, db: Session = Depends(get_db)):
    """Accepts external metric telemetry from applications or agent probes."""
    cloud = get_cloud_provider()
    res = cloud.get_resource(payload.service)
    if res:
        if payload.cpu is not None:
            res["currentCpu"] = payload.cpu
        if payload.latency_p95 is not None:
            res["currentLatency"] = payload.latency_p95
        if payload.requests is not None:
            res["currentTraffic"] = payload.requests
        if payload.error_rate is not None:
            res["errorRate"] = payload.error_rate

        # Re-evaluate health
        health_eval = health_engine.evaluate_resource_health(
            cpu=res.get("currentCpu", 45.0),
            latency=res.get("currentLatency", 180.0),
            error_rate=res.get("errorRate", 0.5)
        )
        res["health"] = health_eval["status"]
        res["healthScore"] = health_eval["score"]
        res["healthReasons"] = health_eval["reasons"]

        await ws_manager.broadcast({
            "event": "METRICS_UPDATED",
            "service": payload.service,
            "health": health_eval
        })

    return {"status": "INGESTED", "service": payload.service}

# ----------------- Costs Endpoints -----------------

@router.get("/costs")
def get_costs():
    cloud = get_cloud_provider()
    return cloud.get_costs()

# ----------------- Recommendations Endpoints -----------------

@router.get("/recommendations")
def list_recommendations(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Recommendation)
    if status_filter:
        query = query.filter(Recommendation.status == status_filter)
    recs = query.order_by(Recommendation.created_at.desc()).all()
    
    # Format response
    output = []
    for r in recs:
        output.append({
            "id": r.id,
            "type": r.type,
            "resourceId": r.resource_id,
            "resource": r.resource_name,
            "currentCapacity": r.current_capacity,
            "proposedCapacity": r.proposed_capacity,
            "reasons": r.reasons or [],
            "cost": {
                "currency": "INR",
                "currencySymbol": "₹",
                "currentMonthly": r.current_monthly_cost,
                "proposedMonthly": r.proposed_monthly_cost,
                "difference": r.difference_cost
            },
            "checks": {
                "policy": r.check_policy,
                "budget": r.check_budget,
                "permission": r.check_permission,
                "safety": r.check_safety
            },
            "requiresApproval": r.requires_approval,
            "status": r.status,
            "createdAt": r.created_at.isoformat() if r.created_at else None
        })
    return output

@router.post("/recommendations/{id}/approve")
async def approve_recommendation(
    id: str,
    current_user: User = Depends(require_permission("scaling.execute")),
    db: Session = Depends(get_db)
):
    """Executes approved scaling action via decoupled Action Execution Engine."""
    result = action_engine.execute_scaling_action(db=db, recommendation_id=id, user_name=current_user.name)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    await ws_manager.broadcast({
        "event": "RECOMMENDATION_EXECUTED",
        "recommendationId": id,
        "result": result
    })

    return result

@router.post("/recommendations/{id}/reject")
async def reject_recommendation(
    id: str,
    current_user: User = Depends(require_permission("scaling.execute")),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    rec.status = "REJECTED"
    audit = AuditLog(
        user_name=current_user.name,
        action="RECOMMENDATION_REJECTED",
        resource_name=rec.resource_name,
        old_state=f"{rec.current_capacity} instances",
        new_state=f"Rejected proposal for {rec.proposed_capacity}",
        result="SUCCESS",
        details="User rejected scaling recommendation"
    )
    db.add(audit)
    db.commit()

    await ws_manager.broadcast({
        "event": "RECOMMENDATION_REJECTED",
        "recommendationId": id
    })

    return {"success": True, "status": "REJECTED", "recommendationId": id}

# ----------------- Policies Endpoints -----------------

@router.get("/policies")
def list_policies(db: Session = Depends(get_db)):
    return db.query(Policy).all()

class UpdatePolicyPayload(BaseModel):
    min_instances: Optional[int] = None
    max_instances: Optional[int] = None
    max_scale_delta: Optional[int] = None
    max_hourly_cost: Optional[float] = None
    allowed_regions: Optional[str] = None
    require_approval: Optional[bool] = None
    automatic_scaling: Optional[bool] = None

@router.put("/policies/{id}")
def update_policy(
    id: str,
    payload: UpdatePolicyPayload,
    current_user: User = Depends(require_permission("policy.modify")),
    db: Session = Depends(get_db)
):
    policy = db.query(Policy).filter(Policy.id == id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(policy, key, value)
    
    audit = AuditLog(
        user_name=current_user.name,
        action="POLICY_MODIFY",
        resource_name=policy.name,
        result="SUCCESS",
        details=f"Updated policy {policy.name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(policy)
    return policy

# ----------------- Budgets Endpoints -----------------

@router.get("/budgets")
def list_budgets(db: Session = Depends(get_db)):
    return db.query(Budget).all()

class UpdateBudgetPayload(BaseModel):
    monthly_limit: Optional[float] = None
    warning_threshold: Optional[float] = None

@router.put("/budgets/{id}")
def update_budget(
    id: str,
    payload: UpdateBudgetPayload,
    current_user: User = Depends(require_permission("budget.modify")),
    db: Session = Depends(get_db)
):
    budget = db.query(Budget).filter(Budget.id == id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(budget, key, value)
    
    audit = AuditLog(
        user_name=current_user.name,
        action="BUDGET_MODIFY",
        resource_name=budget.name,
        result="SUCCESS",
        details=f"Updated monthly limit to ₹{budget.monthly_limit:,.0f}"
    )
    db.add(audit)
    db.commit()
    db.refresh(budget)
    return budget

# ----------------- Audit Logs Endpoints -----------------

@router.get("/audit-logs")
def list_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()

# ----------------- Cloud Accounts Endpoints -----------------

@router.get("/cloud/accounts")
def list_cloud_accounts(db: Session = Depends(get_db)):
    return db.query(CloudAccount).all()

# ----------------- Hackathon Demo Simulation Controls -----------------

@router.post("/simulation/traffic-spike")
async def trigger_traffic_spike(db: Session = Depends(get_db)):
    """
    PRIMARY HACKATHON DEMO TRIGGER:
    1. Injects heavy traffic spike into mock provider (CPU: 86.4%, Latency: 520ms, Traffic: +55%).
    2. Updates DB resource state.
    3. Triggers RecommendationEngine to generate SCALE_OUT 2 -> 4 recommendation.
    4. Evaluates Policy (PASS), Budget (PASS), Permission (PASS), Safety (PASS).
    5. Persists recommendation and broadcasts via WebSocket.
    """
    spike_data = mock_provider_instance.simulate_traffic_spike()
    prod_res = mock_provider_instance.get_resource("production-api")

    # Update DB representation
    db_res = db.query(Resource).filter(Resource.name == "production-api").first()
    if db_res:
        db_res.current_cpu = prod_res["currentCpu"]
        db_res.current_latency = prod_res["currentLatency"]
        db_res.current_traffic = prod_res["currentTraffic"]
        db_res.status = "DEGRADED"

    # Generate recommendation
    rec_dict = recommendation_engine.generate_scaling_recommendation(
        resource=prod_res,
        user_role="ADMIN",
        monthly_budget=30000.0,
        current_spend=18000.0
    )

    if rec_dict:
        # Check if an existing pending recommendation already exists for this resource
        existing_rec = db.query(Recommendation).filter(
            Recommendation.resource_id == prod_res["id"],
            Recommendation.status == "PENDING"
        ).first()

        if not existing_rec:
            new_rec = Recommendation(
                id=rec_dict["id"],
                type=rec_dict["type"],
                resource_id=rec_dict["resourceId"],
                resource_name=rec_dict["resource"],
                current_capacity=rec_dict["currentCapacity"],
                proposed_capacity=rec_dict["proposedCapacity"],
                reasons=rec_dict["reasons"],
                current_monthly_cost=rec_dict["cost"]["currentMonthly"],
                proposed_monthly_cost=rec_dict["cost"]["proposedMonthly"],
                difference_cost=rec_dict["cost"]["difference"],
                check_policy=rec_dict["checks"]["policy"],
                check_budget=rec_dict["checks"]["budget"],
                check_permission=rec_dict["checks"]["permission"],
                check_safety=rec_dict["checks"]["safety"],
                requires_approval=rec_dict["requiresApproval"],
                status=rec_dict["status"]
            )
            db.add(new_rec)
        
        # Log traffic spike in audit log
        audit = AuditLog(
            user_name="DemoOperator",
            action="SIMULATE_TRAFFIC_SPIKE",
            resource_name="production-api",
            old_state="Normal Load (45% CPU, 180ms P95)",
            new_state="High Load (86.4% CPU, 520ms P95)",
            result="SUCCESS",
            details="Injected traffic spike for demonstration"
        )
        db.add(audit)
        db.commit()

        await ws_manager.broadcast({
            "event": "TRAFFIC_SPIKE_TRIGGERED",
            "spike": spike_data,
            "recommendation": rec_dict
        })

        return {
            "spike": spike_data,
            "recommendation": rec_dict
        }

    return {"spike": spike_data, "recommendation": None}

@router.post("/simulation/reset")
async def reset_simulation(db: Session = Depends(get_db)):
    """Restores baseline state for repeatable demonstration."""
    mock_provider_instance.reset_simulation()
    
    # Reset DB resource
    db_res = db.query(Resource).filter(Resource.name == "production-api").first()
    if db_res:
        db_res.capacity = 2
        db_res.current_cpu = 45.0
        db_res.current_latency = 180.0
        db_res.current_traffic = 8000.0
        db_res.current_monthly_cost = 18000.0
        db_res.status = "RUNNING"
    
    # Reset pending recommendations
    db.query(Recommendation).filter(Recommendation.status == "PENDING").delete()
    
    audit = AuditLog(
        user_name="DemoOperator",
        action="SIMULATION_RESET",
        resource_name="production-api",
        old_state=None,
        new_state="2 instances (Baseline)",
        result="SUCCESS",
        details="Restored initial mock demo state"
    )
    db.add(audit)
    db.commit()

    await ws_manager.broadcast({
        "event": "SIMULATION_RESET"
    })

    return {"status": "RESET_SUCCESS", "message": "Simulation restored to baseline (2 instances, 45% CPU, 180ms latency)"}
