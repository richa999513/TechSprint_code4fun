// Demo data for testing the enhanced UI
const DEMO_STUDY_PLAN = {
    "daily_tasks": [
        {
            "id": 1,
            "name": "Theory of Computation: Finite Automata Introduction",
            "description": "Learn the basics of finite automata, states, transitions, and acceptance conditions.",
            "priority": "High",
            "deadline": "Monday 09:00 AM - 10:30 AM",
            "category": "Study",
            "estimated_duration_minutes": 90
        },
        {
            "id": 2,
            "name": "Short Break (Stretch, Hydrate)",
            "description": "Take a break to refresh your mind and body.",
            "priority": "Medium",
            "deadline": "Monday 10:30 AM - 11:00 AM",
            "category": "Break",
            "estimated_duration_minutes": 30
        },
        {
            "id": 3,
            "name": "TOC: Practice Problems - DFA Construction",
            "description": "Work through exercises on constructing deterministic finite automata.",
            "priority": "High",
            "deadline": "Monday 11:00 AM - 12:30 PM",
            "category": "Study",
            "estimated_duration_minutes": 90
        },
        {
            "id": 4,
            "name": "Lunch Break & Relax",
            "description": "Enjoy your lunch and take time to relax.",
            "priority": "Medium",
            "deadline": "Monday 12:30 PM - 01:30 PM",
            "category": "Break",
            "estimated_duration_minutes": 60
        },
        {
            "id": 5,
            "name": "TOC: Regular Languages and Expressions",
            "description": "Study regular languages, regular expressions, and their relationship to finite automata.",
            "priority": "High",
            "deadline": "Monday 01:30 PM - 02:30 PM",
            "category": "Study",
            "estimated_duration_minutes": 60
        }
    ],
    "general_reminders": [
        {
            "id": "R1",
            "name": "Practice Active Recall",
            "description": "Use flashcards and self-testing to reinforce TOC concepts like state diagrams and formal definitions.",
            "priority": "High",
            "category": "Study Strategy",
            "recurring": "daily"
        },
        {
            "id": "R2",
            "name": "Draw State Diagrams",
            "description": "Visualize automata by drawing state diagrams for better understanding.",
            "priority": "Medium",
            "category": "Study Strategy",
            "recurring": "daily"
        }
    ]
};

const DEMO_PROGRESS_ANALYSIS = {
    "analysis_date": "2024-12-22",
    "productivity_summary": {
        "completed_tasks": 7,
        "total_tasks": 10,
        "pending_tasks": 3,
        "completion_percentage": 70.0,
        "pending_percentage": 30.0
    },
    "productivity_insights": [
        {
            "type": "status",
            "message": "Great progress! You've completed 70% of your tasks, showing strong commitment to your studies.",
            "severity": "positive"
        },
        {
            "type": "focus_area",
            "message": "Focus on the remaining 3 tasks to maintain momentum and achieve your weekly goals.",
            "severity": "medium"
        },
        {
            "type": "recommendation",
            "message": "Consider breaking down complex tasks into smaller subtasks for better progress tracking.",
            "severity": "actionable"
        }
    ],
    "recommendations": [
        "Maintain your current study schedule as it's working well for you.",
        "Use the Pomodoro technique for the remaining challenging tasks.",
        "Review completed tasks to reinforce learning and identify patterns.",
        "Plan ahead for next week to maintain this positive momentum."
    ]
};

const DEMO_CHAT_RESPONSES = [
    {
        "question": "What is a finite automaton?",
        "response": "A finite automaton is a mathematical model of computation that consists of:\n\n**Key Components:**\n• A finite set of states\n• An input alphabet\n• A transition function\n• A start state\n• A set of accepting (final) states\n\n**How it works:**\nThe automaton reads input symbols one by one, transitioning between states according to its transition function. If it ends in an accepting state after reading the entire input, the string is accepted.\n\n**Example:**\nA simple DFA that accepts strings ending in '01' would have states representing the last symbols seen, transitioning appropriately until reaching the accepting state after seeing '01'."
    },
    {
        "question": "Explain the difference between DFA and NFA",
        "response": "Great question! Here are the key differences:\n\n**DFA (Deterministic Finite Automaton):**\n• Exactly one transition per state-symbol pair\n• No epsilon (ε) transitions\n• Easier to implement in code\n• Always has a unique computation path\n\n**NFA (Nondeterministic Finite Automaton):**\n• Can have multiple transitions per state-symbol pair\n• May include epsilon transitions\n• More flexible for design\n• Can have multiple computation paths\n\n**Important:** Every NFA can be converted to an equivalent DFA using the subset construction algorithm, so they have the same computational power!"
    }
];

// Function to load demo data
function loadDemoData() {
    // Simulate study plan generation
    setTimeout(() => {
        displayStudyPlan({
            success: true,
            plan: JSON.stringify(DEMO_STUDY_PLAN)
        });
    }, 1000);
    
    // Add some demo chat messages
    setTimeout(() => {
        DEMO_CHAT_RESPONSES.forEach((demo, index) => {
            setTimeout(() => {
                addChatMessage(demo.question, 'user');
                setTimeout(() => {
                    addChatMessage(demo.response, 'ai');
                }, 500);
            }, index * 2000);
        });
    }, 2000);
}