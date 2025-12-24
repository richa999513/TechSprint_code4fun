import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

# Simple agent wrapper that works with current Google ADK
class SimpleAgent:
    def __init__(self, name: str, model, system_prompt: str, tools: list):
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.tools = tools
    
    def run(self, payload: str) -> str:
        """Run the agent with the given payload"""
        try:
            # For Tutor Agent, don't request JSON format
            if self.name == "TutorAgent":
                full_prompt = f"{self.system_prompt}\n\nUser Input: {payload}\n\nProvide a clear, natural language response."
            else:
                # Combine system prompt with user input
                full_prompt = f"{self.system_prompt}\n\nUser Input: {payload}\n\nPlease respond in JSON format."
            
            # Generate response using Gemini
            response = self.model.generate_content(full_prompt)
            response_text = response.text.strip()
            
            # Clean up JSON formatting for non-tutor agents
            if self.name != "TutorAgent":
                # Remove markdown formatting if present
                if response_text.startswith('```json'):
                    response_text = response_text.replace('```json', '').replace('```', '').strip()
                elif response_text.startswith('```'):
                    response_text = response_text.replace('```', '').strip()
                
                # Validate JSON for non-tutor agents
                try:
                    json.loads(response_text)
                except json.JSONDecodeError:
                    # If JSON is invalid, wrap in error format
                    return json.dumps({
                        "error": "Invalid JSON response from agent",
                        "agent": self.name,
                        "raw_response": response_text[:500] + "..." if len(response_text) > 500 else response_text
                    })
            
            return response_text
        except Exception as e:
            return json.dumps({"error": str(e), "agent": self.name})

from enhanced_tools import (
    store_data,
    validate_study_inputs,
    analyze_productivity,
    check_upcoming_deadlines,
    suggest_focus_strategy,
    prepare_tutor_context,
    create_calendar_events_from_study_plan,
    format_study_plan_as_table
)

from rag.rag_tools import retrieve_from_rag, add_to_rag
from prompts import *

# --------------------------------------------------
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
MODEL = genai.GenerativeModel("gemini-2.5-flash")

# --------------------------------------------------
study_planner_agent = SimpleAgent(
    name="StudyPlannerAgent",
    model=MODEL,
    system_prompt=STUDY_PLANNER_PROMPT,
    tools=[store_data]
)

task_manager_agent = SimpleAgent(
    name="TaskManagerAgent",
    model=MODEL,
    system_prompt=TASK_MANAGER_PROMPT,
    tools=[store_data, validate_study_inputs, check_upcoming_deadlines]
)

knowledge_agent = SimpleAgent(
    name="KnowledgeAgent",
    model=MODEL,
    system_prompt=KNOWLEDGE_AGENT_PROMPT,
    tools=[store_data, add_to_rag]
)

tutor_agent = SimpleAgent(
    name="TutorAgent",
    model=MODEL,
    system_prompt=TUTOR_AGENT_PROMPT + "\n\nIMPORTANT: Respond ONLY in natural language. Do NOT use JSON format. Provide clear, educational explanations.",
    tools=[retrieve_from_rag, prepare_tutor_context]
)

behavior_coach_agent = SimpleAgent(
    name="BehaviorCoachAgent",
    model=MODEL,
    system_prompt=BEHAVIOR_COACH_PROMPT,
    tools=[suggest_focus_strategy]
)

progress_analyzer_agent = SimpleAgent(
    name="ProgressAnalyzerAgent",
    model=MODEL,
    system_prompt=PROGRESS_ANALYZER_PROMPT,
    tools=[analyze_productivity, check_upcoming_deadlines]
)

# --------------------------------------------------
# Import autonomous agents
from autonomous_agents import (
    AutonomousProgressAnalyzer,
    AutonomousTaskScheduler, 
    AutonomousBehaviorCoach
)
from blackboard import blackboard

