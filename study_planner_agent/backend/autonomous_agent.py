"""
Autonomous Agent Base Class
Provides true agentic behavior with self-evaluation and goal-driven actions
"""
import time
import json
import threading
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from blackboard import blackboard, AgentStatus
import google.generativeai as genai

class AutonomousAgent(ABC):
    def __init__(self, name: str, model, system_prompt: str, tools: List):
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.tools = tools
        self.is_running = False
        self.performance_history = []
        
        # Register with blackboard
        blackboard.register_agent(self.name)
        
    def start_autonomous_loop(self):
        """Start the agent's autonomous decision-making loop"""
        self.is_running = True
        thread = threading.Thread(target=self._autonomous_loop, daemon=True)
        thread.start()
        
    def stop_autonomous_loop(self):
        """Stop the agent's autonomous loop"""
        self.is_running = False
        
    def _autonomous_loop(self):
        """Main autonomous loop - runs continuously"""
        while self.is_running:
            try:
                # Get current context from blackboard
                context = blackboard.get_context_for_agent(self.name)
                
                # Evaluate if action is needed
                if self._should_take_action(context):
                    blackboard.update_agent_status(self.name, AgentStatus.WORKING)
                    
                    # Take autonomous action
                    result = self._take_autonomous_action(context)
                    
                    # Evaluate performance
                    performance = self._evaluate_performance(result, context)
                    self.performance_history.append(performance)
                    
                    # Update blackboard with results
                    self._update_blackboard(result)
                    
                    blackboard.update_agent_status(self.name, AgentStatus.IDLE)
                
                # Sleep before next evaluation
                time.sleep(self._get_sleep_duration())
                
            except Exception as e:
                print(f"Error in {self.name} autonomous loop: {e}")
                blackboard.update_agent_status(self.name, AgentStatus.BLOCKED)
                time.sleep(60)  # Wait before retrying
    
    @abstractmethod
    def _should_take_action(self, context: Dict[str, Any]) -> bool:
        """Determine if the agent should take action based on current context"""
        pass
    
    @abstractmethod
    def _take_autonomous_action(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Take an autonomous action based on the context"""
        pass
    
    @abstractmethod
    def _evaluate_performance(self, result: Dict[str, Any], context: Dict[str, Any]) -> float:
        """Evaluate the performance of the last action (0.0 to 1.0)"""
        pass
    
    @abstractmethod
    def _get_sleep_duration(self) -> int:
        """Return sleep duration in seconds between autonomous evaluations"""
        pass
    
    def _update_blackboard(self, result: Dict[str, Any]):
        """Update the blackboard with action results"""
        blackboard.shared_context[f"{self.name}_last_result"] = result
    
    def run_on_demand(self, payload: str) -> str:
        """Run agent on-demand (for API calls)"""
        blackboard.update_agent_status(self.name, AgentStatus.WORKING, "on_demand_request")
        
        try:
            # Combine system prompt with user input
            full_prompt = f"{self.system_prompt}\n\nUser Input: {payload}\n\nPlease respond in JSON format."
            
            # Generate response using Gemini
            response = self.model.generate_content(full_prompt)
            result = response.text
        except Exception as e:
            result = json.dumps({"error": str(e), "agent": self.name})
        
        blackboard.update_agent_status(self.name, AgentStatus.IDLE)
        return result