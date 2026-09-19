# CloudOps — Unified Cloud Resource, Scaling & Cost Management Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2016%20%7C%20React%2019%20%7C%20Tailwind-blue)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.13-emerald)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%2F%20SQLite%20fallback-orange)]()
[![AWS Provider](https://img.shields.io/badge/cloud-AWS%20Boto3%20%26%20Mock-purple)]()

CloudOps is a unified cloud control-plane platform that eliminates the need to navigate complex AWS, GCP, and Azure management consoles. It provides an intelligent, policy-governed automation loop for infrastructure monitoring, performance telemetry, resource management, service health, capacity scaling, cost governance, approval workflows, and immutable audit logs.

---

## 1. The Core Operational Workflow

```
OBSERVE ➔ ANALYZE ➔ RECOMMEND ➔ CHECK (Policy / Budget / Permission / Safety) ➔ APPROVE ➔ EXECUTE ➔ VERIFY ➔ AUDIT
```

1. **Observe**: Ingests real-time telemetry (CPU, memory, latency, requests, error rate) via normalized metrics pipelines.
2. **Analyze**: Evaluates multi-signal health and detects traffic & utilization anomalies.
3. **Recommend**: Computes capacity sizing recommendations with explainable formulas.
4. **Gatekeeper Checks**:
   - **Policy Engine**: Validates region whitelist, capacity ceilings, and approval rules.
   - **Budget Engine**: Enforces monthly budget limits (e.g. ₹30,000) and warning thresholds (80%).
   - **Permission Check**: Enforces server-side RBAC (`scaling.execute`).
   - **Safety Engine**: Validates scale jump delta limits (max 4 instances) and absolute ceilings.
5. **Approve**: Human-in-the-loop review via the **Review Infrastructure Change** modal.
6. **Execute**: Decoupled Action Execution Engine triggers provider mutation via `CloudProvider.scale_resource()`.
7. **Verify**: Queries cloud provider to verify actual post-execution capacity matches requested capacity before marking `SUCCESS`.
8. **Audit**: Persists immutable audit record (`User`, `Action`, `Resource`, `Old State`, `New State`, `Result`).

---

## 2. Primary Hackathon Demonstration Scenario

CloudOps includes an interactive simulation toolbar that enables zero-friction, repeatable evaluation:

1. **Initial Baseline**:
   - Resource: `production-api` (AWS Auto Scaling Group)
   - Instances: 2
   - CPU: 45%
   - Traffic: 8,000 req/min
   - P95 latency: 180ms
   - Monthly cost: ₹18,000 / Monthly budget: ₹30,000
   - Health: `HEALTHY` (Score: 96/100)
2. **Inject Traffic Spike**:
   - Click the top navbar button: **[Simulate Traffic Spike]**.
   - Traffic jumps by +55% (12,400 req/min).
   - CPU surges to 86.4%.
   - P95 latency increases to 520ms.
   - Service health shifts to `DEGRADED`.
3. **Automated Recommendation Generated**:
   - Scaling Engine recommends: `SCALE_OUT 2 -> 4 instances`.
   - Explainable reasons: High CPU (86.4%), High latency (520ms), Traffic surge (+55%).
   - Cost impact: Current ₹18,000 -> Proposed ₹25,200 (+₹7,200/mo).
   - Checks: Policy: PASS, Budget: PASS (₹25,200 <= ₹30,000), Permission: PASS, Safety: PASS.
4. **Review & Approve**:
   - Click **[Review & Approve]** to open the **Approval Modal**.
   - Review impact summary and click **[Confirm & Execute]**.
5. **Execution & Verification**:
   - Provider scales to 4 instances.
   - CloudOps verifies actual capacity is 4 instances.
   - Metrics normalize: CPU drops to 43.2%, P95 latency drops to 190ms, health returns to `HEALTHY`.
   - Immutable log recorded under **Audit Trail**.

---

## 3. Architecture

```
                                  USER BROWSER
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             │                                                     │
             ▼ REST API                                            ▼ WebSockets (/api/ws)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                       FastAPI Backend Application                       │
   ├─────────────────────────────────────────────────────────────────────────┤
   │  [Auth & RBAC]        [Monitoring Engine]         [Health Engine]       │
   │  JWT + Permissions    Metrics normalization &     Multi-signal analysis │
   │  Admin/Dev/Viewer     timeseries ingestion        with explicit reasons │
   ├─────────────────────────────────────────────────────────────────────────┤
   │  [Anomaly Detection]  [Capacity & Scaling]        [Cost & Budget]       │
   │  Thresholds & drifts  Explainable sizing formulas Spend, forecast &     │
   │                       bounded by safety limits    projected impact      │
   ├─────────────────────────────────────────────────────────────────────────┤
   │  [Policy Engine]      [Safety Engine]             [Recommendation]      │
   │  Region, capacity,    Max scale deltas, max       Explainable proposals │
   │  approval rules       hourly cost guards          with gatekeeper checks│
   ├─────────────────────────────────────────────────────────────────────────┤
   │  [Approval & Action Execution Layer]              [Audit Logger]        │
   │  Decoupled mutation engine + state verification   Immutable event log   │
   ├─────────────────────────────────────────────────────────────────────────┤
   │  [Cloud Provider Abstraction Layer: CloudProvider Interface]            │
   │       ┌───────────────────────┴───────────────────────┐                 │
   │       ▼                                               ▼                 │
   │  MockCloudProvider (Interactive Simulation)     AWSProvider (Boto3)     │
   │  (production-api, database, LB, storage)        (EC2, ASG, CW, S3, EBS) │
   └───────────────────────────────────┬─────────────────────────────────────┘
                                       │
                                       ▼
                       SQLAlchemy ORM Data Store
                 (PostgreSQL compatible / SQLite fallback)
```

---

## 4. Role-Based Access Control (RBAC)

Pre-seeded evaluation credentials:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cloudops.io` | `admin123` | Full access (can approve scaling actions, edit policies and budgets) |
| **DevOps** | `developer@cloudops.io` | `dev123` | Operational visibility, can trigger simulations & generate recommendations |
| **Viewer** | `viewer@cloudops.io` | `viewer123` | Read-only; scaling approval is **strictly disabled** server-side with 403 Forbidden |

> **Quick Switcher**: You can switch roles instantaneously in the top navigation bar during the demo to demonstrate server-side permission enforcement.

---

## 5. Quickstart & Local Setup

### Prerequisites
- Python 3.10+ (Python 3.13 supported)
- Node.js 18+ / npm

### Step 1: Backend Setup
```powershell
# In repository root
python -m pip install -r backend/requirements.txt

# Run backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend automatically initializes tables and seeds demo resources upon startup!
- Interactive API Swagger Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/`

### Step 2: Frontend Setup
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Open your browser at `http://localhost:3000`.

---

## 6. Provider Modes: Mock vs Real AWS

CloudOps provides a strict provider abstraction layer (`CloudProvider`). To switch between modes:

### MOCK Mode (Default)
Requires no AWS account or credentials.
In `.env`:
```ini
CLOUD_PROVIDER=mock
```

### AWS Mode
Uses official AWS Boto3 APIs for EC2, Auto Scaling Groups, CloudWatch, and S3.
In `.env`:
```ini
CLOUD_PROVIDER=aws
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```
If AWS credentials are missing or invalid, CloudOps gracefully falls back to mock mode with clear notification.

---

## 7. Automated Tests

Execute the comprehensive test suite covering scaling formulas, policy guardrails, budget limits, RBAC permissions, and action state verification:

```powershell
python -m pytest backend/tests -v
```
All 12 automated unit and integration tests validate the complete end-to-end operational loop.
