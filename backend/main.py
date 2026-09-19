from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScaleRequest(BaseModel):
    instance_type: str

def get_db_connection():
    conn = sqlite3.connect('cloudops.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/metrics")
def get_metrics():
    # Placeholder for simulated CloudWatch metrics
    return {"cpu": 45, "memory": 60, "latency": 120, "status": "healthy"}

@app.get("/cost")
def get_cost():
    conn = get_db_connection()
    pricing = conn.execute('SELECT * FROM pricing').fetchall()
    policy = conn.execute('SELECT budget_limit FROM policies WHERE id = 1').fetchone()
    conn.close()
    
    return {
        "pricing": [dict(row) for row in pricing],
        "budget_limit": policy['budget_limit']
    }

@app.post("/scale")
def scale_resource(request: ScaleRequest):
    conn = get_db_connection()
    pricing = conn.execute('SELECT hourly_cost FROM pricing WHERE instance_type = ?', (request.instance_type,)).fetchone()
    policy = conn.execute('SELECT budget_limit FROM policies WHERE id = 1').fetchone()
    conn.close()
    
    if not pricing:
        raise HTTPException(status_code=404, detail="Instance type not found")
        
    estimated_monthly_cost = pricing['hourly_cost'] * 730  # Approx hours in a month
    
    if estimated_monthly_cost > policy['budget_limit']:
        raise HTTPException(status_code=403, detail="Scaling action exceeds budget limit.")
        
    return {"status": "success", "message": f"Successfully scaled to {request.instance_type}"}