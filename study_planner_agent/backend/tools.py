import datetime
from typing import Dict, Any
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


def store_data(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Simulates storing data in a database.
    Can be replaced with Firestore logic later.
    """
    print("\n📦 [STORE_DATA TOOL CALLED]")
    print("Timestamp:", datetime.datetime.now())
    print("Keys Stored:", list(data.keys()))

    return {
        "status": "success",
        "message": "Data stored successfully (prototype)"
    }

def validate_study_inputs(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates inputs for Study Planner Agent.
    """
    if "subjects" not in data or not data["subjects"]:
        return {"error": "Subjects list is missing or empty"}

    if data.get("daily_hours", 0) <= 0:
        return {"error": "Daily study hours must be greater than 0"}

    return {"status": "valid"}

def analyze_productivity(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes task completion rate.
    Used by Progress Analyzer Agent.
    """
    completed = data.get("completed_tasks", 0)
    total = data.get("total_tasks", 1)

    productivity_score = round(completed / total, 2)

    status = "low"
    if productivity_score >= 0.75:
        status = "excellent"
    elif productivity_score >= 0.5:
        status = "good"

    return {
        "productivity_score": productivity_score,
        "status": status,
        "insight": (
            "Student is highly consistent"
            if status == "excellent"
            else "Needs better focus and consistency"
        )
    }

def check_upcoming_deadlines(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Checks for upcoming deadlines within next 3 days.
    """
    today = datetime.date.today()
    alerts = []

    for task in data.get("tasks", []):
        due_date_str = task.get("due_date")
        if not due_date_str:
            continue

        due_date = datetime.datetime.strptime(due_date_str, "%Y-%m-%d").date()
        days_left = (due_date - today).days

        if days_left <= 3:
            alerts.append({
                "task": task.get("title"),
                "days_left": days_left
            })

    return {
        "alerts": alerts,
        "count": len(alerts)
    }

def suggest_focus_strategy(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Suggests focus techniques based on productivity status.
    Used by Behavior Coach Agent.
    """
    status = data.get("status", "low")

    if status == "excellent":
        strategy = "Maintain current routine with short revision sessions."
    elif status == "good":
        strategy = "Use Pomodoro (25-5) with one long break after 4 sessions."
    else:
        strategy = "Reduce workload, use Pomodoro (15-5), avoid distractions."

    return {
        "recommended_strategy": strategy
    }

def prepare_tutor_context(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepares context from notes or syllabus for Tutor Agent.
    """
    context = data.get("context", "")

    if not context:
        return {"context": "No additional study material provided."}

    return {
        "context": context[:3000]  # Trim to safe length
    }

def log_agent_action(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Logs agent actions (for debugging / audit).
    """
    print("\n🧠 [AGENT ACTION LOG]")
    print("Agent:", data.get("agent"))
    print("Action:", data.get("action"))
    print("Time:", datetime.datetime.now())

    return {"status": "logged"}

def create_calendar_event(data: dict):
    """
    Creates a Google Calendar event.
    """
    creds = Credentials(
        token=data["access_token"],
        refresh_token=data["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        scopes=["https://www.googleapis.com/auth/calendar"]
    )

    service = build("calendar", "v3", credentials=creds)

    event = {
        "summary": data["title"],
        "start": {"dateTime": data["start_time"]},
        "end": {"dateTime": data["end_time"]}
    }

    created_event = service.events().insert(
        calendarId="primary",
        body=event
    ).execute()

    return {
        "event_id": created_event["id"],
        "status": "created"
    }