/**
 * SkillAlign - Complete Application
 * Local testing version with admin SME management
 * 30 questions per assessment, random selection
 */

// ==========================================
// APPLICATION STATE
// ==========================================
const state = {
    currentPage: 'home',
    user: null,
    selectedTopic: null,
    currentQuestions: [],
    userAnswers: [],
    currentQuestionIndex: 0,
    assessmentStartTime: null,
    lastResult: null,
    showAddSMEForm: false,
    showAddTopicForm: false,
    showAddQuestionForm: false,
    activeAdminTab: 'dashboard'
};

const app = {};

// ==========================================
// INITIALIZATION
// ==========================================
function init() {
    console.log('🚀 Initializing SkillAlign...');
    const session = SharePointAuth.getSession();
    if (session) {
        state.user = session;
        navigateByRole();
    } else {
        navigateTo('home');
    }
}

function navigateByRole() {
    if (!state.user) {
        navigateTo('home');
        return;
    }
    
    if (state.user.role === 'admin') {
        navigateTo('admin-dashboard');
    } else if (state.user.role === 'sme') {
        navigateTo('sme-dashboard');
    } else {
        navigateTo('user-dashboard');
    }
}

function navigateTo(page) {
    state.currentPage = page;
    render();
}

app.navigateTo = navigateTo;

function showLoading(message = 'Loading...') {
    const root = document.getElementById('root');
    root.innerHTML = `<div class="loading">${message}</div>`;
}

// ==========================================
// MAIN RENDER FUNCTION
// ==========================================
async function render() {
    const root = document.getElementById('root');
    let html = '';
    
    switch (state.currentPage) {
        case 'home':
            html = renderHome();
            break;
        case 'login':
            html = renderLogin();
            break;
        case 'signup':
            html = renderSignup();
            break;
        case 'user-dashboard':
            html = await renderUserDashboard();
            break;
        case 'sme-dashboard':
            html = await renderSMEDashboard();
            break;
        case 'admin-dashboard':
            html = await renderAdminDashboard();
            break;
        case 'assessment':
            html = renderAssessment();
            break;
        case 'result':
            html = renderResult();
            break;
        default:
            html = renderHome();
    }
    
    root.innerHTML = html;
    
    if (state.currentPage === 'login' || state.currentPage === 'signup') {
        attachFormListeners();
    }
}

