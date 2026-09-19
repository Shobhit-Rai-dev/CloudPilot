import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.seed import seed_database
from backend.app.models.schema import User, Recommendation, AuditLog, Resource

# Ensure test DB is initialized and seeded
Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_database(db)
db.close()

client = TestClient(app)

def test_login_and_roles():
    # Test Admin login
    admin_resp = client.post("/api/auth/login", json={"email": "admin@cloudops.io", "password": "admin123"})
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert admin_data["user"]["role"] == "ADMIN"
    assert "access_token" in admin_data

    # Test Viewer login
    viewer_resp = client.post("/api/auth/login", json={"email": "viewer@cloudops.io", "password": "viewer123"})
    assert viewer_resp.status_code == 200
    viewer_data = viewer_resp.json()
    assert viewer_data["user"]["role"] == "VIEWER"

def test_viewer_permission_denied_on_scaling_approval():
    # Login as viewer
    viewer_resp = client.post("/api/auth/login", json={"email": "viewer@cloudops.io", "password": "viewer123"})
    token = viewer_resp.json()["access_token"]

    # Attempt to approve a dummy recommendation
    resp = client.post(
        "/api/recommendations/rec-test-123/approve",
        headers={"Authorization": f"Bearer {token}"}
    )
    # Viewer must be 403 Forbidden because they lack scaling.execute
    assert resp.status_code == 403
    assert "Permission denied" in resp.json()["detail"]

def test_traffic_spike_and_end_to_end_approval():
    # 1. Trigger traffic spike
    spike_resp = client.post("/api/simulation/traffic-spike")
    assert spike_resp.status_code == 200
    spike_data = spike_resp.json()
    assert spike_data["spike"]["health"] == "DEGRADED"
    assert spike_data["recommendation"]["proposedCapacity"] == 4

    rec_id = spike_data["recommendation"]["id"]

    # 2. Login as admin
    admin_resp = client.post("/api/auth/login", json={"email": "admin@cloudops.io", "password": "admin123"})
    token = admin_resp.json()["access_token"]

    # 3. Approve recommendation
    approve_resp = client.post(
        f"/api/recommendations/{rec_id}/approve",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert approve_resp.status_code == 200
    exec_data = approve_resp.json()
    assert exec_data["status"] == "SUCCESS"
    assert exec_data["verifiedCapacity"] == 4

    # 4. Check that audit log recorded the event
    audit_resp = client.get("/api/audit-logs")
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert any(log["action"] == "SCALE_OUT" and log["result"] == "SUCCESS" for log in logs)

    # 5. Clean up reset
    reset_resp = client.post("/api/simulation/reset")
    assert reset_resp.status_code == 200
