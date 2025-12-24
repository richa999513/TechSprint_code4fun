// Global chart instances
let progressChart = null;
let trendChart = null;

// Store progress history for trend analysis
let progressHistory = [];

// Progress tracking state
let isAnalyzingProgress = false;

// Configuration
const BASE_URL = "http://127.0.0.1:8000";
let currentUser = null;
let isDemo = false;
let sessionData = {
    chatHistory: [],
    studyPlans: [],
    progressData: [],
    systemStatus: null
};

// Development mode - skip Firebase for now
const isDevelopmentMode = true;

// Firebase Configuration (for production)
const firebaseConfig = {
    apiKey: "AIzaSyC7VmUsGSk6X6tXmbd2JnN3UqmS4arSPvY",
    authDomain: "studygenie-45bb7.firebasestorage.app",
    projectId: "studygenie-45bb7",
    storageBucket: "studygenie-45bb7.firebasestorage.app",
    messagingSenderId: "453119794346",
    appId: "1:453119794346:web:fc7792aa3cc042886104d3"
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Show loading screen
    showElement('loadingScreen');
    
    // Simulate initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if user is logged in (for demo, we'll skip this)
    hideElement('loadingScreen');
    showElement('authContainer');
    
    // Initialize event listeners
    initializeEventListeners();
}

function initializeEventListeners() {
    // Authentication forms
    const loginForm = document.getElementById('loginFormElement');
    const signupForm = document.getElementById('signupFormElement');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    
    // Main app forms - will be initialized when main app is shown
    initializeMainAppListeners();
}

function initializeMainAppListeners() {
    const studyPlanForm = document.getElementById('studyPlanForm');
    const chatForm = document.getElementById('chatForm');
    const progressForm = document.getElementById('progressForm');
    const notesUploadForm = document.getElementById('notesUploadForm');
    const questionsForm = document.getElementById('questionsForm');
    const mcqsForm = document.getElementById('mcqsForm');
    
    if (studyPlanForm) {
        studyPlanForm.removeEventListener('submit', handleStudyPlan);
        studyPlanForm.addEventListener('submit', handleStudyPlan);
    }
    if (chatForm) {
        chatForm.removeEventListener('submit', handleChat);
        chatForm.addEventListener('submit', handleChat);
    }
    if (progressForm) {
        progressForm.removeEventListener('submit', handleProgress);
        progressForm.addEventListener('submit', handleProgress);
    }
    if (notesUploadForm) {
        notesUploadForm.removeEventListener('submit', handleNotesUpload);
        notesUploadForm.addEventListener('submit', handleNotesUpload);
    }
    if (questionsForm) {
        questionsForm.removeEventListener('submit', handleQuestionsGeneration);
        questionsForm.addEventListener('submit', handleQuestionsGeneration);
    }
    if (mcqsForm) {
        mcqsForm.removeEventListener('submit', handleMCQsGeneration);
        mcqsForm.addEventListener('submit', handleMCQsGeneration);
    }
}

// Session Management
function clearSessionData() {
    sessionData = {
        chatHistory: [],
        studyPlans: [],
        progressData: [],
        systemStatus: null
    };
}

function resetUIState() {
    // Clear all form inputs
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.id !== 'loginFormElement' && form.id !== 'signupFormElement') {
            form.reset();
        }
    });
    
    // Clear chat messages except the initial AI message
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="message ai-message">
                <i class="fas fa-robot"></i>
                <div class="message-content">
                    <p>Hello! I'm your AI tutor. Ask me anything about your studies!</p>
                </div>
            </div>
        `;
    }
    
    // Hide all result containers
    const resultContainers = document.querySelectorAll('.result-container');
    resultContainers.forEach(container => {
        hideElement(container.id);
    });
    
    // Reset subjects container to have one empty subject
    const subjectsContainer = document.getElementById('subjectsContainer');
    if (subjectsContainer) {
        subjectsContainer.innerHTML = `
            <div class="subject-input">
                <input type="text" placeholder="Subject name" class="subject-name">
                <select class="subject-difficulty">
                    <option value="Easy">Easy</option>
                    <option value="Medium" selected>Medium</option>
                    <option value="Hard">Hard</option>
                </select>
                <input type="date" class="subject-exam-date">
                <button type="button" onclick="removeSubject(this)" class="btn-remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    // Reset progress form values
    const completedTasks = document.getElementById('completedTasks');
    const totalTasks = document.getElementById('totalTasks');
    const dailyHours = document.getElementById('dailyHours');
    
    if (completedTasks) completedTasks.value = '0';
    if (totalTasks) totalTasks.value = '10';
    if (dailyHours) dailyHours.value = '4';
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    try {
        showNotification('Signing in...', 'info');
        
        // Clear any existing session data
        clearSessionData();
        
        if (isDevelopmentMode) {
            // Development mode - skip Firebase authentication
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            currentUser = {
                email: email,
                name: email.split('@')[0],
                uid: 'dev_user_' + Date.now(),
                isDemo: false
            };
            
            isDemo = false;
            
            showMainApp();
            showNotification('Welcome! (Development Mode)', 'success');
        } else {
            // Production Firebase authentication would go here
            throw new Error('Firebase authentication not configured for production');
        }
        
    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'warning');
        return;
    }
    
    try {
        showNotification('Creating account...', 'info');
        
        // Clear any existing session data
        clearSessionData();
        
        // For demo, we'll simulate signup
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        currentUser = {
            email: email,
            name: name,
            uid: 'user_' + Date.now(),
            isDemo: false
        };
        
        isDemo = false;
        
        showMainApp();
        showNotification('Account created successfully!', 'success');
        
    } catch (error) {
        showNotification('Signup failed: ' + error.message, 'error');
    }
}

function enterDemoMode() {
    // Clear any existing session data
    clearSessionData();
    
    isDemo = true;
    currentUser = {
        email: 'demo@example.com',
        name: 'Demo User',
        uid: 'demo_user',
        isDemo: true
    };
    
    showMainApp();
    showNotification('Welcome to Demo Mode! All data will be cleared when you logout.', 'success');
}

function showMainApp() {
    hideElement('authContainer');
    showElement('mainApp');
    
    // Reset UI state for new session
    resetUIState();
    
    // Update user info
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name + (isDemo ? ' (Demo)' : '');
    }
    
    // Initialize main app event listeners
    initializeMainAppListeners();
    
    // Load initial data
    refreshSystemStatus();
}

function logout() {
    // Clear session data
    clearSessionData();
    currentUser = null;
    isDemo = false;
    
    // Reset forms
    const loginForm = document.getElementById('loginFormElement');
    const signupForm = document.getElementById('signupFormElement');
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
    
    hideElement('mainApp');
    showElement('authContainer');
    showElement('loginForm');
    hideElement('signupForm');
    
    showNotification('Logged out successfully', 'info');
}

// UI Helper Functions
function showLogin() {
    showElement('loginForm');
    hideElement('signupForm');
}

function showSignup() {
    hideElement('loginForm');
    showElement('signupForm');
}

function showElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('hidden');
    }
}

function hideElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add('hidden');
    }
}

// Subject Management
function addSubject() {
    const container = document.getElementById('subjectsContainer');
    if (!container) return;
    
    const subjectDiv = document.createElement('div');
    subjectDiv.className = 'subject-input';
    subjectDiv.innerHTML = `
        <input type="text" placeholder="Subject name" class="subject-name" required>
        <select class="subject-difficulty">
            <option value="Easy">Easy</option>
            <option value="Medium" selected>Medium</option>
            <option value="Hard">Hard</option>
        </select>
        <input type="date" class="subject-exam-date">
        <button type="button" onclick="removeSubject(this)" class="btn-remove">
            <i class="fas fa-times"></i>
        </button>
    `;
    container.appendChild(subjectDiv);
}

function removeSubject(button) {
    const subjectsContainer = document.getElementById('subjectsContainer');
    const subjectInputs = subjectsContainer.querySelectorAll('.subject-input');
    
    // Don't allow removing the last subject input
    if (subjectInputs.length > 1) {
        button.parentElement.remove();
    } else {
        showNotification('At least one subject is required', 'warning');
    }
}