// ==========================================
// HOME PAGE
// ==========================================
function renderHome() {
    return `
        <div class="home-container">
            <div class="home-header">
                <h1 class="home-title">SkillAlign</h1>
                <p class="home-subtitle">Assess Your Testing Skills</p>
            </div>
            
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">📝</div>
                    <h3>30 Questions</h3>
                    <p>Random selection from question pool for fair assessment</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <h3>Multiple Topics</h3>
                    <p>Manual, Automation, Performance, and API Testing</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>Instant Results</h3>
                    <p>Get detailed feedback and track your progress</p>
                </div>
            </div>
            
            <div class="home-cta">
                <button class="cta-button" onclick="app.navigateTo('login')">
                    Get Started →
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// LOGIN PAGE
// ==========================================
function renderLogin() {
    return `
        <div class="auth-container">
            <div class="auth-box">
                <h1 class="auth-title">Welcome Back</h1>
                <p class="auth-subtitle">Login to SkillAlign</p>
                
                <form class="auth-form" id="loginForm">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Enter your password">
                    </div>
                    <button type="submit" class="auth-button">Login</button>
                </form>
                
                <div class="auth-footer">
                    Don't have an account? 
                    <span class="link" onclick="app.navigateTo('signup')">Sign Up</span>
                </div>
                
                <div class="demo-credentials">
                    <div class="demo-title">Test Credentials:</div>
                    <div>👤 User: user@skillalign.com / user123</div>
                    <div>🔧 SME: sme@skillalign.com / sme123</div>
                    <div>👑 Admin: admin@skillalign.com / admin123</div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// SIGNUP PAGE
// ==========================================
function renderSignup() {
    return `
        <div class="auth-container">
            <div class="auth-box">
                <h1 class="auth-title">Create Account</h1>
                <p class="auth-subtitle">Join SkillAlign (User role only)</p>
                
                <form class="auth-form" id="signupForm">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="name" required placeholder="Enter your name">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" required placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" required placeholder="Min 6 characters">
                    </div>
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" name="confirmPassword" required placeholder="Confirm password">
                    </div>
                    <button type="submit" class="auth-button">Create Account</button>
                </form>
                
                <div class="auth-footer">
                    Already have an account? 
                    <span class="link" onclick="app.navigateTo('login')">Login</span>
                </div>
                
                <div class="demo-credentials">
                    <div class="demo-title">Note:</div>
                    <div>SME access must be granted by admin</div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// AUTH HANDLERS
// ==========================================
function attachFormListeners() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    showLoading('Logging in...');
    
    const result = await SharePointAuth.login(email, password);
    
    if (result.success) {
        state.user = result.user;
        navigateByRole();
    } else {
        alert(result.error);
        navigateTo('login');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    showLoading('Creating account...');
    
    const result = await SharePointAuth.register({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    });
    
    if (result.success) {
        alert(result.message);
        navigateTo('login');
    } else {
        alert(result.error);
        navigateTo('signup');
    }
}

function logout() {
    SharePointAuth.logout();
    state.user = null;
    state.currentQuestions = [];
    state.userAnswers = [];
    navigateTo('home');
}

app.logout = logout;

// ==========================================
// USER DASHBOARD
// ==========================================
async function renderUserDashboard() {
    const topics = await SharePointData.loadTopics();
    const assessments = await SharePointData.getUserAssessments();
    
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div>
                    <h1>Welcome, ${state.user.name}!</h1>
                    <p>Select a topic to start your 30-question assessment</p>
                </div>
                <button class="logout-button" onclick="app.logout()">Logout</button>
            </div>
            
            <div class="topics-section">
                <h2>Available Topics</h2>
                <div class="topics-grid">
                    ${topics.map(topic => `
                        <div class="topic-card" onclick="app.startRandomAssessment('${topic.name}')">
                            <div class="topic-icon">${topic.icon}</div>
                            <h3>${topic.name}</h3>
                            <p>${topic.description}</p>
                            <p class="topic-count">${topic.totalQuestions} questions available</p>
                            <button class="start-button">Start Assessment</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${assessments.length > 0 ? `
            <div class="history-section">
                <h2>Your Assessment History</h2>
                <div class="history-list">
                    ${assessments.slice(0, 5).map(a => `
                        <div class="history-item">
                            <div>
                                <strong>${a.topic}</strong>
                                <span class="date">${new Date(a.test_date).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span class="score">${a.score}%</span>
                                <span class="badge badge-${a.passed ? 'success' : 'danger'}">
                                    ${a.passed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

async function startRandomAssessment(topicName) {
    showLoading('Loading random 30 questions...');
    
    state.selectedTopic = topicName;
    const questions = await SharePointData.loadRandomQuestions(topicName, 30);
    
    if (!questions || questions.length === 0) {
        alert('No questions available for this topic. Please contact your administrator.');
        navigateTo('user-dashboard');
        return;
    }
    
    state.currentQuestions = questions;
    state.userAnswers = new Array(questions.length).fill(null);
    state.currentQuestionIndex = 0;
    state.assessmentStartTime = Date.now();
    
    navigateTo('assessment');
}

app.startRandomAssessment = startRandomAssessment;

// ==========================================
// SME DASHBOARD
// ==========================================
async function renderSMEDashboard() {
    const topics = await SharePointData.loadTopics();
    
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div>
                    <h1>📚 SME Dashboard</h1>
                    <p>Manage Topics and Questions</p>
                </div>
                <button class="logout-button" onclick="app.logout()">Logout</button>
            </div>
            
            <div class="sme-actions">
                <button class="action-btn" onclick="app.showAddTopicForm()">
                    ➕ Add New Topic
                </button>
                <button class="action-btn" onclick="app.showAddQuestionForm()">
                    ❓ Add New Question
                </button>
                <button class="action-btn" onclick="app.navigateTo('user-dashboard')">
                    📝 Take Assessment
                </button>
            </div>
            
            <div class="topics-summary">
                <h2>Topics Overview</h2>
                <div class="topics-list">
                    ${topics.map(topic => `
                        <div class="topic-summary-card">
                            <div class="topic-header">
                                <span class="topic-icon">${topic.icon}</span>
                                <h3>${topic.name}</h3>
                            </div>
                            <p class="question-count">${topic.totalQuestions} questions</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${state.showAddTopicForm ? renderAddTopicForm() : ''}
            ${state.showAddQuestionForm ? renderAddQuestionForm(topics) : ''}
        </div>
    `;
}

// ==========================================
// SME - ADD TOPIC
// ==========================================
function showAddTopicForm() {
    state.showAddTopicForm = true;
    render();
}

app.showAddTopicForm = showAddTopicForm;

function hideAddTopicForm() {
    state.showAddTopicForm = false;
    render();
}

app.hideAddTopicForm = hideAddTopicForm;

function renderAddTopicForm() {
    return `
        <div class="modal-overlay" onclick="app.hideAddTopicForm()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h2>Add New Topic</h2>
                <form onsubmit="app.handleAddTopic(event)">
                    <div class="form-group">
                        <label>Topic Name *</label>
                        <input type="text" name="topicName" required placeholder="e.g., Security Testing">
                    </div>
                    <div class="form-group">
                        <label>Topic Icon (Emoji) *</label>
                        <input type="text" name="topicIcon" required placeholder="e.g., 🔒" maxlength="2">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="3" placeholder="Brief description"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="app.hideAddTopicForm()">Cancel</button>
                        <button type="submit" class="primary">Add Topic</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function handleAddTopic(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    showLoading('Adding topic...');
    
    const result = await SharePointData.addTopic({
        topicName: formData.get('topicName'),
        topicIcon: formData.get('topicIcon'),
        description: formData.get('description')
    });
    
    if (result.success) {
        alert('Topic added successfully!');
        state.showAddTopicForm = false;
        navigateTo('sme-dashboard');
    } else {
        alert('Error: ' + result.error);
        navigateTo('sme-dashboard');
    }
}

app.handleAddTopic = handleAddTopic;

// ==========================================
// SME - ADD QUESTION
// ==========================================
function showAddQuestionForm() {
    state.showAddQuestionForm = true;
    render();
}

app.showAddQuestionForm = showAddQuestionForm;

function hideAddQuestionForm() {
    state.showAddQuestionForm = false;
    render();
}

app.hideAddQuestionForm = hideAddQuestionForm;

function renderAddQuestionForm(topics) {
    return `
        <div class="modal-overlay" onclick="app.hideAddQuestionForm()">
            <div class="modal-content large" onclick="event.stopPropagation()">
                <h2>Add New Question</h2>
                <form onsubmit="app.handleAddQuestion(event)">
                    <div class="form-group">
                        <label>Topic *</label>
                        <select name="topic" required>
                            <option value="">Select Topic</option>
                            ${topics.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Question Text *</label>
                        <textarea name="questionText" required rows="3" placeholder="Enter your question"></textarea>
                    </div>
                    
                    <div class="options-grid">
                        <div class="form-group">
                            <label>Option 1 *</label>
                            <input type="text" name="option1" required>
                        </div>
                        <div class="form-group">
                            <label>Option 2 *</label>
                            <input type="text" name="option2" required>
                        </div>
                        <div class="form-group">
                            <label>Option 3 *</label>
                            <input type="text" name="option3" required>
                        </div>
                        <div class="form-group">
                            <label>Option 4 *</label>
                            <input type="text" name="option4" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Question Type *</label>
                        <select name="questionType" onchange="app.updateCorrectAnswerOptions(this.value)" required>
                            <option value="single">Single Choice</option>
                            <option value="multiple">Multiple Choice</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="correctAnswerGroup">
                        <label>Correct Answer *</label>
                        <div id="singleChoiceOptions">
                            <select name="correctAnswer" required>
                                <option value="0">Option 1</option>
                                <option value="1">Option 2</option>
                                <option value="2">Option 3</option>
                                <option value="3">Option 4</option>
                            </select>
                        </div>
                        <div id="multipleChoiceOptions" style="display:none;">
                            <label><input type="checkbox" name="correctMultiple" value="0"> Option 1</label>
                            <label><input type="checkbox" name="correctMultiple" value="1"> Option 2</label>
                            <label><input type="checkbox" name="correctMultiple" value="2"> Option 3</label>
                            <label><input type="checkbox" name="correctMultiple" value="3"> Option 4</label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Difficulty</label>
                        <select name="difficulty">
                            <option value="Easy">Easy</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" onclick="app.hideAddQuestionForm()">Cancel</button>
                        <button type="submit" class="primary">Add Question</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function updateCorrectAnswerOptions(questionType) {
    const singleOptions = document.getElementById('singleChoiceOptions');
    const multipleOptions = document.getElementById('multipleChoiceOptions');
    
    if (questionType === 'single') {
        singleOptions.style.display = 'block';
        multipleOptions.style.display = 'none';
    } else {
        singleOptions.style.display = 'none';
        multipleOptions.style.display = 'block';
    }
}

app.updateCorrectAnswerOptions = updateCorrectAnswerOptions;

async function handleAddQuestion(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    let correctAnswer;
    const questionType = formData.get('questionType');
    
    if (questionType === 'single') {
        correctAnswer = formData.get('correctAnswer');
    } else {
        const checked = Array.from(document.querySelectorAll('input[name="correctMultiple"]:checked'));
        correctAnswer = checked.map(cb => cb.value).join(',');
        
        if (!correctAnswer) {
            alert('Please select at least one correct answer');
            return;
        }
    }
    
    showLoading('Adding question...');
    
    const result = await SharePointData.addQuestion({
        topic: formData.get('topic'),
        questionText: formData.get('questionText'),
        option1: formData.get('option1'),
        option2: formData.get('option2'),
        option3: formData.get('option3'),
        option4: formData.get('option4'),
        correctAnswer: correctAnswer,
        difficulty: formData.get('difficulty')
    });
    
    if (result.success) {
        alert('Question added successfully! Question ID: ' + result.data.questionId);
        state.showAddQuestionForm = false;
        navigateTo('sme-dashboard');
    } else {
        alert('Error: ' + result.error);
        navigateTo('sme-dashboard');
    }
}

app.handleAddQuestion = handleAddQuestion;

// ==========================================
// ADMIN DASHBOARD
// ==========================================
async function renderAdminDashboard() {
    const assessments = await SharePointData.getAllAssessments();
    const users = await SharePointData.getAllUsers();
    const topics = await SharePointData.loadTopics();
    
    const totalQuestions = topics.reduce((sum, t) => sum + t.totalQuestions, 0);
    const passedCount = assessments.filter(a => a.passed).length;
    const failedCount = assessments.length - passedCount;
    const passRate = assessments.length > 0 ? Math.round((passedCount / assessments.length) * 100) : 0;
    
    let content = '';
    
    if (state.activeAdminTab === 'dashboard') {
        content = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total Users</h4>
                    <p class="stat-value">${users.length}</p>
                </div>
                <div class="stat-card">
                    <h4>Total Assessments</h4>
                    <p class="stat-value">${assessments.length}</p>
                </div>
                <div class="stat-card">
                    <h4>Topics Available</h4>
                    <p class="stat-value">${topics.length}</p>
                </div>
                <div class="stat-card">
                    <h4>Total Questions</h4>
                    <p class="stat-value">${totalQuestions}</p>
                </div>
                <div class="stat-card success">
                    <h4>Passed</h4>
                    <p class="stat-value">${passedCount}</p>
                </div>
                <div class="stat-card danger">
                    <h4>Failed</h4>
                    <p class="stat-value">${failedCount}</p>
                </div>
                <div class="stat-card info">
                    <h4>Pass Rate</h4>
                    <p class="stat-value">${passRate}%</p>
                </div>
            </div>
            
            ${assessments.length > 0 ? `
            <div class="recent-activity">
                <h3>Recent Activity</h3>
                <table class="activity-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Topic</th>
                            <th>Score</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assessments.slice(0, 10).map(a => `
                            <tr>
                                <td>${a.user_name}</td>
                                <td>${a.topic}</td>
                                <td>${a.score}%</td>
                                <td><span class="badge badge-${a.passed ? 'success' : 'danger'}">
                                    ${a.passed ? 'PASSED' : 'FAILED'}
                                </span></td>
                                <td>${new Date(a.test_date).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : '<p>No assessment data yet.</p>'}
        `;
    } else if (state.activeAdminTab === 'sme-management') {
        content = await renderSMEManagement();
    }
    
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div>
                    <h1>👑 Admin Dashboard</h1>
                    <p>Manage SkillAlign</p>
                </div>
                <button class="logout-button" onclick="app.logout()">Logout</button>
            </div>
            
            <div class="admin-tabs">
                <button class="admin-tab ${state.activeAdminTab === 'dashboard' ? 'active' : ''}" 
                        onclick="app.switchAdminTab('dashboard')">
                    📊 Dashboard
                </button>
                <button class="admin-tab ${state.activeAdminTab === 'sme-management' ? 'active' : ''}" 
                        onclick="app.switchAdminTab('sme-management')">
                    👥 SME Management
                </button>
            </div>
            
            ${content}
            
            ${state.showAddSMEForm ? renderAddSMEForm(topics) : ''}
        </div>
    `;
}

function switchAdminTab(tab) {
    state.activeAdminTab = tab;
    render();
}

app.switchAdminTab = switchAdminTab;

// ==========================================
// ADMIN - SME MANAGEMENT
// ==========================================
async function renderSMEManagement() {
    const result = await SMEManagement.getAllSMEs();
    const smes = result.data || [];
    const stats = await SMEManagement.getSMEStatistics();
    
    const activeSMEs = smes.filter(s => s.isActive).length;
    const inactiveSMEs = smes.length - activeSMEs;
    const totalQuestions = stats.data ? stats.data.reduce((sum, s) => sum + s.questionsAdded, 0) : 0;
    
    return `
        <div class="sme-management-section">
            <div class="sme-stats-grid">
                <div class="sme-stat-card">
                    <h4>Total SMEs</h4>
                    <p class="stat-value">${smes.length}</p>
                </div>
                <div class="sme-stat-card">
                    <h4>Active SMEs</h4>
                    <p class="stat-value">${activeSMEs}</p>
                </div>
                <div class="sme-stat-card">
                    <h4>Inactive SMEs</h4>
                    <p class="stat-value">${inactiveSMEs}</p>
                </div>
                <div class="sme-stat-card">
                    <h4>Questions Added</h4>
                    <p class="stat-value">${totalQuestions}</p>
                </div>
            </div>
            
            <div class="sme-management-header">
                <h2>Subject Matter Experts</h2>
                <button class="add-sme-btn" onclick="app.showAddSMEForm()">
                    ➕ Add New SME
                </button>
            </div>
            
            ${smes.length > 0 ? `
            <table class="sme-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Assigned Topics</th>
                        <th>Questions Added</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${stats.data ? stats.data.map(sme => `
                        <tr>
                            <td>${sme.name}</td>
                            <td>${sme.email}</td>
                            <td>${sme.assignedTopics.length > 0 ? sme.assignedTopics.join(', ') : 'None'}</td>
                            <td>${sme.questionsAdded}</td>
                            <td>
                                <span class="sme-status ${sme.isActive ? 'active' : 'inactive'}">
                                    ${sme.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                <div class="sme-actions">
                                    ${sme.isActive ? `
                                        <button class="sme-action-btn deactivate" 
                                                onclick="app.toggleSMEStatus(${sme.id}, false)">
                                            Deactivate
                                        </button>
                                    ` : `
                                        <button class="sme-action-btn activate" 
                                                onclick="app.toggleSMEStatus(${sme.id}, true)">
                                            Activate
                                        </button>
                                    `}
                                    <button class="sme-action-btn delete" 
                                            onclick="app.deleteSME(${sme.id})">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('') : ''}
                </tbody>
            </table>
            ` : '<p>No SMEs added yet. Click "Add New SME" to get started.</p>'}
        </div>
    `;
}

function showAddSMEForm() {
    state.showAddSMEForm = true;
    render();
}

app.showAddSMEForm = showAddSMEForm;

function hideAddSMEForm() {
    state.showAddSMEForm = false;
    render();
}

app.hideAddSMEForm = hideAddSMEForm;

function renderAddSMEForm(topics) {
    return `
        <div class="modal-overlay" onclick="app.hideAddSMEForm()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <h2>Add New SME</h2>
                <form onsubmit="app.handleAddSME(event)">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="name" required placeholder="Enter SME name">
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" required placeholder="Enter SME email">
                    </div>
                    <div class="form-group">
                        <label>Temporary Password *</label>
                        <input type="password" name="password" required placeholder="Min 6 characters">
                    </div>
                    <div class="form-group">
                        <label>Assign Topics (Optional)</label>
                        <div class="topics-selector">
                            ${topics.map(topic => `
                                <label class="topic-checkbox">
                                    <input type="checkbox" name="topics" value="${topic.name}">
                                    ${topic.icon} ${topic.name}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="app.hideAddSMEForm()">Cancel</button>
                        <button type="submit" class="primary">Add SME & Send Email</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function handleAddSME(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topics"]:checked'))
        .map(cb => cb.value);
    
    showLoading('Adding SME...');
    
    const result = await SMEManagement.addSME({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        topics: selectedTopics
    });
    
    if (result.success) {
        alert(result.message);
        state.showAddSMEForm = false;
        navigateTo('admin-dashboard');
    } else {
        alert('Error: ' + result.error);
        navigateTo('admin-dashboard');
    }
}

app.handleAddSME = handleAddSME;

async function toggleSMEStatus(smeId, isActive) {
    if (!confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this SME?`)) {
        return;
    }
    
    showLoading('Updating SME status...');
    
    const result = await SMEManagement.updateSMEStatus(smeId, isActive);
    
    if (result.success) {
        alert(result.message);
        navigateTo('admin-dashboard');
    } else {
        alert('Error: ' + result.error);
        navigateTo('admin-dashboard');
    }
}

app.toggleSMEStatus = toggleSMEStatus;

async function deleteSME(smeId) {
    if (!confirm('Are you sure you want to delete this SME? This action cannot be undone.')) {
        return;
    }
    
    showLoading('Deleting SME...');
    
    const result = await SMEManagement.deleteSME(smeId);
    
    if (result.success) {
        alert(result.message);
        navigateTo('admin-dashboard');
    } else {
        alert('Error: ' + result.error);
        navigateTo('admin-dashboard');
    }
}

app.deleteSME = deleteSME;

// ==========================================
// ASSESSMENT PAGE
// ==========================================
function renderAssessment() {
    const question = state.currentQuestions[state.currentQuestionIndex];
    const progress = ((state.currentQuestionIndex + 1) / state.currentQuestions.length) * 100;
    
    return `
        <div class="assessment-container">
            <div class="assessment-header">
                <h2>${state.selectedTopic}</h2>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <p>Question ${state.currentQuestionIndex + 1} of ${state.currentQuestions.length}</p>
            </div>
            
            <div class="question-card">
                <h3 class="question-text">${question.question}</h3>
                ${question.isMultipleAnswer ? '<p class="multiple-note">⚠️ Multiple answers may be correct</p>' : ''}
                
                <div class="options-list">
                    ${question.options.map((option, index) => `
                        <label class="option-label">
                            <input 
                                type="${question.isMultipleAnswer ? 'checkbox' : 'radio'}" 
                                name="answer" 
                                value="${index}"
                                ${state.userAnswers[state.currentQuestionIndex] && 
                                  state.userAnswers[state.currentQuestionIndex].includes(index.toString()) ? 'checked' : ''}
                                onchange="app.saveAnswer(${index}, ${question.isMultipleAnswer})"
                            >
                            <span class="option-text">${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="assessment-navigation">
                ${state.currentQuestionIndex > 0 ? 
                    `<button class="nav-button" onclick="app.previousQuestion()">← Previous</button>` : 
                    '<div></div>'
                }
                
                ${state.currentQuestionIndex < state.currentQuestions.length - 1 ? 
                    `<button class="nav-button primary" onclick="app.nextQuestion()">Next →</button>` : 
                    `<button class="nav-button primary" onclick="app.submitAssessment()">Submit Assessment</button>`
                }
            </div>
        </div>
    `;
}

function saveAnswer(answerIndex, isMultiple) {
    if (isMultiple) {
        const checked = Array.from(document.querySelectorAll('input[name="answer"]:checked'));
        state.userAnswers[state.currentQuestionIndex] = checked.map(cb => cb.value).join(',');
    } else {
        state.userAnswers[state.currentQuestionIndex] = answerIndex.toString();
    }
}

app.saveAnswer = saveAnswer;

function previousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        render();
    }
}

app.previousQuestion = previousQuestion;

function nextQuestion() {
    if (state.currentQuestionIndex < state.currentQuestions.length - 1) {
        state.currentQuestionIndex++;
        render();
    }
}

app.nextQuestion = nextQuestion;

async function submitAssessment() {
    const unanswered = state.userAnswers.filter(a => a === null).length;
    
    if (unanswered > 0) {
        if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
            return;
        }
    }
    
    showLoading('Calculating results...');
    
    let correctCount = 0;
    state.currentQuestions.forEach((q, i) => {
        const userAnswer = state.userAnswers[i];
        if (userAnswer === q.correct) {
            correctCount++;
        }
    });
    
    const score = Math.round((correctCount / state.currentQuestions.length) * 100);
    const passed = score >= SHAREPOINT_CONFIG.app.passingScore;
    const timeTaken = Math.round((Date.now() - state.assessmentStartTime) / 1000 / 60);
    
    const result = await SharePointData.saveAssessment({
        topic: state.selectedTopic,
        score: score,
        correctAnswers: correctCount,
        totalQuestions: state.currentQuestions.length,
        passed: passed,
        timeTaken: timeTaken,
        answers: state.userAnswers,
        questionIds: state.currentQuestions.map(q => q.id)
    });
    
    state.lastResult = {
        score,
        passed,
        correctCount,
        totalQuestions: state.currentQuestions.length,
        timeTaken
    };
    
    navigateTo('result');
}

app.submitAssessment = submitAssessment;

// ==========================================
// RESULT PAGE
// ==========================================
function renderResult() {
    const result = state.lastResult;
    
    return `
        <div class="result-container">
            <div class="result-header">
                <div class="result-icon">${result.passed ? '🎉' : '💪'}</div>
                <h1>${result.passed ? 'Congratulations!' : 'Keep Learning!'}</h1>
                <p class="result-subtitle">
                    ${result.passed ? 'You passed the assessment!' : 'You can try again!'}
                </p>
            </div>
            
            <div class="result-score">
                <div class="score-circle ${result.passed ? 'passed' : 'failed'}">
                    <span class="score-value">${result.score}%</span>
                </div>
            </div>
            
            <div class="result-details">
                <div class="detail-item">
                    <span class="detail-label">Correct Answers</span>
                    <span class="detail-value">${result.correctCount} / ${result.totalQuestions}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Time Taken</span>
                    <span class="detail-value">${result.timeTaken} minutes</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status</span>
                    <span class="badge badge-${result.passed ? 'success' : 'danger'}">
                        ${result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                </div>
            </div>
            
            <div class="result-actions">
                <button class="action-button" onclick="app.navigateByRole()">
                    Back to Dashboard
                </button>
            </div>
        </div>
    `;
}

app.navigateByRole = navigateByRole;

// ==========================================
// INITIALIZE ON PAGE LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', init);

console.log('✅ SkillAlign application loaded - Complete version with SME Management');
