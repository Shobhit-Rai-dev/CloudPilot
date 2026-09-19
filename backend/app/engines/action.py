import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.providers import get_cloud_provider
from backend.app.models.schema import AuditLog, ActionExecution, Recommendation, Resource

class ActionExecutionEngine:
    """
    Decoupled Action Execution Layer.
    Responsible for executing approved infrastructure mutations via the CloudProvider adapter,
    performing post-execution state verification, and persisting immutable audit trails.
    """

    def execute_scaling_action(
        self,
        db: Session,
        recommendation_id: str,
        user_name: str = "Admin"
    ) -> Dict[str, Any]:
        # 1. Retrieve recommendation
        rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
        if not rec:
            return {"success": False, "error": f"Recommendation {recommendation_id} not found"}

        if rec.status not in ["PENDING", "APPROVED"]:
            return {"success": False, "error": f"Cannot execute recommendation with status '{rec.status}'"}

        # 2. Transition state to EXECUTING
        rec.status = "EXECUTING"
        db.commit()

        provider = get_cloud_provider()
        target_capacity = rec.proposed_capacity
        resource_id = rec.resource_id

        # 3. Invoke Cloud Provider Adapter Mutation
        mutation_result = provider.scale_resource(resource_id, target_capacity)

        if not mutation_result.get("success"):
            rec.status = "FAILED"
            db.commit()
            
            # Log failure in audit
            audit = AuditLog(
                user_name=user_name,
                action="SCALE_OUT_FAILED",
                resource_name=rec.resource_name,
                old_state=f"{rec.current_capacity} instances",
                new_state=f"{target_capacity} instances",
                result="FAILED",
                details=mutation_result.get("error", "Mutation rejected by provider")
            )
            db.add(audit)
            db.commit()
            return {"success": False, "error": mutation_result.get("error")}

        # 4. Mandatory State Verification: Query cloud provider to verify actual capacity == requested
        verified_res = provider.get_resource(resource_id)
        actual_capacity = verified_res.get("capacity") if verified_res else None

        if actual_capacity != target_capacity:
            rec.status = "FAILED"
            db.commit()
            return {
                "success": False,
                "error": f"State verification failed: Provider reports capacity {actual_capacity}, expected {target_capacity}"
            }

        # 5. Mark Recommendation as SUCCESS
        rec.status = "SUCCESS"
        
        # 6. Update database resource record if present
        db_res = db.query(Resource).filter(Resource.id == resource_id).first()
        if db_res:
            db_res.capacity = actual_capacity
            db_res.current_monthly_cost = rec.proposed_monthly_cost
            db_res.status = "RUNNING"
            db_res.current_cpu = verified_res.get("currentCpu", 43.2)
            db_res.current_latency = verified_res.get("currentLatency", 190.0)

        # 7. Record Action Execution Record
        action_exec = ActionExecution(
            recommendation_id=rec.id,
            resource_id=rec.resource_id,
            user_name=user_name,
            action_type=rec.type,
            old_capacity=rec.current_capacity,
            new_capacity=target_capacity,
            status="SUCCESS",
            verified_capacity=actual_capacity,
            details=f"Scaled from {rec.current_capacity} to {target_capacity} instances. Cost: ₹{rec.proposed_monthly_cost:,.0f}/mo (+₹{rec.difference_cost:,.0f})"
        )
        db.add(action_exec)

        # 8. Record Immutable Audit Log
        audit = AuditLog(
            user_name=user_name,
            action=rec.type,
            resource_name=rec.resource_name,
            old_state=f"{rec.current_capacity} instances",
            new_state=f"{actual_capacity} instances",
            result="SUCCESS",
            details=f"Approved and executed {rec.type} on {rec.resource_name}. Verified capacity: {actual_capacity}."
        )
        db.add(audit)
        db.commit()

        return {
            "success": True,
            "status": "SUCCESS",
            "recommendationId": rec.id,
            "resourceName": rec.resource_name,
            "oldCapacity": rec.current_capacity,
            "verifiedCapacity": actual_capacity,
            "proposedMonthlyCost": rec.proposed_monthly_cost,
            "differenceCost": rec.difference_cost,
            "message": f"Successfully scaled {rec.resource_name} to {actual_capacity} instances"
        }

action_engine = ActionExecutionEngine()
