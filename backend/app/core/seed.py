from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.models.schema import (
    Role, Permission, RolePermission, User, CloudAccount,
    Resource, Policy, Budget, AuditLog
)
from backend.app.auth.rbac import get_password_hash

ALL_PERMISSIONS = [
    ("resource.read", "View cloud resources"),
    ("resource.create", "Create new cloud resources"),
    ("resource.delete", "Delete cloud resources"),
    ("metrics.read", "View telemetry and performance metrics"),
    ("cost.read", "View cloud billing and cost reports"),
    ("health.read", "View service health assessments"),
    ("scaling.recommend", "Generate and review scaling recommendations"),
    ("scaling.execute", "Approve and execute cloud scaling operations"),
    ("policy.read", "View governance and guardrail policies"),
    ("policy.modify", "Update guardrail policies"),
    ("budget.read", "View financial budgets"),
    ("budget.modify", "Update budget allocations and thresholds"),
    ("cloud.connect", "Connect cloud provider accounts"),
    ("cloud.disconnect", "Disconnect cloud accounts"),
    ("audit.read", "View immutable audit logs")
]

def seed_database(db: Session):
    # 1. Seed Permissions
    perm_map = {}
    for code, desc in ALL_PERMISSIONS:
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(code=code, description=desc)
            db.add(perm)
            db.commit()
            db.refresh(perm)
        perm_map[code] = perm

    # 2. Seed Roles
    roles_data = [
        ("ADMIN", "Full platform administrative and infrastructure control"),
        ("DEVELOPER", "Operational visibility and scaling recommendations"),
        ("VIEWER", "Read-only access to infrastructure, metrics and costs")
    ]
    role_map = {}
    for r_name, r_desc in roles_data:
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            role = Role(name=r_name, description=r_desc)
            db.add(role)
            db.commit()
            db.refresh(role)
        role_map[r_name] = role

    # 3. Assign Role Permissions
    admin_perms = list(perm_map.keys())
    dev_perms = [
        "resource.read", "metrics.read", "cost.read", "health.read",
        "scaling.recommend", "policy.read", "budget.read", "audit.read"
    ]
    viewer_perms = [
        "resource.read", "metrics.read", "cost.read", "health.read",
        "policy.read", "budget.read", "audit.read"
    ]

    for r_name, perms in [("ADMIN", admin_perms), ("DEVELOPER", dev_perms), ("VIEWER", viewer_perms)]:
        role = role_map[r_name]
        for p_code in perms:
            p_obj = perm_map[p_code]
            existing = db.query(RolePermission).filter(
                RolePermission.role_id == role.id,
                RolePermission.permission_id == p_obj.id
            ).first()
            if not existing:
                rp = RolePermission(role_id=role.id, permission_id=p_obj.id)
                db.add(rp)
    db.commit()

    # 4. Seed Default Users
    users_data = [
        ("admin@cloudops.io", "Cloud Administrator", "admin123", "ADMIN"),
        ("developer@cloudops.io", "DevOps Engineer", "dev123", "DEVELOPER"),
        ("viewer@cloudops.io", "Security Auditor", "viewer123", "VIEWER")
    ]
    for email, name, pwd, r_name in users_data:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                name=name,
                hashed_password=get_password_hash(pwd),
                role_id=role_map[r_name].id
            )
            db.add(user)
    db.commit()

    # 5. Seed Cloud Accounts
    cloud_accounts = [
        {"name": "AWS Production Primary", "provider": "AWS", "account_id": "123456789012", "region": "ap-south-1", "status": "CONNECTED"},
        {"name": "Google Cloud Platform", "provider": "GCP", "account_id": "cloudops-prod-gcp", "region": "asia-south1", "status": "COMING_SOON"},
        {"name": "Microsoft Azure", "provider": "AZURE", "account_id": "sub-987654321", "region": "centralindia", "status": "COMING_SOON"}
    ]
    acc_map = {}
    for ca in cloud_accounts:
        existing = db.query(CloudAccount).filter(CloudAccount.name == ca["name"]).first()
        if not existing:
            existing = CloudAccount(**ca)
            db.add(existing)
            db.commit()
            db.refresh(existing)
        acc_map[ca["provider"]] = existing

    # 6. Seed Resources
    aws_acc = acc_map.get("AWS")
    resources_data = [
        {
            "id": "res-prod-api",
            "cloud_account_id": aws_acc.id if aws_acc else None,
            "provider": "AWS",
            "provider_resource_id": "asg-prod-api-01",
            "type": "COMPUTE",
            "name": "production-api",
            "region": "ap-south-1",
            "status": "RUNNING",
            "capacity": 2,
            "min_capacity": 2,
            "max_capacity": 8,
            "current_cpu": 45.0,
            "current_memory": 61.0,
            "current_latency": 180.0,
            "current_traffic": 8000.0,
            "current_monthly_cost": 18000.0
        },
        {
            "id": "res-stage-api",
            "cloud_account_id": aws_acc.id if aws_acc else None,
            "provider": "AWS",
            "provider_resource_id": "i-0a8b9c1d2e3f4001",
            "type": "COMPUTE",
            "name": "staging-api",
            "region": "ap-south-1",
            "status": "RUNNING",
            "capacity": 1,
            "min_capacity": 1,
            "max_capacity": 4,
            "current_cpu": 18.0,
            "current_memory": 42.0,
            "current_latency": 115.0,
            "current_traffic": 1500.0,
            "current_monthly_cost": 3600.0
        },
        {
            "id": "res-db-primary",
            "cloud_account_id": aws_acc.id if aws_acc else None,
            "provider": "AWS",
            "provider_resource_id": "rds-pg-prod-master",
            "type": "DATABASE",
            "name": "production-db",
            "region": "ap-south-1",
            "status": "RUNNING",
            "capacity": 1,
            "min_capacity": 1,
            "max_capacity": 2,
            "current_cpu": 52.0,
            "current_memory": 72.0,
            "current_latency": 14.0,
            "current_traffic": 18500.0,
            "current_monthly_cost": 9500.0
        },
        {
            "id": "res-s3-assets",
            "cloud_account_id": aws_acc.id if aws_acc else None,
            "provider": "AWS",
            "provider_resource_id": "s3-prod-cloudops-media",
            "type": "STORAGE",
            "name": "assets-bucket",
            "region": "ap-south-1",
            "status": "RUNNING",
            "capacity": 1,
            "min_capacity": 1,
            "max_capacity": 1,
            "current_cpu": 0.0,
            "current_memory": 0.0,
            "current_latency": 45.0,
            "current_traffic": 6200.0,
            "current_monthly_cost": 3200.0
        },
        {
            "id": "res-lb-external",
            "cloud_account_id": aws_acc.id if aws_acc else None,
            "provider": "AWS",
            "provider_resource_id": "alb-external-ap-south",
            "type": "LOAD_BALANCER",
            "name": "ingress-alb",
            "region": "ap-south-1",
            "status": "RUNNING",
            "capacity": 2,
            "min_capacity": 2,
            "max_capacity": 4,
            "current_cpu": 28.0,
            "current_memory": 35.0,
            "current_latency": 18.0,
            "current_traffic": 20400.0,
            "current_monthly_cost": 2800.0
        }
    ]
    for r in resources_data:
        existing = db.query(Resource).filter(Resource.id == r["id"]).first()
        if not existing:
            res_obj = Resource(**r)
            db.add(res_obj)
    db.commit()

    # 7. Seed Policy
    policy = db.query(Policy).first()
    if not policy:
        policy = Policy(
            name="Standard Production AutoScaling Policy",
            min_instances=2,
            max_instances=8,
            max_scale_delta=4,
            max_hourly_cost=500.0,
            allowed_regions="ap-south-1,ap-south-2",
            require_approval=True,
            automatic_scaling=False
        )
        db.add(policy)
        db.commit()

    # 8. Seed Budget
    budget = db.query(Budget).first()
    if not budget:
        budget = Budget(
            name="Production Monthly Cloud Budget",
            monthly_limit=30000.0,
            warning_threshold=0.8,
            hard_limit_threshold=1.0,
            currency="INR",
            current_spend=18000.0
        )
        db.add(budget)
        db.commit()

    # 9. Seed Audit Logs
    audit_count = db.query(AuditLog).count()
    if audit_count == 0:
        now = datetime.utcnow()
        logs = [
            AuditLog(user_name="System", action="ACCOUNT_CONNECTED", resource_name="AWS Production Primary", old_state=None, new_state="CONNECTED", result="SUCCESS", details="Auto-discovered 5 cloud resources", timestamp=now - timedelta(hours=24)),
            AuditLog(user_name="Admin", action="POLICY_UPDATE", resource_name="Standard Policy", old_state="max_instances=6", new_state="max_instances=8", result="SUCCESS", details="Updated scaling ceiling to 8", timestamp=now - timedelta(hours=12)),
            AuditLog(user_name="Admin", action="LOGIN", resource_name=None, old_state=None, new_state=None, result="SUCCESS", details="Authenticated via JWT session", timestamp=now - timedelta(hours=2))
        ]
        db.add_all(logs)
        db.commit()
