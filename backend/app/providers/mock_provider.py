from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random
from backend.app.providers.base import CloudProvider

class MockCloudProvider(CloudProvider):
    """
    Realistic Mock Cloud Provider simulating an enterprise AWS environment.
    Supports on-demand traffic spikes, capacity scaling, realistic telemetry metrics,
    and granular billing data for the hackathon scenario.
    """

    def __init__(self):
        self._is_spike_active = False
        self._spike_timestamp: Optional[datetime] = None
        self._init_resources()

    def _init_resources(self):
        self.resources = {
            "res-prod-api": {
                "id": "res-prod-api",
                "provider": "AWS",
                "providerResourceId": "asg-prod-api-01",
                "type": "COMPUTE",
                "name": "production-api",
                "service": "EC2 / Auto Scaling",
                "region": "ap-south-1",
                "status": "RUNNING",
                "capacity": 2,
                "minCapacity": 2,
                "maxCapacity": 8,
                "currentCpu": 45.0,
                "currentMemory": 61.0,
                "currentLatency": 180.0,
                "currentTraffic": 8000.0,
                "errorRate": 0.5,
                "monthlyCost": 18000.0,
                "unitCost": 3600.0,  # ₹3,600/month per instance + baseline infrastructure
                "health": "HEALTHY",
                "healthScore": 96,
                "healthReasons": ["All operational metrics within nominal limits"],
                "updatedAt": datetime.utcnow().isoformat()
            },
            "res-stage-api": {
                "id": "res-stage-api",
                "provider": "AWS",
                "providerResourceId": "i-0a8b9c1d2e3f4001",
                "type": "COMPUTE",
                "name": "staging-api",
                "service": "EC2",
                "region": "ap-south-1",
                "status": "RUNNING",
                "capacity": 1,
                "minCapacity": 1,
                "maxCapacity": 4,
                "currentCpu": 18.0,
                "currentMemory": 42.0,
                "currentLatency": 115.0,
                "currentTraffic": 1500.0,
                "errorRate": 0.1,
                "monthlyCost": 3600.0,
                "unitCost": 3600.0,
                "health": "HEALTHY",
                "healthScore": 99,
                "healthReasons": ["Low load, nominal latency"],
                "updatedAt": datetime.utcnow().isoformat()
            },
            "res-db-primary": {
                "id": "res-db-primary",
                "provider": "AWS",
                "providerResourceId": "rds-pg-prod-master",
                "type": "DATABASE",
                "name": "production-db",
                "service": "RDS PostgreSQL",
                "region": "ap-south-1",
                "status": "RUNNING",
                "capacity": 1,
                "minCapacity": 1,
                "maxCapacity": 2,
                "currentCpu": 52.0,
                "currentMemory": 72.0,
                "currentLatency": 14.0,
                "currentTraffic": 18500.0,
                "errorRate": 0.0,
                "monthlyCost": 9500.0,
                "unitCost": 9500.0,
                "health": "HEALTHY",
                "healthScore": 92,
                "healthReasons": ["Connection pool healthy, disk IOPS within range"],
                "updatedAt": datetime.utcnow().isoformat()
            },
            "res-s3-assets": {
                "id": "res-s3-assets",
                "provider": "AWS",
                "providerResourceId": "s3-prod-cloudops-media",
                "type": "STORAGE",
                "name": "assets-bucket",
                "service": "S3 Standard",
                "region": "ap-south-1",
                "status": "RUNNING",
                "capacity": 1,
                "minCapacity": 1,
                "maxCapacity": 1,
                "currentCpu": 0.0,
                "currentMemory": 0.0,
                "currentLatency": 45.0,
                "currentTraffic": 6200.0,
                "errorRate": 0.0,
                "monthlyCost": 3200.0,
                "unitCost": 3200.0,
                "health": "HEALTHY",
                "healthScore": 100,
                "healthReasons": ["99.999% availability, standard tier"],
                "updatedAt": datetime.utcnow().isoformat()
            },
            "res-lb-external": {
                "id": "res-lb-external",
                "provider": "AWS",
                "providerResourceId": "alb-external-ap-south",
                "type": "LOAD_BALANCER",
                "name": "ingress-alb",
                "service": "Application Load Balancer",
                "region": "ap-south-1",
                "status": "RUNNING",
                "capacity": 2,
                "minCapacity": 2,
                "maxCapacity": 4,
                "currentCpu": 28.0,
                "currentMemory": 35.0,
                "currentLatency": 18.0,
                "currentTraffic": 20400.0,
                "errorRate": 0.2,
                "monthlyCost": 2800.0,
                "unitCost": 1400.0,
                "health": "HEALTHY",
                "healthScore": 98,
                "healthReasons": ["All target groups healthy"],
                "updatedAt": datetime.utcnow().isoformat()
            }
        }

    def list_resources(self) -> List[Dict[str, Any]]:
        return list(self.resources.values())

    def get_resource(self, resource_id: str) -> Optional[Dict[str, Any]]:
        # Match by ID or Name
        for res in self.resources.values():
            if res["id"] == resource_id or res["name"] == resource_id:
                return res
        return None

    def get_metrics(self, resource_id: str, time_range: str = "1h") -> List[Dict[str, Any]]:
        res = self.get_resource(resource_id)
        if not res:
            return []

        # Determine number of data points
        num_points = 24 if time_range in ["1h", "6h"] else 48
        step_minutes = 2.5 if time_range == "1h" else (15 if time_range == "6h" else 60)
        
        now = datetime.utcnow()
        points = []

        base_cpu = res["currentCpu"]
        base_latency = res["currentLatency"]
        base_traffic = res["currentTraffic"]
        base_error = res["errorRate"]

        for i in range(num_points, 0, -1):
            ts = now - timedelta(minutes=i * step_minutes)
            
            # If spike is currently active, simulate recent rise in the last few points
            if self._is_spike_active and res["name"] == "production-api":
                if i <= 6:  # recent points under spike
                    point_cpu = round(min(98.0, max(82.0, base_cpu + random.uniform(-2, 3))), 1)
                    point_latency = round(min(650.0, max(490.0, base_latency + random.uniform(-20, 30))), 1)
                    point_traffic = round(base_traffic + random.uniform(-300, 500), 0)
                    point_error = round(min(5.0, max(2.5, base_error + random.uniform(-0.4, 0.6))), 2)
                else:  # historical baseline prior to spike
                    point_cpu = round(45.0 + random.uniform(-4, 4), 1)
                    point_latency = round(180.0 + random.uniform(-15, 20), 1)
                    point_traffic = round(8000.0 + random.uniform(-400, 400), 0)
                    point_error = round(0.4 + random.uniform(-0.1, 0.2), 2)
            else:
                point_cpu = round(max(5.0, base_cpu + random.uniform(-3, 3)), 1)
                point_latency = round(max(10.0, base_latency + random.uniform(-10, 10)), 1)
                point_traffic = round(max(100.0, base_traffic + random.uniform(-250, 250)), 0)
                point_error = round(max(0.01, base_error + random.uniform(-0.1, 0.1)), 2)

            points.append({
                "timestamp": ts.strftime("%H:%M:%S"),
                "isoTimestamp": ts.isoformat(),
                "cpu": point_cpu,
                "memory": round(res["currentMemory"] + random.uniform(-2, 2), 1),
                "latency": point_latency,
                "traffic": point_traffic,
                "errorRate": point_error,
                "instances": res["capacity"]
            })

        return points

    def get_health(self, resource_id: str) -> Dict[str, Any]:
        res = self.get_resource(resource_id)
        if not res:
            return {"status": "UNKNOWN", "score": 0, "reasons": ["Resource not found"]}
        return {
            "resourceId": res["id"],
            "resourceName": res["name"],
            "status": res["health"],
            "score": res["healthScore"],
            "reasons": res["healthReasons"],
            "updatedAt": res["updatedAt"]
        }

    def get_costs(self) -> Dict[str, Any]:
        total_monthly = sum(r["monthlyCost"] for r in self.resources.values())
        today_cost = round(total_monthly / 30, 2)
        by_service = {}
        by_resource = {}
        for r in self.resources.values():
            by_service[r["service"]] = by_service.get(r["service"], 0) + r["monthlyCost"]
            by_resource[r["name"]] = r["monthlyCost"]

        return {
            "currency": "INR",
            "currencySymbol": "₹",
            "totalMonthlySpend": total_monthly,
            "todaySpend": today_cost,
            "monthlyBudget": 30000.0,
            "forecastMonthlySpend": round(total_monthly * 1.04, 2),
            "spendByService": by_service,
            "spendByResource": by_resource
        }

    def get_pricing(self, service_type: str = "COMPUTE") -> Dict[str, Any]:
        return {
            "provider": "AWS",
            "currency": "INR",
            "unit": "per_instance_month",
            "rate": 3600.0,  # ₹3,600 / month per t4g.xlarge / c6g.xlarge equivalent
            "hourlyRate": 5.0
        }

    def scale_resource(self, resource_id: str, target_capacity: int) -> Dict[str, Any]:
        res = self.get_resource(resource_id)
        if not res:
            return {"success": False, "error": "Resource not found"}

        old_capacity = res["capacity"]
        res["capacity"] = target_capacity

        # Update cost dynamically
        # Baseline ₹10,800 + (capacity * ₹3,600)
        # for capacity 2: 10800 + 7200 = 18000
        # for capacity 4: 10800 + 14400 = 25200
        res["monthlyCost"] = 10800.0 + (target_capacity * 3600.0)

        # If scaled to 4 or more during spike, normalize metrics back to nominal
        if target_capacity >= 4:
            self._is_spike_active = False
            res["currentCpu"] = 43.2
            res["currentLatency"] = 190.0
            res["currentTraffic"] = 12400.0  # Still handling elevated traffic gracefully!
            res["errorRate"] = 0.35
            res["health"] = "HEALTHY"
            res["healthScore"] = 97
            res["healthReasons"] = [
                f"Capacity scaled to {target_capacity} instances",
                "CPU load distributed (43.2%)",
                "P95 latency normalized (190ms)"
            ]
        elif target_capacity < 2:
            res["health"] = "WARNING"
            res["healthScore"] = 70
            res["healthReasons"] = ["Under-provisioned capacity below safety margin"]

        res["updatedAt"] = datetime.utcnow().isoformat()

        return {
            "success": True,
            "resourceId": res["id"],
            "resourceName": res["name"],
            "oldCapacity": old_capacity,
            "verifiedCapacity": res["capacity"],
            "newMonthlyCost": res["monthlyCost"],
            "status": "SUCCESS"
        }

    def start_resource(self, resource_id: str) -> Dict[str, Any]:
        res = self.get_resource(resource_id)
        if res:
            res["status"] = "RUNNING"
            return {"success": True, "status": "RUNNING"}
        return {"success": False, "error": "Resource not found"}

    def stop_resource(self, resource_id: str) -> Dict[str, Any]:
        res = self.get_resource(resource_id)
        if res:
            res["status"] = "STOPPED"
            return {"success": True, "status": "STOPPED"}
        return {"success": False, "error": "Resource not found"}

    # Demo Simulation Triggers
    def simulate_traffic_spike(self) -> Dict[str, Any]:
        """
        Injects the hackathon demo condition:
        Traffic: normal -> 12,400 req/min (+55%)
        CPU: 45% -> 86.4%
        Latency: 180ms -> 520ms
        Error rate: 0.5% -> 3.1%
        Health: HEALTHY -> DEGRADED
        """
        self._is_spike_active = True
        self._spike_timestamp = datetime.utcnow()

        prod_res = self.resources["res-prod-api"]
        prod_res["capacity"] = 2  # Remains at 2 before scaling
        prod_res["currentCpu"] = 86.4
        prod_res["currentLatency"] = 520.0
        prod_res["currentTraffic"] = 12400.0
        prod_res["errorRate"] = 3.1
        prod_res["health"] = "DEGRADED"
        prod_res["healthScore"] = 58
        prod_res["healthReasons"] = [
            "CPU utilization = 86.4% (Threshold > 75%)",
            "P95 latency = 520ms (Target <= 300ms)",
            "Traffic surge: 12,400 req/min (+55% increase over baseline)"
        ]
        prod_res["updatedAt"] = datetime.utcnow().isoformat()

        return {
            "status": "TRAFFIC_SPIKE_ACTIVE",
            "resource": prod_res["name"],
            "cpu": prod_res["currentCpu"],
            "latency": prod_res["currentLatency"],
            "traffic": prod_res["currentTraffic"],
            "health": prod_res["health"],
            "reasons": prod_res["healthReasons"]
        }

    def reset_simulation(self) -> Dict[str, Any]:
        """Resets all mock resources back to their baseline healthy state."""
        self._is_spike_active = False
        self._spike_timestamp = None
        self._init_resources()
        return {"status": "RESET_SUCCESS", "message": "Simulation restored to baseline"}

mock_provider_instance = MockCloudProvider()
