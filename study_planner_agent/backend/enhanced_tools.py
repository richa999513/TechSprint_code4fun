import datetime
import json
import base64
import io
from typing import Dict, Any, List
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import os

# Add PDF processing imports
try:
    import pypdf
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("Warning: pypdf not installed. PDF processing will be limited.")


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
    Enhanced productivity analysis with detailed insights and recommendations.
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
        ),
        "recommendations": generate_productivity_recommendations(productivity_score, status),
        "completion_percentage": productivity_score * 100,
        "tasks_remaining": total - completed
    }

def generate_productivity_recommendations(score: float, status: str) -> List[str]:
    """Generate personalized productivity recommendations"""
    recommendations = []
    
    if status == "excellent":
        recommendations.extend([
            "Maintain your excellent study routine",
            "Consider helping peers or exploring advanced topics",
            "Set new challenging goals to continue growth"
        ])
    elif status == "good":
        recommendations.extend([
            "Use Pomodoro technique (25-5) for better focus",
            "Review and optimize your study schedule",
            "Take regular breaks to maintain productivity"
        ])
    else:
        recommendations.extend([
            "Break large tasks into smaller, manageable chunks",
            "Use shorter study sessions (15-20 minutes) initially",
            "Eliminate distractions during study time",
            "Consider changing study environment or time"
        ])
    
    return recommendations