class AgenticOrchestrator:
    def __init__(self):
        # Initialize autonomous agents
        self.progress_analyzer = AutonomousProgressAnalyzer(
            "ProgressAnalyzerAgent", MODEL, PROGRESS_ANALYZER_PROMPT, 
            [analyze_productivity, check_upcoming_deadlines]
        )
        self.task_scheduler = AutonomousTaskScheduler(
            "TaskSchedulerAgent", MODEL, TASK_MANAGER_PROMPT,
            [store_data, validate_study_inputs, check_upcoming_deadlines]
        )
        self.behavior_coach = AutonomousBehaviorCoach(
            "BehaviorCoachAgent", MODEL, BEHAVIOR_COACH_PROMPT,
            [suggest_focus_strategy]
        )
        
        # Start autonomous loops
        self.progress_analyzer.start_autonomous_loop()
        self.task_scheduler.start_autonomous_loop()
        self.behavior_coach.start_autonomous_loop()
    
    def plan_study(self, payload):
        """Human-initiated study planning with agentic follow-up and calendar integration"""
        try:
            # Initial plan creation
            plan_response = study_planner_agent.run(json.dumps(payload))
            
            # Parse the JSON response
            try:
                plan_data = json.loads(plan_response)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                plan_data = {
                    "daily_study_plan": [],
                    "general_reminders": [],
                    "error": "Failed to parse study plan JSON",
                    "raw_response": plan_response[:500] + "..." if len(plan_response) > 500 else plan_response
                }
            
            # Store in blackboard for autonomous agents to monitor
            blackboard.shared_context["current_study_plan"] = plan_data
            blackboard.post_event("new_study_plan_created", payload, "human")
            
            # Task manager processes the plan
            tasks_response = task_manager_agent.run(json.dumps(plan_data))
            try:
                tasks_data = json.loads(tasks_response)
            except json.JSONDecodeError:
                tasks_data = plan_data  # Use original plan if task manager fails
            
            blackboard.shared_context["current_tasks"] = tasks_data
            
            # Automatically create calendar events from the study plan
            try:
                calendar_result = create_calendar_events_from_study_plan(plan_data)
                blackboard.shared_context["calendar_events"] = calendar_result
                
                # Format the study plan as a table for better display
                formatted_plan = format_study_plan_as_table(plan_data)
                
                return {
                    "success": True,
                    "plan": json.dumps(plan_data),  # Keep as string for compatibility
                    "study_plan": plan_data,  # Also provide as object
                    "calendar_events": calendar_result,
                    "formatted_schedule": formatted_plan,
                    "autonomous_monitoring": "enabled",
                    "message": "Study plan created with calendar integration and autonomous monitoring!"
                }
            except Exception as e:
                # If calendar integration fails, still return the plan
                return {
                    "success": True,
                    "plan": json.dumps(plan_data),
                    "study_plan": plan_data,
                    "calendar_integration": {"status": "error", "message": str(e)},
                    "formatted_schedule": {"status": "error", "message": "Failed to format schedule"},
                    "autonomous_monitoring": "enabled",
                    "error": f"Calendar integration failed: {str(e)}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Study plan creation failed: {str(e)}",
                "plan": json.dumps({"error": str(e)}),
                "autonomous_monitoring": "error"
            }

    def upload_notes(self, payload):
        """Knowledge ingestion with autonomous processing and enhanced RAG integration"""
        try:
            # Process notes with enhanced tools first
            from enhanced_tools import process_uploaded_notes
            
            enhanced_result = process_uploaded_notes(payload)
            
            # Also use the knowledge agent for additional processing
            agent_result = knowledge_agent.run(json.dumps(payload))
            
            # Try to parse agent result as JSON
            try:
                agent_data = json.loads(agent_result)
            except json.JSONDecodeError:
                agent_data = {"raw_response": agent_result}
            
            # Notify autonomous agents about new knowledge
            blackboard.post_event("new_knowledge_added", payload, "human")
            
            return {
                "success": True,
                "enhanced_processing": enhanced_result,
                "agent_processing": agent_data,
                "message": "Notes processed and added to knowledge base successfully!"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Notes processing failed: {str(e)}",
                "message": "Failed to process notes"
            }

    def ask_doubt(self, payload):
        """On-demand tutoring with natural language responses only"""
        # Get natural language response from tutor agent
        response = tutor_agent.run(json.dumps(payload))
        
        # Clean up any JSON formatting that might have slipped through
        try:
            # If response looks like JSON, extract the actual content
            if response.strip().startswith('{') and response.strip().endswith('}'):
                parsed = json.loads(response)
                if 'answer' in parsed:
                    response = parsed['answer']
                elif 'response' in parsed:
                    response = parsed['response']
                elif 'explanation' in parsed:
                    response = parsed['explanation']
        except:
            # If parsing fails, use the original response
            pass
        
        return {
            "answer": response,
            "format": "natural_language",
            "agent": "TutorAgent"
        }

    def analyze_progress(self, payload):
        """Manual progress check with enhanced analysis and autonomous monitoring"""
        try:
            # Get latest autonomous analysis
            latest_analysis = blackboard.shared_context.get("ProgressAnalyzerAgent_last_result", {})
            
            # Run fresh analysis with enhanced tools
            from enhanced_tools import analyze_productivity
            
            # Prepare data for analysis
            analysis_data = {
                "completed_tasks": payload.get("completed_tasks", 0),
                "total_tasks": payload.get("total_tasks", 1),
                "tasks": payload.get("tasks", [])
            }
            
            # Get detailed productivity analysis
            productivity_analysis = analyze_productivity(analysis_data)
            
            # Update progress in blackboard
            if "completed_tasks" in payload and "total_tasks" in payload:
                progress = payload["completed_tasks"] / payload["total_tasks"]
                blackboard.update_study_progress("overall", progress)
                
                # Trigger autonomous agents if progress is concerning
                if progress < 0.3:
                    blackboard.post_event("low_progress_detected", {
                        "progress": progress,
                        "analysis": productivity_analysis
                    }, "manual_progress_check")
            
            # Run the progress analyzer agent for additional insights
            agent_analysis = progress_analyzer_agent.run(json.dumps(payload))
            
            return {
                "current_analysis": productivity_analysis,
                "agent_insights": agent_analysis,
                "autonomous_insights": latest_analysis,
                "system_status": "autonomous_monitoring_active",
                "recommendations": productivity_analysis.get("recommendations", []),
                "completion_percentage": productivity_analysis.get("completion_percentage", 0),
                "status": productivity_analysis.get("status", "unknown")
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "current_analysis": {"status": "error", "message": "Analysis failed"},
                "autonomous_insights": {},
                "system_status": "error"
            }
    
    def get_system_status(self):
        """Get status of all autonomous agents"""
        return {
            "agents": {name: {
                "name": agent.name,
                "status": agent.status.value,
                "current_goal": agent.current_goal,
                "last_action": agent.last_action,
                "performance_score": agent.performance_score
            } for name, agent in blackboard.agents.items()},
            "recent_events": blackboard.events[-5:],
            "shared_context_keys": list(blackboard.shared_context.keys())
        }

orchestrator = AgenticOrchestrator()
