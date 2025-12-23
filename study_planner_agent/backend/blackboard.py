"""
Shared Blackboard for Inter-Agent Communication
Implements the blackboard pattern for true agentic coordination
"""
import json
import time
from typing import Dict, Any, List
from dataclasses import dataclass, asdict
from enum import Enum

class AgentStatus(Enum):
    IDLE = "idle"
    WORKING = "working"
    WAITING_APPROVAL = "waiting_approval"
    BLOCKED = "blocked"

@dataclass
class AgentState:
    name: str
    status: AgentStatus
    current_goal: str
    last_action: str
    performance_score: float
    timestamp: float

@dataclass
class StudyGoal:
    subject: str
    target_completion: str
    current_progress: float
    priority: int
    status: str

class Blackboard:
    def __init__(self):
        self.agents: Dict[str, AgentState] = {}
        self.study_goals: List[StudyGoal] = []
        self.shared_context: Dict[str, Any] = {}
        self.events: List[Dict[str, Any]] = []
        
    def register_agent(self, agent_name: str):
        """Register an agent with the blackboard"""
        self.agents[agent_name] = AgentState(
            name=agent_name,
            status=AgentStatus.IDLE,
            current_goal="",
            last_action="initialized",
            performance_score=1.0,
            timestamp=time.time()
        )
    
    def update_agent_status(self, agent_name: str, status: AgentStatus, goal: str = ""):
        """Update agent status and current goal"""
        if agent_name in self.agents:
            self.agents[agent_name].status = status
            self.agents[agent_name].current_goal = goal
            self.agents[agent_name].timestamp = time.time()
    
    def post_event(self, event_type: str, data: Dict[str, Any], source_agent: str):
        """Post an event that other agents can react to"""
        event = {
            "type": event_type,
            "data": data,
            "source": source_agent,
            "timestamp": time.time()
        }
        self.events.append(event)
        
        # Trigger reactions based on event type
        self._trigger_agent_reactions(event)
    
    def _trigger_agent_reactions(self, event: Dict[str, Any]):
        """Trigger appropriate agent reactions to events"""
        event_type = event["type"]
        
        if event_type == "low_productivity_detected":
            # Notify behavior coach
            self.update_agent_status("BehaviorCoachAgent", AgentStatus.WORKING, "improve_focus")
            
        elif event_type == "deadline_approaching":
            # Notify task scheduler to replan
            self.update_agent_status("TaskManagerAgent", AgentStatus.WORKING, "reschedule_tasks")
            
        elif event_type == "study_plan_needs_revision":
            # Notify study planner
            self.update_agent_status("StudyPlannerAgent", AgentStatus.WORKING, "revise_plan")
    
    def get_context_for_agent(self, agent_name: str) -> Dict[str, Any]:
        """Get relevant context for a specific agent"""
        return {
            "study_goals": [asdict(goal) for goal in self.study_goals],
            "other_agents": {name: asdict(state) for name, state in self.agents.items() if name != agent_name},
            "recent_events": self.events[-10:],  # Last 10 events
            "shared_context": self.shared_context
        }
    
    def update_study_progress(self, subject: str, progress: float):
        """Update progress for a study goal"""
        for goal in self.study_goals:
            if goal.subject == subject:
                goal.current_progress = progress
                
                # Trigger events based on progress
                if progress < 0.3:  # Less than 30% progress
                    self.post_event("low_progress_detected", {"subject": subject, "progress": progress}, "system")

# Global blackboard instance
blackboard = Blackboard()