// Study Plan Handler
async function handleStudyPlan(e) {
    e.preventDefault();
    
    try {
        showNotification('Generating AI study plan...', 'info');
        
        // Collect subjects data
        const subjectInputs = document.querySelectorAll('.subject-input');
        const subjects = [];
        
        subjectInputs.forEach(input => {
            const name = input.querySelector('.subject-name').value.trim();
            const difficulty = input.querySelector('.subject-difficulty').value;
            const examDate = input.querySelector('.subject-exam-date').value;
            
            if (name) {
                subjects.push({
                    name: name,
                    difficulty: difficulty,
                    exam_date: examDate || null
                });
            }
        });
        
        if (subjects.length === 0) {
            showNotification('Please add at least one subject with a name', 'warning');
            return;
        }
        
        const dailyHours = parseInt(document.getElementById('dailyHours').value);
        
        if (!dailyHours || dailyHours < 1 || dailyHours > 12) {
            showNotification('Please enter valid daily study hours (1-12)', 'warning');
            return;
        }
        
        const requestData = {
            subjects: subjects,
            daily_hours: dailyHours
        };
        
        // Make API call
        const response = await fetch(`${BASE_URL}/study-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Store in session data
        sessionData.studyPlans.push({
            timestamp: new Date().toISOString(),
            data: data
        });
        
        // Display result
        displayStudyPlan(data);
        showNotification('Study plan generated successfully!', 'success');
        
    } catch (error) {
        console.error('Study plan error:', error);
        showNotification('Failed to generate study plan. Please check if the server is running.', 'error');
    }
}

function displayStudyPlan(data) {
    const resultContainer = document.getElementById('studyPlanResult');
    const outputDiv = document.getElementById('studyPlanOutput');
    
    if (!resultContainer || !outputDiv) return;
    
    let html = '';
    
    if (data.success) {
        // Handle new enhanced response format
        if (data.formatted_schedule && data.formatted_schedule.schedule_table) {
            html = formatScheduleTable(data.formatted_schedule.schedule_table);
        } else if (data.plan) {
            try {
                const planText = typeof data.plan === 'string' ? data.plan : JSON.stringify(data.plan);
                
                // Try to parse as JSON first
                let planData;
                try {
                    planData = JSON.parse(planText);
                } catch (e) {
                    // If not JSON, treat as plain text
                    planData = planText;
                }
                
                // Check if it's the new complex JSON structure with daily_study_plan
                if (typeof planData === 'object' && planData.daily_study_plan) {
                    html = formatComplexStudyPlan(planData);
                } else if (typeof planData === 'object' && planData.daily_tasks) {
                    // Format structured study plan
                    html = formatStructuredStudyPlan(planData);
                } else if (typeof planData === 'object') {
                    // Format generic object
                    html = formatGenericPlan(planData);
                } else {
                    // Format plain text
                    html = `<div class="plan-text">${planData}</div>`;
                }
            } catch (e) {
                html = `<div class="plan-text">${data.plan}</div>`;
            }
        } else {
            html = `<div class="plan-text">Study plan generated successfully! Check the response for details.</div>`;
        }
        
        // Add calendar integration info if available
        if (data.calendar_events && data.calendar_events.status === 'success') {
            html += `
                <div class="calendar-integration">
                    <div class="calendar-header">
                        <i class="fas fa-calendar-plus"></i> Calendar Integration
                    </div>
                    <div class="calendar-info">
                        <p><strong>Events Created:</strong> ${data.calendar_events.events_created || 0}</p>
                        <p><strong>Status:</strong> ${data.calendar_events.message || 'Calendar events created successfully'}</p>
                        ${data.calendar_events.calendar_integration === 'simulated' ? 
                            '<p class="demo-note"><i class="fas fa-info-circle"></i> Demo Mode: Calendar integration simulated</p>' : 
                            ''}
                    </div>
                </div>
            `;
        }
        
    } else if (data.plan) {
        html = `<div class="plan-text">${data.plan}</div>`;
    } else {
        html = `<div class="plan-text">Study plan generated successfully! Check the response for details.</div>`;
    }
    
    outputDiv.innerHTML = html;
    showElement('studyPlanResult');
}

function formatScheduleTable(scheduleTable) {
    let html = '<div class="schedule-table-container">';
    
    Object.entries(scheduleTable).forEach(([day, tasks]) => {
        html += `
            <div class="schedule-day-table">
                <div class="day-header-table">
                    <i class="fas fa-calendar-day"></i> ${day}
                </div>
                <div class="tasks-table">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Task</th>
                                <th>Description</th>
                                <th>Duration</th>
                                <th>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        tasks.forEach(task => {
            const priorityClass = `priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`;
            html += `
                <tr>
                    <td class="time-cell">${task.time || 'Not scheduled'}</td>
                    <td class="task-cell"><strong>${task.task || 'Unnamed Task'}</strong></td>
                    <td class="desc-cell">${task.description || 'No description'}</td>
                    <td class="duration-cell">${task.duration || 'Not specified'}</td>
                    <td class="priority-cell">
                        <span class="priority-badge ${priorityClass}">
                            ${task.priority || 'Medium'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function formatComplexStudyPlan(planData) {
    let html = '<div class="complex-study-schedule">';
    
    if (planData.daily_study_plan && Array.isArray(planData.daily_study_plan)) {
        // Group tasks by day
        const tasksByDay = {};
        
        planData.daily_study_plan.forEach(task => {
            const day = task.day_of_week || 'Unscheduled';
            if (!tasksByDay[day]) {
                tasksByDay[day] = [];
            }
            tasksByDay[day].push(task);
        });
        
        // Display tasks by day in a structured format
        Object.entries(tasksByDay).forEach(([day, tasks]) => {
            html += `
                <div class="schedule-day-complex">
                    <div class="day-header-complex">
                        <i class="fas fa-calendar-day"></i> ${day}
                    </div>
                    <div class="tasks-table-complex">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Task</th>
                                    <th>Description</th>
                                    <th>Duration</th>
                                    <th>Priority</th>
                                    <th>Category</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            tasks.forEach(task => {
                const priorityClass = `priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`;
                const categoryClass = `category-${task.category ? task.category.toLowerCase().replace(' ', '-') : 'study'}`;
                const duration = task.estimated_duration_minutes ? 
                    `${Math.floor(task.estimated_duration_minutes / 60)}h ${task.estimated_duration_minutes % 60}m` : 
                    'Not specified';
                const timeSlot = task.start_time && task.end_time ? 
                    `${task.start_time} - ${task.end_time}` : 
                    'Not scheduled';
                
                html += `
                    <tr class="task-row">
                        <td class="time-cell-complex">${timeSlot}</td>
                        <td class="task-cell-complex">
                            <strong>${task.task_name || 'Unnamed Task'}</strong>
                        </td>
                        <td class="desc-cell-complex">
                            <div class="task-description-complex">
                                ${task.description || 'No description'}
                            </div>
                        </td>
                        <td class="duration-cell-complex">${duration}</td>
                        <td class="priority-cell-complex">
                            <span class="priority-badge ${priorityClass}">
                                ${task.priority || 'Medium'}
                            </span>
                        </td>
                        <td class="category-cell-complex">
                            <span class="category-badge ${categoryClass}">
                                ${task.category || 'Study'}
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });
    }
    
    // Add general reminders if available
    if (planData.general_reminders && Array.isArray(planData.general_reminders)) {
        html += `
            <div class="general-reminders-section">
                <div class="reminders-header">
                    <i class="fas fa-lightbulb"></i> General Reminders
                </div>
                <div class="reminders-grid">
        `;
        
        planData.general_reminders.forEach(reminder => {
            const priorityClass = `priority-${reminder.priority ? reminder.priority.toLowerCase() : 'medium'}`;
            
            html += `
                <div class="reminder-card">
                    <div class="reminder-header">
                        <h6>${reminder.name || 'Reminder'}</h6>
                        <span class="priority-badge ${priorityClass}">
                            ${reminder.priority || 'Medium'}
                        </span>
                    </div>
                    <div class="reminder-description">
                        ${reminder.description || 'No description'}
                    </div>
                    <div class="reminder-meta">
                        <span class="reminder-category">
                            <i class="fas fa-tag"></i> ${reminder.category || 'General'}
                        </span>
                        <span class="reminder-frequency">
                            <i class="fas fa-repeat"></i> ${reminder.recurring || 'One-time'}
                        </span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function formatStructuredStudyPlan(planData) {
    let html = '<div class="study-schedule">';
    
    if (planData.daily_tasks && Array.isArray(planData.daily_tasks)) {
        // Group tasks by day
        const tasksByDay = {};
        
        planData.daily_tasks.forEach(task => {
            const day = task.deadline ? task.deadline.split(' ')[0] : 'Unscheduled';
            if (!tasksByDay[day]) {
                tasksByDay[day] = [];
            }
            tasksByDay[day].push(task);
        });
        
        // Display tasks by day
        Object.entries(tasksByDay).forEach(([day, tasks]) => {
            html += `
                <div class="schedule-day">
                    <div class="day-header">
                        <i class="fas fa-calendar-day"></i> ${day}
                    </div>
            `;
            
            tasks.forEach(task => {
                const priorityClass = `priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`;
                const duration = task.estimated_duration_minutes ? 
                    `${Math.floor(task.estimated_duration_minutes / 60)}h ${task.estimated_duration_minutes % 60}m` : 
                    'No duration';
                
                html += `
                    <div class="task-item">
                        <div class="task-info">
                            <div class="task-name">${task.name || 'Unnamed Task'}</div>
                            <div class="task-description">${task.description || 'No description'}</div>
                            <div class="task-time">
                                <i class="fas fa-clock"></i> ${task.deadline || 'No deadline'} 
                                (${duration})
                            </div>
                        </div>
                        <div class="task-priority ${priorityClass}">
                            ${task.priority || 'Medium'}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        });
    }
    
    // Add general reminders if available
    if (planData.general_reminders && Array.isArray(planData.general_reminders)) {
        html += `
            <div class="schedule-day">
                <div class="day-header">
                    <i class="fas fa-lightbulb"></i> General Reminders
                </div>
        `;
        
        planData.general_reminders.forEach(reminder => {
            html += `
                <div class="task-item">
                    <div class="task-info">
                        <div class="task-name">${reminder.name || 'Reminder'}</div>
                        <div class="task-description">${reminder.description || 'No description'}</div>
                        <div class="task-time">
                            <i class="fas fa-repeat"></i> ${reminder.recurring || 'One-time'}
                        </div>
                    </div>
                    <div class="task-priority priority-${reminder.priority ? reminder.priority.toLowerCase() : 'low'}">
                        ${reminder.priority || 'Low'}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function formatGenericPlan(planData) {
    let html = '<div class="generic-plan">';
    
    Object.entries(planData).forEach(([key, value]) => {
        html += `<div class="plan-section">`;
        html += `<h5>${key.replace(/_/g, ' ').toUpperCase()}</h5>`;
        
        if (Array.isArray(value)) {
            html += '<ul>';
            value.forEach(item => {
                if (typeof item === 'object') {
                    html += `<li><strong>${item.name || item.title || 'Item'}:</strong> ${item.description || JSON.stringify(item)}</li>`;
                } else {
                    html += `<li>${item}</li>`;
                }
            });
            html += '</ul>';
        } else if (typeof value === 'object') {
            html += `<pre>${JSON.stringify(value, null, 2)}</pre>`;
        } else {
            html += `<p>${value}</p>`;
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    return html;
}

// Chat Handler
async function handleChat(e) {
    e.preventDefault();
    
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const question = input.value.trim();
    
    if (!question) {
        showNotification('Please enter a question', 'warning');
        return;
    }
    
    // Add user message to chat
    addChatMessage(question, 'user');
    input.value = '';
    
    // Store in session data
    sessionData.chatHistory.push({
        message: question,
        sender: 'user',
        timestamp: new Date().toISOString()
    });
    
    try {
        // Add typing indicator
        addTypingIndicator();
        
        // Make API call
        const response = await fetch(`${BASE_URL}/ask-doubt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: question })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response
        let answer = 'Sorry, I could not process your question.';
        
        if (data.success && data.answer) {
            // New format with natural language response
            answer = data.answer;
        } else if (data.answer) {
            answer = data.answer;
        } else if (data.message) {
            answer = data.message;
        }
        
        // Clean up any remaining JSON formatting
        if (typeof answer === 'string' && answer.trim().startsWith('{') && answer.trim().endsWith('}')) {
            try {
                const parsed = JSON.parse(answer);
                if (parsed.message) {
                    answer = parsed.message;
                } else if (parsed.response) {
                    answer = parsed.response;
                } else if (parsed.answer) {
                    answer = parsed.answer;
                } else if (parsed.explanation) {
                    answer = parsed.explanation;
                } else if (typeof parsed === 'object') {
                    // Format object responses nicely
                    answer = formatChatResponse(parsed);
                }
            } catch (e) {
                // Keep original answer if parsing fails
            }
        }
        
        addChatMessage(answer, 'ai');
        
        // Store in session data
        sessionData.chatHistory.push({
            message: answer,
            sender: 'ai',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        removeTypingIndicator();
        const errorMessage = 'Sorry, I encountered an error. Please check if the server is running and try again.';
        addChatMessage(errorMessage, 'ai');
        showNotification('Chat error: Unable to connect to server', 'error');
    }
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const icon = sender === 'ai' ? 'fas fa-robot' : 'fas fa-user';
    
    messageDiv.innerHTML = `
        <i class="${icon}"></i>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    typingDiv.innerHTML = `
        <i class="fas fa-robot"></i>
        <div class="message-content">
            <p>AI is thinking...</p>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Progress Handler
async function handleProgress(e) {
    e.preventDefault();
    
    // Prevent multiple simultaneous requests
    if (isAnalyzingProgress) {
        showNotification('Analysis already in progress...', 'warning');
        return;
    }
    
    try {
        isAnalyzingProgress = true;
        
        const completedTasks = parseInt(document.getElementById('completedTasks').value);
        const totalTasks = parseInt(document.getElementById('totalTasks').value);
        const studyHours = parseFloat(document.getElementById('studyHours').value) || 0;
        const focusLevel = parseInt(document.getElementById('focusLevel').value) || 5;
        
        if (isNaN(completedTasks) || isNaN(totalTasks)) {
            showNotification('Please enter valid numbers for tasks', 'warning');
            return;
        }
        
        if (completedTasks < 0 || totalTasks < 1) {
            showNotification('Please enter valid task numbers', 'warning');
            return;
        }
        
        if (completedTasks > totalTasks) {
            showNotification('Completed tasks cannot exceed total tasks', 'warning');
            return;
        }
        
        showNotification('Analyzing your progress...', 'info');
        
        const requestData = {
            completed_tasks: completedTasks,
            total_tasks: totalTasks,
            study_hours: studyHours,
            focus_level: focusLevel,
            tasks: [] // Could be expanded to include actual task data
        };
        
        const response = await fetch(`${BASE_URL}/analyze-progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Store in session data
        sessionData.progressData.push({
            timestamp: new Date().toISOString(),
            data: data,
            study_hours: studyHours,
            focus_level: focusLevel
        });
        
        displayEnhancedProgressAnalysis(data, studyHours, focusLevel);
        showNotification('Progress analysis complete!', 'success');
        
    } catch (error) {
        console.error('Progress analysis error:', error);
        showNotification('Progress analysis failed. Please check if the server is running.', 'error');
    } finally {
        isAnalyzingProgress = false;
    }
}

// Global chart instances for enhanced progress tracking
let weeklyChart = null;
let hoursChart = null;

// Enhanced Progress Analysis Display
function displayEnhancedProgressAnalysis(data, studyHours, focusLevel) {
    const resultContainer = document.getElementById('progressResult');
    
    if (!resultContainer) return;
    
    // Parse the analysis data
    let analysisData = null;
    let insights = null;
    
    try {
        if (data.success && data.analysis) {
            // Handle the new enhanced response format
            if (data.analysis.current_analysis) {
                analysisData = data.analysis.current_analysis;
            } else if (typeof data.analysis === 'string') {
                analysisData = JSON.parse(data.analysis);
            } else {
                analysisData = data.analysis;
            }
            
            insights = data.analysis.autonomous_insights || data.analysis.agent_insights;
        } else if (data.analysis) {
            if (typeof data.analysis === 'string') {
                analysisData = JSON.parse(data.analysis);
            } else {
                analysisData = data.analysis;
            }
        }
    } catch (e) {
        console.error('Error parsing analysis data:', e);
        // Fallback to basic analysis
        analysisData = {
            productivity_score: (parseInt(document.getElementById('completedTasks').value) / parseInt(document.getElementById('totalTasks').value)),
            status: 'unknown',
            recommendations: ['Continue working on your tasks', 'Track your progress regularly']
        };
    }
    
    // Update quick stats
    updateQuickStats(analysisData, studyHours, focusLevel);
    
    // Create enhanced visual charts
    createEnhancedProgressCharts(analysisData, studyHours, focusLevel);
    
    // Display enhanced summary
    displayEnhancedProgressSummary(analysisData, studyHours, focusLevel);
    
    // Display AI insights
    displayEnhancedAIInsights(insights, analysisData);
    
    // Check and display achievements
    checkAndDisplayAchievements(analysisData, studyHours, focusLevel);
    
    showElement('progressResult');
}

function updateQuickStats(analysisData, studyHours, focusLevel) {
    const completedTasks = parseInt(document.getElementById('completedTasks').value);
    const totalTasks = parseInt(document.getElementById('totalTasks').value);
    const completionRate = (completedTasks / totalTasks) * 100;
    
    // Update completion rate
    const completionRateEl = document.getElementById('completionRate');
    if (completionRateEl) {
        completionRateEl.textContent = `${completionRate.toFixed(1)}%`;
        completionRateEl.parentElement.parentElement.className = `stat-card completion ${getStatusClass(completionRate)}`;
    }
    
    // Update productivity score
    const productivityScoreEl = document.getElementById('productivityScore');
    if (productivityScoreEl) {
        const score = analysisData.productivity_score || (completionRate / 100);
        productivityScoreEl.textContent = score.toFixed(2);
        productivityScoreEl.parentElement.parentElement.className = `stat-card productivity ${getStatusClass(score * 100)}`;
    }
    
    // Update focus score
    const focusScoreEl = document.getElementById('focusScore');
    if (focusScoreEl) {
        focusScoreEl.textContent = `${focusLevel}/10`;
        focusScoreEl.parentElement.parentElement.className = `stat-card focus ${getStatusClass(focusLevel * 10)}`;
    }
    
    // Update study time
    const studyTimeEl = document.getElementById('studyTime');
    if (studyTimeEl) {
        studyTimeEl.textContent = `${studyHours}h`;
        studyTimeEl.parentElement.parentElement.className = `stat-card time ${getStatusClass(Math.min(studyHours * 12.5, 100))}`;
    }
}

function getStatusClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
}

function createEnhancedProgressCharts(analysisData, studyHours, focusLevel) {
    const completedTasks = parseInt(document.getElementById('completedTasks').value);
    const totalTasks = parseInt(document.getElementById('totalTasks').value);
    const completionRate = (completedTasks / totalTasks) * 100;
    
    // Store enhanced progress history
    const currentDate = new Date().toLocaleDateString();
    const existingEntryIndex = progressHistory.findIndex(entry => entry.date === currentDate);
    
    const newEntry = {
        date: currentDate,
        completion: completionRate,
        completed: completedTasks,
        total: totalTasks,
        studyHours: studyHours,
        focusLevel: focusLevel,
        productivityScore: analysisData.productivity_score || (completionRate / 100)
    };
    
    if (existingEntryIndex >= 0) {
        progressHistory[existingEntryIndex] = newEntry;
    } else {
        progressHistory.push(newEntry);
        if (progressHistory.length > 7) {
            progressHistory = progressHistory.slice(-7);
        }
    }
    
    // Create all charts
    createProgressPieChart(completedTasks, totalTasks);
    createTrendLineChart();
    createWeeklyPerformanceChart();
    createStudyHoursChart();
}

function createProgressPieChart(completedTasks, totalTasks) {
    const progressCtx = document.getElementById('progressChart');
    if (!progressCtx) return;
    
    if (progressChart) {
        progressChart.destroy();
        progressChart = null;
    }
    
    try {
        progressChart = new Chart(progressCtx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [completedTasks, totalTasks - completedTasks],
                    backgroundColor: [
                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '#e9ecef'
                    ],
                    borderColor: ['#667eea', '#dee2e6'],
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1
                    }
                },
                cutout: '60%'
            }
        });
    } catch (error) {
        console.error('Error creating progress chart:', error);
    }
}

function createTrendLineChart() {
    const trendCtx = document.getElementById('trendChart');
    if (!trendCtx) return;
    
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    
    try {
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: progressHistory.map(entry => entry.date),
                datasets: [{
                    label: 'Completion %',
                    data: progressHistory.map(entry => entry.completion),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
    }
}

function createWeeklyPerformanceChart() {
    const weeklyCtx = document.getElementById('weeklyChart');
    if (!weeklyCtx) return;
    
    if (weeklyChart) {
        weeklyChart.destroy();
        weeklyChart = null;
    }
    
    try {
        weeklyChart = new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: progressHistory.map(entry => entry.date),
                datasets: [
                    {
                        label: 'Completion %',
                        data: progressHistory.map(entry => entry.completion),
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: '#667eea',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    },
                    {
                        label: 'Focus Level',
                        data: progressHistory.map(entry => (entry.focusLevel || 5) * 10),
                        backgroundColor: 'rgba(255, 193, 7, 0.8)',
                        borderColor: '#ffc107',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating weekly chart:', error);
    }
}

function createStudyHoursChart() {
    const hoursCtx = document.getElementById('hoursChart');
    if (!hoursCtx) return;
    
    if (hoursChart) {
        hoursChart.destroy();
        hoursChart = null;
    }
    
    try {
        hoursChart = new Chart(hoursCtx, {
            type: 'radar',
            data: {
                labels: progressHistory.map(entry => entry.date),
                datasets: [{
                    label: 'Study Hours',
                    data: progressHistory.map(entry => entry.studyHours || 0),
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderColor: '#28a745',
                    borderWidth: 3,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 12,
                        ticks: {
                            stepSize: 2
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating hours chart:', error);
    }
}

// System Status Functions
async function refreshSystemStatus() {
    try {
        const response = await fetch(`${BASE_URL}/system-status`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        sessionData.systemStatus = data;
        displaySystemStatus(data);
        updateAgentCount(Object.keys(data.autonomous_agents || {}).length);
        
    } catch (error) {
        console.error('System status error:', error);
        const statusContainer = document.getElementById('systemStatus');
        if (statusContainer) {
            statusContainer.innerHTML = '<div class="error">Failed to load system status. Please check if the server is running.</div>';
        }
        updateAgentCount(0);
    }
}

function displaySystemStatus(data) {
    const statusContainer = document.getElementById('systemStatus');
    if (!statusContainer) return;
    
    let html = '<div class="agents-list">';
    
    if (data.success && data.autonomous_agents) {
        Object.entries(data.autonomous_agents).forEach(([name, agent]) => {
            const statusClass = `status-${agent.status || 'idle'}`;
            html += `
                <div class="agent-item">
                    <div class="agent-name">${agent.name || name}</div>
                    <div class="agent-status-badge ${statusClass}">
                        ${agent.status || 'idle'}
                    </div>
                </div>
            `;
        });
    } else if (data.autonomous_agents) {
        Object.entries(data.autonomous_agents).forEach(([name, agent]) => {
            const statusClass = `status-${agent.status || 'idle'}`;
            html += `
                <div class="agent-item">
                    <div class="agent-name">${agent.name || name}</div>
                    <div class="agent-status-badge ${statusClass}">
                        ${agent.status || 'idle'}
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div class="agent-item">No agents found</div>';
    }
    
    html += '</div>';
    
    if (data.recent_events && data.recent_events.length > 0) {
        html += '<h6>Recent Events:</h6>';
        html += '<div class="events-list">';
        data.recent_events.forEach(event => {
            html += `<div class="event-item">${event.type} - ${event.source}</div>`;
        });
        html += '</div>';
    }
    
    statusContainer.innerHTML = html;
}

function updateAgentCount(count) {
    const agentCountElement = document.getElementById('agentCount');
    if (agentCountElement) {
        agentCountElement.textContent = count;
    }
}

async function triggerDemo() {
    try {
        showNotification('Triggering autonomous agent behavior...', 'info');
        
        const response = await fetch(`${BASE_URL}/demo`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        showNotification('Autonomous behavior triggered! Check system status.', 'success');
        
        // Refresh status after a delay
        setTimeout(refreshSystemStatus, 2000);
        
    } catch (error) {
        console.error('Demo trigger error:', error);
        showNotification('Demo trigger failed. Please check if the server is running.', 'error');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Auto-refresh system status every 30 seconds
setInterval(() => {
    if (currentUser && !document.getElementById('mainApp').classList.contains('hidden')) {
        refreshSystemStatus();
    }
}, 30000);

// Helper function to format chat responses
function formatChatResponse(responseObj) {
    if (typeof responseObj === 'string') {
        return responseObj;
    }
    
    if (responseObj.response) {
        return responseObj.response;
    }
    
    if (responseObj.message) {
        return responseObj.message;
    }
    
    // Format structured responses
    let formatted = '';
    
    Object.entries(responseObj).forEach(([key, value]) => {
        if (key === 'response' || key === 'message') {
            formatted += value + '\n\n';
        } else if (Array.isArray(value)) {
            formatted += `**${key.toUpperCase()}:**\n`;
            value.forEach((item, index) => {
                formatted += `${index + 1}. ${item}\n`;
            });
            formatted += '\n';
        } else if (typeof value === 'object') {
            formatted += `**${key.toUpperCase()}:**\n${JSON.stringify(value, null, 2)}\n\n`;
        } else {
            formatted += `**${key.toUpperCase()}:** ${value}\n\n`;
        }
    });
    
    return formatted || JSON.stringify(responseObj, null, 2);
}

// Tab Management for Notes Section
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.add('hidden'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Upload Method Toggle for Questions
function toggleQuestionUploadMethod(method) {
    const textMethod = document.getElementById('questionTextMethod');
    const fileMethod = document.getElementById('questionFileMethod');
    const methodBtns = document.querySelectorAll('#questionsTab .method-btn');
    
    // Remove active class from all buttons
    methodBtns.forEach(btn => btn.classList.remove('active'));
    
    if (method === 'text') {
        textMethod.classList.remove('hidden');
        textMethod.classList.add('active');
        fileMethod.classList.add('hidden');
        fileMethod.classList.remove('active');
        event.target.classList.add('active');
    } else if (method === 'file') {
        fileMethod.classList.remove('hidden');
        fileMethod.classList.add('active');
        textMethod.classList.add('hidden');
        textMethod.classList.remove('active');
        event.target.classList.add('active');
    }
}

// Upload Method Toggle for MCQs
function toggleMCQUploadMethod(method) {
    const textMethod = document.getElementById('mcqTextMethod');
    const fileMethod = document.getElementById('mcqFileMethod');
    const methodBtns = document.querySelectorAll('#mcqsTab .method-btn');
    
    // Remove active class from all buttons
    methodBtns.forEach(btn => btn.classList.remove('active'));
    
    if (method === 'text') {
        textMethod.classList.remove('hidden');
        textMethod.classList.add('active');
        fileMethod.classList.add('hidden');
        fileMethod.classList.remove('active');
        event.target.classList.add('active');
    } else if (method === 'file') {
        fileMethod.classList.remove('hidden');
        fileMethod.classList.add('active');
        textMethod.classList.add('hidden');
        textMethod.classList.remove('active');
        event.target.classList.add('active');
    }
}

// File Upload Handling for Questions and MCQs
document.addEventListener('DOMContentLoaded', function() {
    // Question file upload
    const questionFileInput = document.getElementById('questionFile');
    const questionFileUploadArea = document.getElementById('questionFileUploadArea');
    
    if (questionFileInput && questionFileUploadArea) {
        questionFileInput.addEventListener('change', (e) => handleQuestionFileSelect(e));
        questionFileUploadArea.addEventListener('dragover', handleDragOver);
        questionFileUploadArea.addEventListener('dragleave', handleDragLeave);
        questionFileUploadArea.addEventListener('drop', (e) => handleQuestionFileDrop(e));
    }
    
    // MCQ file upload
    const mcqFileInput = document.getElementById('mcqFile');
    const mcqFileUploadArea = document.getElementById('mcqFileUploadArea');
    
    if (mcqFileInput && mcqFileUploadArea) {
        mcqFileInput.addEventListener('change', (e) => handleMCQFileSelect(e));
        mcqFileUploadArea.addEventListener('dragover', handleDragOver);
        mcqFileUploadArea.addEventListener('dragleave', handleDragLeave);
        mcqFileUploadArea.addEventListener('drop', (e) => handleMCQFileDrop(e));
    }
    
    // Focus level slider
    const focusSlider = document.getElementById('focusLevel');
    const focusValue = document.getElementById('focusValue');
    
    if (focusSlider && focusValue) {
        focusSlider.addEventListener('input', function() {
            focusValue.textContent = this.value;
        });
    }
});

function handleQuestionFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        displayQuestionFileInfo(file);
    }
}

function handleQuestionFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.txt')) {
            document.getElementById('questionFile').files = files;
            displayQuestionFileInfo(file);
        } else {
            showNotification('Please upload only PDF or TXT files', 'warning');
        }
    }
}

function displayQuestionFileInfo(file) {
    const fileInfo = document.getElementById('questionFileInfo');
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'warning');
        return;
    }
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileIconClass = fileExtension === 'pdf' ? 'pdf' : 'txt';
    
    fileInfo.innerHTML = `
        <div class="file-details">
            <div class="file-icon ${fileIconClass}">
                <i class="fas fa-file-${fileExtension === 'pdf' ? 'pdf' : 'alt'}"></i>
            </div>
            <div class="file-meta">
                <h6>${file.name}</h6>
                <p>Size: ${fileSize} MB | Type: ${file.type || 'text/plain'}</p>
            </div>
        </div>
        <div class="file-actions">
            <button type="button" class="btn-remove" onclick="removeQuestionFile()">
                <i class="fas fa-times"></i> Remove
            </button>
        </div>
    `;
    
    fileInfo.classList.remove('hidden');
}

function removeQuestionFile() {
    const fileInput = document.getElementById('questionFile');
    const fileInfo = document.getElementById('questionFileInfo');
    
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    fileInfo.innerHTML = '';
}

function handleMCQFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        displayMCQFileInfo(file);
    }
}

function handleMCQFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.txt')) {
            document.getElementById('mcqFile').files = files;
            displayMCQFileInfo(file);
        } else {
            showNotification('Please upload only PDF or TXT files', 'warning');
        }
    }
}

function displayMCQFileInfo(file) {
    const fileInfo = document.getElementById('mcqFileInfo');
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'warning');
        return;
    }
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileIconClass = fileExtension === 'pdf' ? 'pdf' : 'txt';
    
    fileInfo.innerHTML = `
        <div class="file-details">
            <div class="file-icon ${fileIconClass}">
                <i class="fas fa-file-${fileExtension === 'pdf' ? 'pdf' : 'alt'}"></i>
            </div>
            <div class="file-meta">
                <h6>${file.name}</h6>
                <p>Size: ${fileSize} MB | Type: ${file.type || 'text/plain'}</p>
            </div>
        </div>
        <div class="file-actions">
            <button type="button" class="btn-remove" onclick="removeMCQFile()">
                <i class="fas fa-times"></i> Remove
            </button>
        </div>
    `;
    
    fileInfo.classList.remove('hidden');
}

function removeMCQFile() {
    const fileInput = document.getElementById('mcqFile');
    const fileInfo = document.getElementById('mcqFileInfo');
    
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    fileInfo.innerHTML = '';
}
function toggleUploadMethod(method) {
    const textMethod = document.getElementById('textInputMethod');
    const fileMethod = document.getElementById('fileInputMethod');
    const methodBtns = document.querySelectorAll('.method-btn');
    
    // Remove active class from all buttons
    methodBtns.forEach(btn => btn.classList.remove('active'));
    
    if (method === 'text') {
        textMethod.classList.remove('hidden');
        textMethod.classList.add('active');
        fileMethod.classList.add('hidden');
        fileMethod.classList.remove('active');
        event.target.classList.add('active');
    } else if (method === 'file') {
        fileMethod.classList.remove('hidden');
        fileMethod.classList.add('active');
        textMethod.classList.add('hidden');
        textMethod.classList.remove('active');
        event.target.classList.add('active');
    }
}

// File Upload Handling
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('notesFile');
    const fileUploadArea = document.querySelector('.file-upload-area');
    const fileInfo = document.getElementById('fileInfo');
    
    if (fileInput && fileUploadArea) {
        // File input change handler
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop handlers
        fileUploadArea.addEventListener('dragover', handleDragOver);
        fileUploadArea.addEventListener('dragleave', handleDragLeave);
        fileUploadArea.addEventListener('drop', handleFileDrop);
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        displayFileInfo(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        
        // Validate file type
        if (file.type === 'application/pdf' || file.type === 'text/plain' || file.name.endsWith('.txt')) {
            document.getElementById('notesFile').files = files;
            displayFileInfo(file);
        } else {
            showNotification('Please upload only PDF or TXT files', 'warning');
        }
    }
}

function displayFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size must be less than 10MB', 'warning');
        return;
    }
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileIconClass = fileExtension === 'pdf' ? 'pdf' : 'txt';
    
    fileInfo.innerHTML = `
        <div class="file-details">
            <div class="file-icon ${fileIconClass}">
                <i class="fas fa-file-${fileExtension === 'pdf' ? 'pdf' : 'alt'}"></i>
            </div>
            <div class="file-meta">
                <h6>${file.name}</h6>
                <p>Size: ${fileSize} MB | Type: ${file.type || 'text/plain'}</p>
            </div>
        </div>
        <div class="file-actions">
            <button type="button" class="btn-remove" onclick="removeFile()">
                <i class="fas fa-times"></i> Remove
            </button>
        </div>
    `;
    
    fileInfo.classList.remove('hidden');
}

function removeFile() {
    const fileInput = document.getElementById('notesFile');
    const fileInfo = document.getElementById('fileInfo');
    
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    fileInfo.innerHTML = '';
}

// Notes Upload Handler
async function handleNotesUpload(e) {
    e.preventDefault();
    
    const title = document.getElementById('notesTitle').value.trim();
    const subject = document.getElementById('notesSubject').value;
    const textContent = document.getElementById('notesContent').value.trim();
    const fileInput = document.getElementById('notesFile');
    const file = fileInput.files[0];
    
    // Check if we have either text content or a file
    if (!textContent && !file) {
        showNotification('Please enter text content or upload a file', 'warning');
        return;
    }
    
    try {
        showNotification('Processing and uploading notes...', 'info');
        
        let content = textContent;
        let uploadMethod = 'text';
        
        // If file is selected, read its content
        if (file) {
            uploadMethod = 'file';
            content = await readFileContent(file);
            
            if (!content) {
                showNotification('Failed to read file content', 'error');
                return;
            }
        }
        
        const requestData = {
            title: title || (file ? file.name : 'Uploaded Notes'),
            subject: subject,
            content: content,
            upload_method: uploadMethod,
            file_type: file ? file.type : 'text/plain',
            file_name: file ? file.name : null
        };
        
        const response = await fetch(`${BASE_URL}/upload-notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Store in session data
        sessionData.uploadedNotes = sessionData.uploadedNotes || [];
        sessionData.uploadedNotes.push({
            timestamp: new Date().toISOString(),
            data: data
        });
        
        displayNotesUploadResult(data);
        showNotification('Notes uploaded and processed successfully!', 'success');
        
        // Clear form
        document.getElementById('notesUploadForm').reset();
        removeFile(); // Clear file info
        
    } catch (error) {
        console.error('Notes upload error:', error);
        showNotification('Failed to upload notes. Please check if the server is running.', 'error');
    }
}

// File Content Reader
async function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                if (file.type === 'application/pdf') {
                    // For PDF files, we'll send the base64 content to backend for processing
                    const base64Content = e.target.result.split(',')[1];
                    resolve(base64Content);
                } else {
                    // For text files, read as text
                    resolve(e.target.result);
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        if (file.type === 'application/pdf') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    });
}

function displayNotesUploadResult(data) {
    const resultContainer = document.getElementById('notesUploadResult');
    const outputDiv = document.getElementById('notesUploadOutput');
    
    if (!resultContainer || !outputDiv) return;
    
    let html = '';
    
    if (data.success && data.processing_result) {
        const result = data.processing_result;
        
        html = `
            <div class="notes-result">
                <div class="result-status success">
                    <i class="fas fa-check-circle"></i>
                    <strong>Success:</strong> ${result.message || 'Notes processed successfully'}
                </div>
                
                <div class="notes-details">
                    <div class="detail-item">
                        <strong>Subject:</strong> ${result.subject || 'General'}
                    </div>
                    <div class="detail-item">
                        <strong>Content Length:</strong> ${result.content_length || 0} characters
                    </div>
                    <div class="detail-item">
                        <strong>Upload Method:</strong> ${result.upload_method === 'file' ? 'File Upload' : 'Text Input'}
                    </div>
                    ${result.file_type ? `
                        <div class="detail-item">
                            <strong>File Type:</strong> ${result.file_type}
                        </div>
                    ` : ''}
                    ${result.processed_content_preview ? `
                        <div class="detail-item">
                            <strong>Content Preview:</strong>
                            <div class="content-preview">
                                ${result.processed_content_preview}
                            </div>
                        </div>
                    ` : ''}
                    ${result.key_topics && result.key_topics.length > 0 ? `
                        <div class="detail-item">
                            <strong>Key Topics Identified:</strong>
                            <div class="topics-list">
                                ${result.key_topics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="next-steps">
                    <h5>What you can do now:</h5>
                    <ul>
                        <li>Ask questions about this content in the AI Tutor chat</li>
                        <li>Generate practice questions using the Questions tab</li>
                        <li>Create MCQs for self-testing using the MCQs tab</li>
                        ${result.upload_method === 'file' ? '<li>Upload more files to expand your knowledge base</li>' : ''}
                    </ul>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="result-status error">
                <i class="fas fa-exclamation-circle"></i>
                <strong>Error:</strong> ${data.processing_result?.message || 'Failed to process notes'}
            </div>
        `;
    }
    
    outputDiv.innerHTML = html;
    showElement('notesUploadResult');
}

// Questions Generation Handler
async function handleQuestionsGeneration(e) {
    e.preventDefault();
    
    const textContent = document.getElementById('questionContent').value.trim();
    const fileInput = document.getElementById('questionFile');
    const file = fileInput.files[0];
    const type = document.getElementById('questionType').value;
    const numQuestions = parseInt(document.getElementById('numQuestions').value);
    
    // Check if we have either text content or a file
    if (!textContent && !file) {
        showNotification('Please enter text content or upload a file', 'warning');
        return;
    }
    
    try {
        showNotification('Generating questions using AI...', 'info');
        
        let content = textContent;
        
        // If file is selected, read its content
        if (file) {
            content = await readFileContent(file);
            
            if (!content) {
                showNotification('Failed to read file content', 'error');
                return;
            }
        }
        
        const requestData = {
            content: content,
            type: type,
            num_questions: numQuestions,
            upload_method: file ? 'file' : 'text',
            file_type: file ? file.type : 'text/plain',
            file_name: file ? file.name : null
        };
        
        const response = await fetch(`${BASE_URL}/generate-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        displayQuestionsResult(data);
        showNotification(`Generated ${data.total_generated || 0} questions successfully!`, 'success');
        
    } catch (error) {
        console.error('Questions generation error:', error);
        showNotification('Failed to generate questions. Please check if the server is running.', 'error');
    }
}

function displayQuestionsResult(data) {
    const resultContainer = document.getElementById('questionsResult');
    const outputDiv = document.getElementById('questionsOutput');
    
    if (!resultContainer || !outputDiv) return;
    
    let html = '';
    
    if (data.success && data.questions && data.questions.length > 0) {
        html = `
            <div class="questions-summary">
                <p><strong>Generated ${data.total_generated} ${data.type} questions</strong></p>
            </div>
            <div class="questions-list">
        `;
        
        data.questions.forEach((question, index) => {
            html += `
                <div class="question-item">
                    <div class="question-header">
                        <span class="question-number">Q${index + 1}</span>
                        <span class="question-type">${question.type || 'Unknown'}</span>
                        <span class="difficulty-badge difficulty-${question.difficulty || 'medium'}">
                            ${question.difficulty || 'Medium'}
                        </span>
                    </div>
                    
                    <div class="question-text">
                        ${question.question || 'No question text'}
                    </div>
                    
                    ${question.options && question.options.length > 0 ? `
                        <div class="question-options">
                            ${question.options.map((option, i) => `
                                <div class="option ${question.correct_answer === String.fromCharCode(65 + i) ? 'correct' : ''}">
                                    ${String.fromCharCode(65 + i)}) ${option}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${question.correct_answer ? `
                        <div class="answer-section">
                            <strong>Answer:</strong> ${question.correct_answer}
                        </div>
                    ` : ''}
                    
                    ${question.explanation ? `
                        <div class="explanation-section">
                            <strong>Explanation:</strong> ${question.explanation}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html = `
            <div class="result-status error">
                <i class="fas fa-exclamation-circle"></i>
                <strong>Error:</strong> Failed to generate questions or no questions returned
            </div>
        `;
    }
    
    outputDiv.innerHTML = html;
    showElement('questionsResult');
}

// MCQs Generation Handler
async function handleMCQsGeneration(e) {
    e.preventDefault();
    
    const textContent = document.getElementById('mcqContent').value.trim();
    const fileInput = document.getElementById('mcqFile');
    const file = fileInput.files[0];
    const numMcqs = parseInt(document.getElementById('numMcqs').value);
    
    // Check if we have either text content or a file
    if (!textContent && !file) {
        showNotification('Please enter text content or upload a file', 'warning');
        return;
    }
    
    try {
        showNotification('Generating MCQs using AI...', 'info');
        
        let content = textContent;
        
        // If file is selected, read its content
        if (file) {
            content = await readFileContent(file);
            
            if (!content) {
                showNotification('Failed to read file content', 'error');
                return;
            }
        }
        
        const requestData = {
            content: content,
            type: 'mcq',
            num_questions: numMcqs,
            upload_method: file ? 'file' : 'text',
            file_type: file ? file.type : 'text/plain',
            file_name: file ? file.name : null
        };
        
        const response = await fetch(`${BASE_URL}/generate-mcqs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        displayMCQsResult(data);
        showNotification(`Generated ${data.total_generated || 0} MCQs successfully!`, 'success');
        
    } catch (error) {
        console.error('MCQs generation error:', error);
        showNotification('Failed to generate MCQs. Please check if the server is running.', 'error');
    }
}

function displayMCQsResult(data) {
    const resultContainer = document.getElementById('mcqsResult');
    const outputDiv = document.getElementById('mcqsOutput');
    
    if (!resultContainer || !outputDiv) return;
    
    let html = '';
    
    if (data.success && data.questions && data.questions.length > 0) {
        html = `
            <div class="mcqs-summary">
                <p><strong>Generated ${data.total_generated} Multiple Choice Questions</strong></p>
            </div>
            <div class="mcqs-list">
        `;
        
        data.questions.forEach((question, index) => {
            html += `
                <div class="mcq-item">
                    <div class="mcq-header">
                        <span class="question-number">MCQ ${index + 1}</span>
                        <span class="difficulty-badge difficulty-${question.difficulty || 'medium'}">
                            ${question.difficulty || 'Medium'}
                        </span>
                    </div>
                    
                    <div class="mcq-question">
                        ${question.question || 'No question text'}
                    </div>
                    
                    ${question.options && question.options.length > 0 ? `
                        <div class="mcq-options">
                            ${question.options.map((option, i) => `
                                <div class="mcq-option ${question.correct_answer === String.fromCharCode(65 + i) ? 'correct-answer' : ''}">
                                    <span class="option-letter">${String.fromCharCode(65 + i)}</span>
                                    <span class="option-text">${option}</span>
                                    ${question.correct_answer === String.fromCharCode(65 + i) ? '<i class="fas fa-check correct-icon"></i>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${question.explanation ? `
                        <div class="mcq-explanation">
                            <strong>Explanation:</strong> ${question.explanation}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html = `
            <div class="result-status error">
                <i class="fas fa-exclamation-circle"></i>
                <strong>Error:</strong> Failed to generate MCQs or no MCQs returned
            </div>
        `;
    }
    
    outputDiv.innerHTML = html;
    showElement('mcqsResult');
}

// Enhanced Progress Display Functions
function displayProgressSummary(analysisData) {
    const summaryDiv = document.getElementById('progressSummary');
    if (!summaryDiv) return;
    
    const completedTasks = parseInt(document.getElementById('completedTasks').value);
    const totalTasks = parseInt(document.getElementById('totalTasks').value);
    const completionRate = (completedTasks / totalTasks) * 100;
    
    let statusClass = 'danger';
    let statusText = 'Needs Improvement';
    let statusIcon = 'fas fa-exclamation-triangle';
    
    if (completionRate >= 80) {
        statusClass = 'success';
        statusText = 'Excellent Progress';
        statusIcon = 'fas fa-trophy';
    } else if (completionRate >= 60) {
        statusClass = 'warning';
        statusText = 'Good Progress';
        statusIcon = 'fas fa-thumbs-up';
    } else if (completionRate >= 40) {
        statusClass = 'info';
        statusText = 'Making Progress';
        statusIcon = 'fas fa-chart-line';
    }
    
    let html = `
        <div class="progress-summary">
            <div class="summary-header">
                <i class="${statusIcon}"></i>
                <h5>Progress Summary</h5>
            </div>
            
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${completedTasks}/${totalTasks}</div>
                    <div class="stat-label">Tasks Completed</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-value">${completionRate.toFixed(1)}%</div>
                    <div class="stat-label">Completion Rate</div>
                </div>
                
                <div class="stat-item">
                    <div class="stat-value status-${statusClass}">${statusText}</div>
                    <div class="stat-label">Status</div>
                </div>
            </div>
        </div>
    `;
    
    // Add recommendations if available from enhanced analysis
    if (analysisData && analysisData.recommendations && analysisData.recommendations.length > 0) {
        html += `
            <div class="recommendations">
                <h6><i class="fas fa-lightbulb"></i> Recommendations</h6>
                <ul>
                    ${analysisData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    summaryDiv.innerHTML = html;
}

function displayAIInsights(insights, analysisData) {
    const insightsDiv = document.getElementById('aiInsights');
    if (!insightsDiv) return;
    
    let html = `
        <div class="ai-insights">
            <div class="insights-header">
                <i class="fas fa-robot"></i>
                <h5>AI Analysis & Insights</h5>
            </div>
    `;
    
    // Display enhanced analysis data
    if (analysisData) {
        html += `
            <div class="analysis-details">
                <div class="detail-row">
                    <strong>Productivity Score:</strong> 
                    <span class="score">${analysisData.productivity_score || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> 
                    <span class="status-${analysisData.status || 'unknown'}">${analysisData.status || 'Unknown'}</span>
                </div>
                ${analysisData.insight ? `
                    <div class="detail-row">
                        <strong>Insight:</strong> ${analysisData.insight}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Display autonomous insights if available
    if (insights && Object.keys(insights).length > 0) {
        html += `
            <div class="autonomous-insights">
                <h6>Autonomous Agent Insights:</h6>
                <pre>${JSON.stringify(insights, null, 2)}</pre>
            </div>
        `;
    } else {
        html += `
            <div class="autonomous-status">
                <p><i class="fas fa-cogs"></i> Autonomous agents are monitoring your progress in the background.</p>
            </div>
        `;
    }
    
    html += '</div>';
    insightsDiv.innerHTML = html;
}
function displayEnhancedProgressSummary(analysisData, studyHours, focusLevel) {
    const summaryDiv = document.getElementById('progressSummary');
    if (!summaryDiv) return;
    
    const completedTasks = parseInt(document.getElementById('completedTasks').value);
    const totalTasks = parseInt(document.getElementById('totalTasks').value);
    const completionRate = (completedTasks / totalTasks) * 100;
    
    let statusClass = 'needs-improvement';
    let statusText = 'Needs Improvement';
    let statusIcon = 'fas fa-exclamation-triangle';
    
    if (completionRate >= 80) {
        statusClass = 'excellent';
        statusText = 'Excellent Progress';
        statusIcon = 'fas fa-trophy';
    } else if (completionRate >= 60) {
        statusClass = 'good';
        statusText = 'Good Progress';
        statusIcon = 'fas fa-thumbs-up';
    } else if (completionRate >= 40) {
        statusClass = 'average';
        statusText = 'Making Progress';
        statusIcon = 'fas fa-chart-line';
    }
    
    let html = `
        <div class="enhanced-progress-summary">
            <div class="summary-header-enhanced">
                <i class="${statusIcon}"></i>
                <h5>Comprehensive Analysis</h5>
            </div>
            
            <div class="summary-metrics">
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-label">Overall Status</div>
                        <div class="metric-value status-${statusClass}">${statusText}</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Productivity Score</div>
                        <div class="metric-value">${(analysisData.productivity_score || completionRate/100).toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="metric-row">
                    <div class="metric-item">
                        <div class="metric-label">Study Efficiency</div>
                        <div class="metric-value">${studyHours > 0 ? (completedTasks / studyHours).toFixed(1) : 'N/A'} tasks/hour</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Focus Quality</div>
                        <div class="metric-value focus-${getFocusClass(focusLevel)}">${getFocusText(focusLevel)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add recommendations if available from enhanced analysis
    if (analysisData && analysisData.recommendations && analysisData.recommendations.length > 0) {
        html += `
            <div class="enhanced-recommendations">
                <h6><i class="fas fa-lightbulb"></i> Personalized Recommendations</h6>
                <div class="recommendations-grid">
                    ${analysisData.recommendations.map((rec, index) => `
                        <div class="recommendation-card">
                            <div class="rec-icon">
                                <i class="fas fa-${getRecommendationIcon(index)}"></i>
                            </div>
                            <div class="rec-text">${rec}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    summaryDiv.innerHTML = html;
}

function getFocusClass(focusLevel) {
    if (focusLevel >= 8) return 'excellent';
    if (focusLevel >= 6) return 'good';
    if (focusLevel >= 4) return 'average';
    return 'poor';
}

function getFocusText(focusLevel) {
    if (focusLevel >= 8) return 'Excellent';
    if (focusLevel >= 6) return 'Good';
    if (focusLevel >= 4) return 'Average';
    return 'Needs Work';
}

function getRecommendationIcon(index) {
    const icons = ['target', 'clock', 'brain', 'heart', 'star', 'rocket'];
    return icons[index % icons.length];
}

function displayEnhancedAIInsights(insights, analysisData) {
    const insightsDiv = document.getElementById('aiInsights');
    if (!insightsDiv) return;
    
    let html = `
        <div class="enhanced-ai-insights">
            <div class="insights-header-enhanced">
                <i class="fas fa-robot"></i>
                <h5>AI-Powered Insights</h5>
            </div>
    `;
    
    // Display enhanced analysis data
    if (analysisData) {
        html += `
            <div class="insights-cards">
                <div class="insight-card productivity">
                    <div class="insight-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="insight-content">
                        <h6>Productivity Analysis</h6>
                        <p>Your current productivity score is <strong>${(analysisData.productivity_score || 0).toFixed(2)}</strong></p>
                        <p class="insight-detail">${analysisData.insight || 'Keep up the good work!'}</p>
                    </div>
                </div>
                
                <div class="insight-card performance">
                    <div class="insight-icon">
                        <i class="fas fa-trending-up"></i>
                    </div>
                    <div class="insight-content">
                        <h6>Performance Trend</h6>
                        <p>Status: <span class="status-${analysisData.status || 'unknown'}">${analysisData.status || 'Unknown'}</span></p>
                        <p class="insight-detail">Based on your recent activity patterns</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Display autonomous insights if available
    if (insights && Object.keys(insights).length > 0) {
        html += `
            <div class="autonomous-insights-enhanced">
                <h6><i class="fas fa-cogs"></i> Autonomous Agent Insights</h6>
                <div class="insights-data">
                    <pre>${JSON.stringify(insights, null, 2)}</pre>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="autonomous-status-enhanced">
                <div class="status-indicator">
                    <div class="status-dot active"></div>
                    <p><i class="fas fa-cogs"></i> Autonomous agents are actively monitoring your progress</p>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    insightsDiv.innerHTML = html;
}

function checkAndDisplayAchievements(analysisData, studyHours, focusLevel) {
    const achievementsDiv = document.getElementById('achievementBadges');
    if (!achievementsDiv) return;
    
    const completedTasks = parseInt(document.getElementById('completedTasks').value);
    const totalTasks = parseInt(document.getElementById('totalTasks').value);
    const completionRate = (completedTasks / totalTasks) * 100;
    
    const achievements = [];
    
    // Check for various achievements
    if (completionRate >= 100) {
        achievements.push({
            title: 'Task Master',
            description: 'Completed all tasks!',
            icon: 'fas fa-crown',
            color: 'gold'
        });
    }
    
    if (completionRate >= 80) {
        achievements.push({
            title: 'High Achiever',
            description: '80%+ completion rate',
            icon: 'fas fa-star',
            color: 'blue'
        });
    }
    
    if (studyHours >= 8) {
        achievements.push({
            title: 'Study Marathon',
            description: '8+ hours of study',
            icon: 'fas fa-clock',
            color: 'green'
        });
    }
    
    if (focusLevel >= 9) {
        achievements.push({
            title: 'Laser Focus',
            description: 'Exceptional focus level',
            icon: 'fas fa-bullseye',
            color: 'purple'
        });
    }
    
    if (progressHistory.length >= 7) {
        achievements.push({
            title: 'Consistency King',
            description: '7 days of tracking',
            icon: 'fas fa-calendar-check',
            color: 'orange'
        });
    }
    
    if (achievements.length > 0) {
        let html = '';
        achievements.forEach(achievement => {
            html += `
                <div class="achievement-badge ${achievement.color}">
                    <div class="badge-icon">
                        <i class="${achievement.icon}"></i>
                    </div>
                    <div class="badge-content">
                        <div class="badge-title">${achievement.title}</div>
                        <div class="badge-description">${achievement.description}</div>
                    </div>
                </div>
            `;
        });
        
        achievementsDiv.querySelector('.badges-container').innerHTML = html;
        achievementsDiv.classList.remove('hidden');
    } else {
        achievementsDiv.classList.add('hidden');
    }
}