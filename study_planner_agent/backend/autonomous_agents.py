"""
Specific Autonomous Agent Implementations
Each agent has unique autonomous behavior patterns
"""
import time
from typing import Dict, Any
from autonomous_agent import AutonomousAgent
from blackboard import blackboard

class AutonomousProgressAnalyzer(AutonomousAgent):
    """Continuously monitors student progress and triggers interventions"""
    
    def _should_take_action(self, context: Dict[str, Any]) -> bool:
        # Check if enough time has passed since last analysis
        last_analysis = blackboard.shared_context.get("last_progress_analysis", 0)
        return time.time() - last_analysis > 3600  # Every hour
    
    def _take_autonomous_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # Import tools locally to avoid circular imports
        from enhanced_tools import analyze_productivity
        
        # Analyze current productivity
        study_goals = context.get("study_goals", [])
        
        # Calculate overall progress
        total_progress = sum(goal.get("current_progress", 0) for goal in study_goals)
        avg_progress = total_progress / len(study_goals) if study_goals else 0
        
        # Check for concerning patterns
        if avg_progress < 0.3:  # Less than 30% average progress
            blackboard.post_event("low_productivity_detected", {
                "average_progress": avg_progress,
                "recommendation": "intervention_needed"
            }, self.name)
        
        # Update blackboard
        blackboard.shared_context["last_progress_analysis"] = time.time()
        blackboard.shared_context["current_avg_progress"] = avg_progress
        
        return {"analysis_completed": True, "avg_progress": avg_progress}
    
    def _evaluate_performance(self, result: Dict[str, Any], context: Dict[str, Any]) -> float:
        # Performance based on accuracy of progress detection
        return 1.0 if result.get("analysis_completed") else 0.0
    
    def _get_sleep_duration(self) -> int:
        return 1800  # Check every 30 minutes

class AutonomousTaskScheduler(AutonomousAgent):
    """Automatically reschedules missed tasks and optimizes calendar"""
    
    def _should_take_action(self, context: Dict[str, Any]) -> bool:
        # Check for missed deadlines or rescheduling requests
        recent_events = context.get("recent_events", [])
        
        for event in recent_events:
            if event["type"] in ["deadline_approaching", "task_missed"]:
                return True
        
        # Also check daily for optimization opportunities
        last_optimization = blackboard.shared_context.get("last_schedule_optimization", 0)
        return time.time() - last_optimization > 86400  # Daily
    
    def _take_autonomous_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # Get upcoming deadlines
        from enhanced_tools import check_upcoming_deadlines
        
        tasks_data = {"tasks": blackboard.shared_context.get("current_tasks", [])}
        deadline_check = check_upcoming_deadlines(tasks_data)
        
        actions_taken = []
        
        # Handle urgent deadlines
        for alert in deadline_check.get("alerts", []):
            if alert["days_left"] <= 1:
                # Request human approval for emergency rescheduling
                blackboard.post_event("emergency_reschedule_needed", {
                    "task": alert["task"],
                    "days_left": alert["days_left"]
                }, self.name)
                actions_taken.append(f"Emergency reschedule requested for {alert['task']}")
        
        blackboard.shared_context["last_schedule_optimization"] = time.time()
        
        return {"actions_taken": actions_taken, "deadlines_checked": len(deadline_check.get("alerts", []))}
    
    def _evaluate_performance(self, result: Dict[str, Any], context: Dict[str, Any]) -> float:
        # Performance based on proactive deadline management
        actions = result.get("actions_taken", [])
        return min(1.0, len(actions) * 0.3)  # Up to 1.0 for multiple actions
    
    def _get_sleep_duration(self) -> int:
        return 3600  # Check every hour

class AutonomousBehaviorCoach(AutonomousAgent):
    """Provides motivational interventions and focus strategies"""
    
    def _should_take_action(self, context: Dict[str, Any]) -> bool:
        # React to low productivity events
        recent_events = context.get("recent_events", [])
        
        for event in recent_events:
            if event["type"] in ["low_productivity_detected", "low_progress_detected"]:
                return True
        
        # Also provide daily motivation
        last_motivation = blackboard.shared_context.get("last_motivation", 0)
        return time.time() - last_motivation > 86400  # Daily
    
    def _take_autonomous_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # Analyze current situation
        avg_progress = blackboard.shared_context.get("current_avg_progress", 0.5)
        
        # Generate appropriate intervention
        if avg_progress < 0.3:
            strategy = "intensive_support"
            message = "I notice you're struggling. Let's break tasks into smaller chunks and use 15-minute focus sessions."
        elif avg_progress < 0.6:
            strategy = "gentle_encouragement"
            message = "You're making progress! Try the Pomodoro technique to maintain momentum."
        else:
            strategy = "maintenance"
            message = "Great work! Keep up the consistent effort."
        
        # Post motivational event
        blackboard.post_event("motivation_provided", {
            "strategy": strategy,
            "message": message,
            "progress_level": avg_progress
        }, self.name)
        
        blackboard.shared_context["last_motivation"] = time.time()
        
        return {"strategy": strategy, "message": message}
    
    def _evaluate_performance(self, result: Dict[str, Any], context: Dict[str, Any]) -> float:
        # Performance based on appropriateness of intervention
        strategy = result.get("strategy")
        avg_progress = blackboard.shared_context.get("current_avg_progress", 0.5)
        
        # Check if strategy matches situation
        if avg_progress < 0.3 and strategy == "intensive_support":
            return 1.0
        elif 0.3 <= avg_progress < 0.6 and strategy == "gentle_encouragement":
            return 1.0
        elif avg_progress >= 0.6 and strategy == "maintenance":
            return 1.0
        else:
            return 0.5  # Partial credit for taking action
    
    def _get_sleep_duration(self) -> int:
        return 7200  # Check every 2 hours