def check_upcoming_deadlines(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhanced deadline checking with better date parsing and urgency levels.
    """
    today = datetime.date.today()
    alerts = []

    for task in data.get("tasks", []):
        due_date_str = task.get("due_date")
        if not due_date_str:
            continue

        try:
            # Try different date formats
            try:
                due_date = datetime.datetime.strptime(due_date_str, "%Y-%m-%d").date()
            except ValueError:
                try:
                    due_date = datetime.datetime.strptime(due_date_str, "%m/%d/%Y").date()
                except ValueError:
                    try:
                        due_date = datetime.datetime.strptime(due_date_str, "%d-%m-%Y").date()
                    except ValueError:
                        print(f"Warning: Could not parse date format: {due_date_str}")
                        continue
            
            days_left = (due_date - today).days

            if days_left <= 3:
                urgency = "critical" if days_left <= 1 else "urgent" if days_left <= 2 else "upcoming"
                alerts.append({
                    "task": task.get("title", "Unnamed task"),
                    "days_left": days_left,
                    "due_date": due_date.strftime("%Y-%m-%d"),
                    "urgency": urgency
                })
        except Exception as e:
            print(f"Error processing task deadline: {e}")
            continue

    return {
        "alerts": alerts,
        "count": len(alerts),
        "summary": f"Found {len(alerts)} upcoming deadlines"
    }

def suggest_focus_strategy(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhanced focus strategy suggestions with detailed techniques and schedules.
    """
    status = data.get("status", "low")
    productivity_score = data.get("productivity_score", 0.0)
    
    strategies = {
        "excellent": {
            "primary": "Maintain current routine with short revision sessions",
            "techniques": ["Active recall", "Spaced repetition", "Teaching others"],
            "schedule": "Continue current schedule with optional advanced topics"
        },
        "good": {
            "primary": "Use Pomodoro (25-5) with one long break after 4 sessions",
            "techniques": ["Time blocking", "Priority matrix", "Regular reviews"],
            "schedule": "Optimize current schedule with better time management"
        },
        "low": {
            "primary": "Start with shorter sessions (15-20 min) and gradually increase",
            "techniques": ["Eliminate distractions", "Change environment", "Reward system"],
            "schedule": "Restructure schedule with more breaks and easier tasks first"
        }
    }
    
    strategy = strategies.get(status, strategies["low"])
    
    return {
        "recommended_strategy": strategy["primary"],
        "techniques": strategy["techniques"],
        "schedule_advice": strategy["schedule"],
        "productivity_score": productivity_score,
        "status": status
    }

def prepare_tutor_context(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhanced context preparation for Tutor Agent with RAG integration.
    """
    context = data.get("context", "")
    question = data.get("question", "")
    
    if not context and not question:
        return {"context": "No additional study material or question provided."}
    
    # Prepare context with question for better RAG retrieval
    enhanced_context = f"Question: {question}\n\nContext: {context}" if question else context
    
    return {
        "context": enhanced_context[:3000],  # Trim to safe length
        "question": question,
        "has_context": bool(context),
        "context_length": len(context)
    }

def log_agent_action(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Enhanced logging for agent actions with more details.
    """
    print("\n🧠 [AGENT ACTION LOG]")
    print("Agent:", data.get("agent"))
    print("Action:", data.get("action"))
    print("Time:", datetime.datetime.now())
    print("Payload keys:", list(data.keys()))
    
    return {
        "status": "logged",
        "timestamp": datetime.datetime.now().isoformat(),
        "agent": data.get("agent", "unknown")
    }

def create_calendar_events_from_study_plan(study_plan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enhanced Google Calendar integration - creates events from study plan.
    Handles both simple and complex JSON structures.
    """
    try:
        # Parse study plan data
        if isinstance(study_plan_data, str):
            plan_data = json.loads(study_plan_data)
        else:
            plan_data = study_plan_data
        
        # Extract tasks from different possible structures
        tasks = []
        
        if "daily_study_plan" in plan_data:
            # Handle complex structure
            tasks = plan_data["daily_study_plan"]
        elif "daily_tasks" in plan_data:
            tasks = plan_data["daily_tasks"]
        elif "tasks" in plan_data:
            tasks = plan_data["tasks"]
        else:
            return {"status": "error", "message": "No tasks found in study plan"}
        
        # For demo mode, simulate calendar creation
        created_events = []
        for task in tasks:
            # Handle different task structures
            if "task_name" in task:
                # Complex structure
                event_data = {
                    "id": task.get("task_id", len(created_events) + 1),
                    "title": task.get("task_name", "Study Session"),
                    "description": task.get("description", ""),
                    "start_time": format_task_datetime(task.get("start_time", ""), task.get("day_of_week", "")),
                    "end_time": format_task_datetime(task.get("end_time", ""), task.get("day_of_week", "")),
                    "duration": task.get("estimated_duration_minutes", 60),
                    "priority": task.get("priority", "Medium"),
                    "category": task.get("category", "Study"),
                    "day": task.get("day_of_week", "Unscheduled")
                }
            else:
                # Simple structure
                event_data = {
                    "id": task.get("id", len(created_events) + 1),
                    "title": task.get("name", "Study Session"),
                    "description": task.get("description", ""),
                    "start_time": parse_task_time(task.get("deadline", "")),
                    "duration": task.get("estimated_duration_minutes", 60),
                    "priority": task.get("priority", "Medium"),
                    "category": task.get("category", "Study")
                }
            
            created_events.append(event_data)
        
        return {
            "status": "success",
            "message": f"Created {len(created_events)} calendar events",
            "events_created": len(created_events),
            "events": created_events[:5],  # Return first 5 for preview
            "calendar_integration": "simulated"  # In demo mode
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to create calendar events: {str(e)}"
        }

def format_task_datetime(time_str: str, day_str: str) -> str:
    """
    Format task time and day into ISO datetime string.
    """
    if not time_str or not day_str:
        return datetime.datetime.now().isoformat()
    
    try:
        # Map day names to numbers (assuming current week)
        day_mapping = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        
        # Get current date and find the target day
        today = datetime.datetime.now()
        current_weekday = today.weekday()
        target_weekday = day_mapping.get(day_str, 0)
        
        # Calculate days to add
        days_ahead = target_weekday - current_weekday
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        
        target_date = today + datetime.timedelta(days=days_ahead)
        
        # Parse time (assuming format like "09:00 AM")
        try:
            time_obj = datetime.datetime.strptime(time_str, "%I:%M %p").time()
        except ValueError:
            try:
                time_obj = datetime.datetime.strptime(time_str, "%H:%M").time()
            except ValueError:
                time_obj = datetime.time(9, 0)  # Default to 9:00 AM
        
        # Combine date and time
        result_datetime = datetime.datetime.combine(target_date.date(), time_obj)
        return result_datetime.isoformat()
        
    except Exception:
        return datetime.datetime.now().isoformat()

def parse_task_time(deadline_str: str) -> str:
    """
    Parse task deadline string into ISO format datetime.
    """
    if not deadline_str:
        return datetime.datetime.now().isoformat()
    
    try:
        # Handle formats like "Monday 09:00 AM - 10:30 AM"
        if " - " in deadline_str:
            start_part = deadline_str.split(" - ")[0]
            # For demo, create a datetime for next occurrence of the day
            today = datetime.datetime.now()
            # Simple parsing - in production, use more sophisticated date parsing
            return (today + datetime.timedelta(days=1)).replace(hour=9, minute=0).isoformat()
        else:
            return datetime.datetime.now().isoformat()
    except:
        return datetime.datetime.now().isoformat()

def create_calendar_event(data: dict) -> Dict[str, Any]:
    """
    Creates a single Google Calendar event.
    Enhanced with better error handling and demo mode support.
    """
    try:
        # In demo mode, simulate event creation
        if not data.get("access_token"):
            return {
                "event_id": f"demo_event_{datetime.datetime.now().timestamp()}",
                "status": "created",
                "title": data.get("title", "Study Session"),
                "start_time": data.get("start_time"),
                "end_time": data.get("end_time"),
                "mode": "demo"
            }
        
        # Real Google Calendar integration
        creds = Credentials(
            token=data["access_token"],
            refresh_token=data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=data.get("client_id"),
            client_secret=data.get("client_secret"),
            scopes=["https://www.googleapis.com/auth/calendar"]
        )

        service = build("calendar", "v3", credentials=creds)

        event = {
            "summary": data.get("title", "Study Session"),
            "description": data.get("description", ""),
            "start": {"dateTime": data["start_time"]},
            "end": {"dateTime": data["end_time"]},
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 15},
                    {"method": "email", "minutes": 60}
                ]
            }
        }

        created_event = service.events().insert(
            calendarId="primary",
            body=event
        ).execute()

        return {
            "event_id": created_event["id"],
            "status": "created",
            "title": event["summary"],
            "start_time": event["start"]["dateTime"],
            "end_time": event["end"]["dateTime"],
            "mode": "real"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to create calendar event: {str(e)}"
        }

def format_study_plan_as_table(study_plan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats study plan data as a structured table for better display.
    Handles both simple and complex JSON structures.
    """
    try:
        if isinstance(study_plan_data, str):
            plan_data = json.loads(study_plan_data)
        else:
            plan_data = study_plan_data
        
        # Handle complex JSON structure with daily_study_plan
        if "daily_study_plan" in plan_data:
            tasks = plan_data["daily_study_plan"]
            
            # Group tasks by day
            schedule_table = {}
            for task in tasks:
                day = task.get("day_of_week", "Unscheduled")
                
                if day not in schedule_table:
                    schedule_table[day] = []
                
                # Format time slot
                time_slot = "Not scheduled"
                if task.get("start_time") and task.get("end_time"):
                    time_slot = f"{task['start_time']} - {task['end_time']}"
                
                # Format duration
                duration = "Not specified"
                if task.get("estimated_duration_minutes"):
                    hours = task["estimated_duration_minutes"] // 60
                    minutes = task["estimated_duration_minutes"] % 60
                    if hours > 0:
                        duration = f"{hours}h {minutes}m" if minutes > 0 else f"{hours}h"
                    else:
                        duration = f"{minutes}m"
                
                schedule_table[day].append({
                    "time": time_slot,
                    "task": task.get("task_name", "Unnamed Task"),
                    "description": task.get("description", ""),
                    "priority": task.get("priority", "Medium"),
                    "duration": duration,
                    "category": task.get("category", "Study")
                })
            
            return {
                "status": "success",
                "schedule_table": schedule_table,
                "total_tasks": len(tasks),
                "days_covered": len(schedule_table),
                "formatted": True,
                "has_reminders": "general_reminders" in plan_data,
                "reminders": plan_data.get("general_reminders", [])
            }
        
        # Handle simple structure with daily_tasks
        elif "daily_tasks" in plan_data:
            tasks = plan_data["daily_tasks"]
        elif "tasks" in plan_data:
            tasks = plan_data["tasks"]
        else:
            return {
                "status": "error",
                "message": "No recognizable task structure found in study plan"
            }
        
        # Group tasks by day (for simple structure)
        schedule_table = {}
        for task in tasks:
            deadline = task.get("deadline", "Unscheduled")
            day = deadline.split()[0] if deadline != "Unscheduled" else "Unscheduled"
            
            if day not in schedule_table:
                schedule_table[day] = []
            
            schedule_table[day].append({
                "time": deadline,
                "task": task.get("name", "Unnamed Task"),
                "description": task.get("description", ""),
                "priority": task.get("priority", "Medium"),
                "duration": f"{task.get('estimated_duration_minutes', 60)} min",
                "category": task.get("category", "Study")
            })
        
        return {
            "status": "success",
            "schedule_table": schedule_table,
            "total_tasks": len(tasks),
            "days_covered": len(schedule_table),
            "formatted": True
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to format study plan: {str(e)}"
        }

def process_uploaded_notes(notes_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process uploaded notes and add them to RAG system for enhanced tutoring.
    Supports text content, TXT files, and PDF files.
    """
    try:
        content = notes_data.get("content", "")
        title = notes_data.get("title", "Uploaded Notes")
        subject = notes_data.get("subject", "General")
        upload_method = notes_data.get("upload_method", "text")
        file_type = notes_data.get("file_type", "text/plain")
        file_name = notes_data.get("file_name", None)
        
        # Process content based on file type
        processed_content = ""
        
        if upload_method == "file" and file_type == "application/pdf":
            # Handle PDF files
            if PDF_SUPPORT:
                try:
                    # Decode base64 content
                    pdf_data = base64.b64decode(content)
                    pdf_file = io.BytesIO(pdf_data)
                    
                    # Extract text from PDF using pypdf
                    pdf_reader = pypdf.PdfReader(pdf_file)
                    text_content = ""
                    
                    for page_num in range(len(pdf_reader.pages)):
                        page = pdf_reader.pages[page_num]
                        text_content += page.extract_text() + "\n"
                    
                    processed_content = text_content.strip()
                    
                    if not processed_content:
                        return {
                            "status": "error",
                            "message": "Could not extract text from PDF. The PDF might be image-based or corrupted."
                        }
                        
                except Exception as e:
                    return {
                        "status": "error",
                        "message": f"Failed to process PDF file: {str(e)}"
                    }
            else:
                return {
                    "status": "error",
                    "message": "PDF processing not available. Please install pypdf library."
                }
        else:
            # Handle text content (direct input or TXT files)
            processed_content = content
        
        if not processed_content.strip():
            return {"status": "error", "message": "No content provided or extracted"}
        
        # Add to RAG system
        from rag.rag_tools import add_to_rag
        
        rag_result = add_to_rag({
            "content": processed_content,
            "title": title,
            "subject": subject,
            "type": "notes",
            "upload_method": upload_method,
            "file_type": file_type,
            "file_name": file_name,
            "timestamp": datetime.datetime.now().isoformat()
        })
        
        # Analyze content for key topics
        key_topics = extract_key_topics(processed_content)
        
        return {
            "status": "success",
            "message": f"Notes '{title}' processed and added to knowledge base",
            "rag_result": rag_result,
            "key_topics": key_topics,
            "content_length": len(processed_content),
            "subject": subject,
            "upload_method": upload_method,
            "file_type": file_type,
            "processed_content_preview": processed_content[:200] + "..." if len(processed_content) > 200 else processed_content
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to process notes: {str(e)}"
        }

def extract_key_topics(content: str) -> List[str]:
    """
    Extract key topics from content using simple keyword extraction.
    In production, this could use more sophisticated NLP.
    """
    # Simple keyword extraction - split by sentences and find important terms
    sentences = content.split('.')
    topics = []
    
    # Look for patterns that indicate important concepts
    import re
    
    # Find terms that are capitalized or in quotes
    capitalized_terms = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
    quoted_terms = re.findall(r'"([^"]*)"', content)
    
    # Combine and filter
    all_terms = capitalized_terms + quoted_terms
    
    # Remove common words and keep unique terms
    common_words = {'The', 'This', 'That', 'These', 'Those', 'And', 'But', 'Or', 'So', 'For', 'With', 'By'}
    topics = list(set([term for term in all_terms if term not in common_words and len(term) > 2]))
    
    return topics[:10]  # Return top 10 topics

def generate_questions_from_notes(notes_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate study questions from uploaded notes using AI.
    """
    try:
        content = notes_data.get("content", "")
        question_type = notes_data.get("type", "mixed")  # mixed, mcq, short_answer, essay
        num_questions = notes_data.get("num_questions", 5)
        upload_method = notes_data.get("upload_method", "text")
        file_type = notes_data.get("file_type", "text/plain")
        
        if not content.strip():
            return {"status": "error", "message": "No content provided"}
        
        # Handle file content processing
        processed_content = content
        if upload_method == "file" and file_type == "application/pdf":
            # Content is already processed by process_uploaded_notes
            processed_content = content
        
        # Use Gemini to generate questions
        import google.generativeai as genai
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Create a more specific prompt based on question type
        if question_type == "mcq":
            type_instruction = "Generate multiple choice questions with 4 options each (A, B, C, D). Mark the correct answer clearly."
        elif question_type == "short_answer":
            type_instruction = "Generate short answer questions that can be answered in 2-3 sentences."
        elif question_type == "essay":
            type_instruction = "Generate essay questions that require detailed explanations and analysis."
        else:
            type_instruction = "Generate a mix of question types including multiple choice, short answer, and essay questions."
        
        prompt = f"""
        Based on the following study notes, generate {num_questions} high-quality study questions.
        
        Content to analyze:
        {processed_content[:3000]}  # Limit content to avoid token limits
        
        Instructions:
        - {type_instruction}
        - Include a mix of difficulty levels (easy, medium, hard)
        - Focus on key concepts and important details
        - Make questions clear and unambiguous
        - For MCQ questions, provide 4 options with one clearly correct answer
        - Include explanations for correct answers
        
        Return your response as a JSON object with this exact structure:
        {{
            "questions": [
                {{
                    "id": 1,
                    "type": "mcq|short_answer|essay",
                    "difficulty": "easy|medium|hard",
                    "question": "Clear question text here",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "A",
                    "explanation": "Detailed explanation of why this is correct"
                }}
            ]
        }}
        
        IMPORTANT: Return ONLY valid JSON. No additional text or formatting.
        """
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up the response to ensure it's valid JSON
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '').strip()
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '').strip()
        
        # Parse the response
        try:
            questions_data = json.loads(response_text)
            questions = questions_data.get("questions", [])
            
            # Validate and clean up questions
            validated_questions = []
            for i, q in enumerate(questions):
                validated_q = {
                    "id": i + 1,
                    "type": q.get("type", question_type),
                    "difficulty": q.get("difficulty", "medium"),
                    "question": q.get("question", f"Question {i+1}"),
                    "explanation": q.get("explanation", "No explanation provided")
                }
                
                # Add options for MCQ questions
                if q.get("type") == "mcq" or question_type == "mcq":
                    validated_q["options"] = q.get("options", ["Option A", "Option B", "Option C", "Option D"])
                    validated_q["correct_answer"] = q.get("correct_answer", "A")
                else:
                    validated_q["correct_answer"] = q.get("correct_answer", "Sample answer not provided")
                
                validated_questions.append(validated_q)
            
            return {
                "status": "success",
                "questions": validated_questions,
                "total_generated": len(validated_questions),
                "type": question_type,
                "source_content_length": len(processed_content)
            }
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract questions from text
            print(f"JSON parsing failed: {e}")
            print(f"Response text: {response_text[:500]}...")
            
            # Return a fallback response
            return {
                "status": "partial_success",
                "questions": [{
                    "id": 1,
                    "type": question_type,
                    "difficulty": "medium",
                    "question": "Based on the uploaded content, what are the key concepts you should focus on?",
                    "correct_answer": "Review the main topics and create your own study notes",
                    "explanation": "This is a general question generated due to processing issues with the AI response"
                }],
                "total_generated": 1,
                "type": question_type,
                "raw_response": response_text[:500] + "..." if len(response_text) > 500 else response_text,
                "message": "Questions generated but formatting may need adjustment"
            }
        
    except Exception as e:
        print(f"Error in generate_questions_from_notes: {e}")
        return {
            "status": "error",
            "message": f"Failed to generate questions: {str(e)}",
            "questions": [],
            "total_generated": 0
        }

def generate_mcqs_from_notes(notes_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Specifically generate MCQs from uploaded notes.
    """
    notes_data["type"] = "mcq"
    return generate_questions_from_notes(notes_data)