import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")

class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(String(36), ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)

    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")

class CloudAccount(Base):
    __tablename__ = "cloud_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)  # AWS, MOCK, GCP, AZURE
    account_id = Column(String(100), nullable=False)
    region = Column(String(50), default="ap-south-1")
    status = Column(String(50), default="CONNECTED")  # CONNECTED, DISCONNECTED, COMING_SOON
    created_at = Column(DateTime, default=datetime.utcnow)

    resources = relationship("Resource", back_populates="cloud_account")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cloud_account_id = Column(String(36), ForeignKey("cloud_accounts.id"), nullable=True)
    provider = Column(String(50), default="AWS")
    provider_resource_id = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # COMPUTE, DATABASE, STORAGE, LOAD_BALANCER
    name = Column(String(100), nullable=False, index=True)
    region = Column(String(50), default="ap-south-1")
    status = Column(String(50), default="RUNNING")  # RUNNING, STOPPED, WARNING, DEGRADED
    capacity = Column(Integer, default=1)
    min_capacity = Column(Integer, default=2)
    max_capacity = Column(Integer, default=8)
    current_cpu = Column(Float, default=45.0)
    current_memory = Column(Float, default=60.0)
    current_latency = Column(Float, default=180.0)
    current_traffic = Column(Float, default=8000.0)
    current_monthly_cost = Column(Float, default=18000.0)
    metadata_info = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cloud_account = relationship("CloudAccount", back_populates="resources")
    metrics = relationship("MetricRecord", back_populates="resource", cascade="all, delete-orphan")
    health_records = relationship("HealthRecord", back_populates="resource", cascade="all, delete-orphan")
    cost_records = relationship("CostRecord", back_populates="resource", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="resource", cascade="all, delete-orphan")

class MetricRecord(Base):
    __tablename__ = "metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_type = Column(String(50), nullable=False, index=True)  # CPU_UTILIZATION, LATENCY, REQUEST_COUNT, etc.
    value = Column(Float, nullable=False)
    unit = Column(String(20), default="%")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    resource = relationship("Resource", back_populates="metrics")

class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)  # HEALTHY, WARNING, DEGRADED, CRITICAL
    score = Column(Integer, default=100)
    reasons = Column(JSON, default=list)  # list of strings
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    resource = relationship("Resource", back_populates="health_records")

class CostRecord(Base):
    __tablename__ = "cost_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=True, index=True)
    provider = Column(String(50), default="AWS")
    service = Column(String(50), nullable=False)  # EC2, RDS, S3, ELB
    region = Column(String(50), default="ap-south-1")
    usage_quantity = Column(Float, default=1.0)
    usage_unit = Column(String(50), default="hours")
    cost = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    resource = relationship("Resource", back_populates="cost_records")

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    resource_id = Column(String(36), ForeignKey("resources.id"), nullable=True)
    min_instances = Column(Integer, default=2)
    max_instances = Column(Integer, default=8)
    max_scale_delta = Column(Integer, default=4)
    max_hourly_cost = Column(Float, default=500.0)
    allowed_regions = Column(String(255), default="ap-south-1")
    require_approval = Column(Boolean, default=True)
    automatic_scaling = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), default="Production Monthly Budget")
    monthly_limit = Column(Float, default=30000.0)
    warning_threshold = Column(Float, default=0.8)  # 80%
    hard_limit_threshold = Column(Float, default=1.0)  # 100%
    currency = Column(String(10), default="INR")
    current_spend = Column(Float, default=18000.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    type = Column(String(50), nullable=False)  # SCALE_OUT, SCALE_IN
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_name = Column(String(100), nullable=False)
    current_capacity = Column(Integer, nullable=False)
    proposed_capacity = Column(Integer, nullable=False)
    reasons = Column(JSON, default=list)  # list of strings
    current_monthly_cost = Column(Float, default=18000.0)
    proposed_monthly_cost = Column(Float, default=25200.0)
    difference_cost = Column(Float, default=7200.0)
    check_policy = Column(String(20), default="PASS")
    check_budget = Column(String(20), default="PASS")
    check_permission = Column(String(20), default="PASS")
    check_safety = Column(String(20), default="PASS")
    requires_approval = Column(Boolean, default=True)
    status = Column(String(30), default="PENDING")  # PENDING, APPROVED, REJECTED, EXECUTING, SUCCESS, FAILED, BLOCKED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    resource = relationship("Resource", back_populates="recommendations")

class ActionExecution(Base):
    __tablename__ = "action_executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recommendation_id = Column(String(36), ForeignKey("recommendations.id"), nullable=True)
    resource_id = Column(String(36), ForeignKey("resources.id"), nullable=False)
    user_name = Column(String(100), default="Admin")
    action_type = Column(String(50), nullable=False)  # SCALE_OUT, SCALE_IN
    old_capacity = Column(Integer, nullable=False)
    new_capacity = Column(Integer, nullable=False)
    status = Column(String(30), default="SUCCESS")  # EXECUTING, SUCCESS, FAILED
    verified_capacity = Column(Integer, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_name = Column(String(100), nullable=False, default="System")
    action = Column(String(100), nullable=False, index=True)  # SCALE_OUT, LOGIN, POLICY_CHANGE, etc.
    resource_name = Column(String(100), nullable=True)
    old_state = Column(String(255), nullable=True)
    new_state = Column(String(255), nullable=True)
    result = Column(String(50), default="SUCCESS")  # SUCCESS, FAILED, BLOCKED
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
