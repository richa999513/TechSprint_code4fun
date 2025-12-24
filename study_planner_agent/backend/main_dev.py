"""
Development version of main.py without Firebase dependencies
Use this for testing the agentic AI system
"""
import os
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

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
    title="Agentic AI Productivity Backend (Dev Mode)",
    version="1.0.0-dev"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (frontend)
app.mount("/static", StaticFiles(directory="../frontend"), name="static")

BASE_URL = "http://localhost:8000"

# Mock authentication for development
def mock_auth():
    """Mock authentication - returns a fake user for development"""
    return {"uid": "dev_user", "email": "dev@example.com"}

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

class CalendarRequest(BaseModel):
    study_plan_data: Dict[str, Any]

class NotesUploadRequest(BaseModel):
    content: str
    title: Optional[str] = "Uploaded Notes"
    subject: Optional[str] = "General"

class QuestionGenerationRequest(BaseModel):
    content: str
    type: Optional[str] = "mixed"  # mixed, mcq, short_answer, essay
    num_questions: Optional[int] = 5

# --------------------------------------------------
# ROUTES
# --------------------------------------------------
@app.get("/")
def health():
    try:
        agent_count = len(orchestrator.get_system_status()["agents"])
    except Exception as e:
        print(f"Error getting system status: {e}")
        agent_count = 0
        
    return {
        "status": "running",
        "mode": "development",
        "agentic_system": "active",
        "autonomous_agents": agent_count,
        "message": "Agentic AI Study Planner Backend is running!",
        "frontend_url": "http://localhost:8000/static/index.html"
    }

@app.post("/study-plan")
def study_plan(req: StudyPlanRequest):
    """Create a study plan with autonomous agent monitoring and calendar integration"""
    try:
        user = mock_auth()  # Mock auth for dev
        result = orchestrator.plan_study(req.dict())
        
        return {
            "success": True,
            "user": user["uid"],
            "plan": result.get("study_plan"),
            "calendar_events": result.get("calendar_integration"),
            "formatted_schedule": result.get("formatted_schedule"),
            "autonomous_monitoring": "enabled",
            "message": "Study plan created with calendar integration! Autonomous agents are monitoring your progress."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Study plan creation failed: {str(e)}")

@app.post("/ask-doubt")
def ask_doubt(req: DoubtRequest):
    """Ask a question to the tutor agent - returns natural language response only"""
    try:
        user = mock_auth()
        result = orchestrator.ask_doubt(req.dict())
        
        return {
            "success": True,
            "user": user["uid"],
            "answer": result.get("answer", ""),
            "format": result.get("format", "natural_language"),
            "message": "Question answered by tutor agent in natural language!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question processing failed: {str(e)}")

@app.post("/analyze-progress")
def analyze(req: ProgressRequest):
    """Analyze progress (autonomous analysis runs continuously)"""
    try:
        user = mock_auth()
        result = orchestrator.analyze_progress(req.dict())
        
        return {
            "success": True,
            "user": user["uid"],
            "analysis": result,
            "message": "Progress analyzed! Check system-status for autonomous insights."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress analysis failed: {str(e)}")

@app.post("/upload-notes")
def upload_notes(req: NotesUploadRequest):
    """Upload notes with enhanced RAG processing and autonomous processing"""
    try:
        user = mock_auth()
        
        # Process notes with enhanced tools
        from enhanced_tools import process_uploaded_notes
        
        result = process_uploaded_notes(req.dict())
        
        # Also use the orchestrator for additional processing
        orchestrator_result = orchestrator.upload_notes(req.dict())
        
        return {
            "success": True,
            "user": user["uid"],
            "processing_result": result,
            "orchestrator_result": orchestrator_result,
            "message": "Notes uploaded and processed successfully! You can now ask questions about this content."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notes upload failed: {str(e)}")

@app.post("/generate-questions")
def generate_questions(req: QuestionGenerationRequest):
    """Generate study questions from notes content"""
    try:
        from enhanced_tools import generate_questions_from_notes
        
        user = mock_auth()
        result = generate_questions_from_notes(req.dict())
        
        return {
            "success": True,
            "user": user["uid"],
            "questions": result.get("questions", []),
            "total_generated": result.get("total_generated", 0),
            "type": result.get("type", "mixed"),
            "message": f"Generated {result.get('total_generated', 0)} questions successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@app.post("/generate-mcqs")
def generate_mcqs(req: QuestionGenerationRequest):
    """Generate MCQs specifically from notes content"""
    try:
        from enhanced_tools import generate_mcqs_from_notes
        
        user = mock_auth()
        result = generate_mcqs_from_notes(req.dict())
        
        return {
            "success": True,
            "user": user["uid"],
            "questions": result.get("questions", []),
            "total_generated": result.get("total_generated", 0),
            "type": "mcq",
            "message": f"Generated {result.get('total_generated', 0)} MCQs successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")

@app.post("/create-calendar-events")
def create_calendar_events(req: CalendarRequest):
    """Manually create calendar events from study plan"""
    try:
        from enhanced_tools import create_calendar_events_from_study_plan, format_study_plan_as_table
        
        user = mock_auth()
        
        # Create calendar events
        calendar_result = create_calendar_events_from_study_plan(req.study_plan_data)
        
        # Format as table
        formatted_schedule = format_study_plan_as_table(req.study_plan_data)
        
        return {
            "success": True,
            "user": user["uid"],
            "calendar_events": calendar_result,
            "formatted_schedule": formatted_schedule,
            "message": "Calendar events created successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calendar event creation failed: {str(e)}")

@app.get("/system-status")
def system_status():
    """Get status of autonomous agents and recent system events"""
    try:
        status = orchestrator.get_system_status()
        
        return {
            "success": True,
            "autonomous_agents": status["agents"],
            "recent_events": status["recent_events"],
            "shared_context": status["shared_context_keys"],
            "system_health": "operational",
            "agentic_features": [
                "Autonomous decision making",
                "Inter-agent communication", 
                "Event-driven architecture",
                "Persistent state management",
                "Self-evaluation and adaptation"
            ]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "autonomous_agents": {},
            "recent_events": [],
            "shared_context": [],
            "system_health": "error"
        }

@app.get("/demo")
def demo_agentic_behavior():
    """Demonstrate autonomous agent behavior"""
    try:
        from blackboard import blackboard
        
        # Simulate low productivity to trigger autonomous behavior
        blackboard.post_event("low_productivity_detected", {
            "average_progress": 0.2,
            "recommendation": "intervention_needed"
        }, "demo")
        
        # Simulate approaching deadline
        blackboard.post_event("deadline_approaching", {
            "task": "Math Assignment",
            "days_left": 1
        }, "demo")
        
        return {
            "success": True,
            "message": "Autonomous behavior triggered!",
            "events_posted": 2,
            "expected_agent_responses": [
                "Behavior Coach should provide motivation strategies",
                "Task Scheduler should suggest rescheduling",
                "Progress Analyzer should increase monitoring frequency"
            ],
            "check_system_status": "/system-status"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo trigger failed: {str(e)}")

# Serve the frontend at root
@app.get("/app")
def serve_frontend():
    """Redirect to the frontend application"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/static/index.html")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Agentic AI Development Server...")
    print("🧠 Autonomous agents are active and monitoring!")
    print("📊 Visit http://localhost:8000/system-status to see agent activity")
    print("🎮 Visit http://localhost:8000/demo to trigger autonomous behavior")
    print("🌐 Visit http://localhost:8000/static/index.html for the web app")
    uvicorn.run(app, host="127.0.0.1", port=8000)