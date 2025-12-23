import os
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from dotenv import load_dotenv

# Firebase
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# Google OAuth / Calendar
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

# Agents
from agent import orchestrator

# --------------------------------------------------
# ENV
# --------------------------------------------------
load_dotenv()

# --------------------------------------------------
# APP
# --------------------------------------------------
app = FastAPI(
    title="Agentic AI Productivity Backend",
    version="1.0.0"
)

BASE_URL = "http://localhost:8000"

# --------------------------------------------------
# FIREBASE AUTH (SECURE)
# --------------------------------------------------
cred = credentials.Certificate(
    os.getenv("FIREBASE_SERVICE_ACCOUNT")
)
firebase_admin.initialize_app(cred)

security = HTTPBearer()

def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        return firebase_auth.verify_id_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

# --------------------------------------------------
# GOOGLE CALENDAR OAUTH
# --------------------------------------------------
SCOPES = ["https://www.googleapis.com/auth/calendar"]

def get_oauth_flow():
    return Flow.from_client_secrets_file(
        "client_secret.json",
        scopes=SCOPES,
        redirect_uri=f"{BASE_URL}/auth/google/callback"
    )

# --------------------------------------------------
# SCHEMAS
# --------------------------------------------------
class Subject(BaseModel):
    name: str
    difficulty: Optional[str] = "Medium"
    exam_date: Optional[str] = None

class StudyPlanRequest(BaseModel):
    subjects: List[Subject]
    daily_hours: int

class NotesRequest(BaseModel):
    content: str

class DoubtRequest(BaseModel):
    question: str

class ProgressRequest(BaseModel):
    completed_tasks: int
    total_tasks: int
    tasks: Optional[List[Dict[str, Any]]] = []

# --------------------------------------------------
# ROUTES
# --------------------------------------------------
@app.get("/")
def health():
    return {"status": "running"}

@app.post("/study-plan")
def study_plan(req: StudyPlanRequest, user=Depends(verify_firebase_token)):
    return orchestrator.plan_study(req.dict())

@app.post("/upload-notes")
def upload_notes(req: NotesRequest, user=Depends(verify_firebase_token)):
    return orchestrator.upload_notes(req.dict())

@app.post("/ask-doubt")
def ask_doubt(req: DoubtRequest, user=Depends(verify_firebase_token)):
    return orchestrator.ask_doubt(req.dict())

@app.post("/analyze-progress")
def analyze(req: ProgressRequest, user=Depends(verify_firebase_token)):
    return orchestrator.analyze_progress(req.dict())

@app.get("/system-status")
def system_status(user=Depends(verify_firebase_token)):
    """Get status of autonomous agents and recent system events"""
    return orchestrator.get_system_status()

# --------------------------------------------------
# GOOGLE CALENDAR AUTH
# --------------------------------------------------
@app.get("/auth/google")
def google_auth(user=Depends(verify_firebase_token)):
    flow = get_oauth_flow()
    url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true"
    )
    return RedirectResponse(url)

@app.get("/auth/google/callback")
def google_callback(request: Request):
    flow = get_oauth_flow()
    flow.fetch_token(authorization_response=str(request.url))
    creds: Credentials = flow.credentials

    return {
        "status": "connected",
        "scopes": creds.scopes
    }
