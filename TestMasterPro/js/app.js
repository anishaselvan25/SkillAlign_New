/**
 * TestMaster Pro - Main Application (Supabase Production Version)
 * Software Testing Assessment Platform
 */

// Application State
let state = {
    currentPage: 'home',
    currentUser: null,
    formData: { email: '', password: '', name: '', confirmPassword: '' },
    selectedTopic: '',
    selectedSet: '',
    currentQuestions: [],
    userAnswers: {},
    currentQuestionIndex: 0,
    testResult: null
};

// Initialize data structure
let data = {
    questions: {},
    users: [],
    assessments: []
};

/**
 * Navigate to a different page
 */
function navigateTo(page) {
    state.currentPage = page;
    if (page === 'home') {
        state.currentUser = null;
        state.selectedTopic = '';
        state.selectedSet = '';
        state.currentQuestions = [];
        state.userAnswers = {};
        state.currentQuestionIndex = 0;
        state.testResult = null;
    }
    render();
}

/**
 * Handle login - Supabase version
 */
async function handleLogin(e) {
    e.preventDefault();
    
    showLoading('Logging in...');
    
    const result = await SupabaseAuth.login(
        state.formData.email,
        state.formData.password
    );
    
    hideLoading();
    
    if (result.success) {
        state.currentUser = result.user;
        state.formData = { email: '', password: '', name: '', confirmPassword: '' };
        navigateTo(result.user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
    } else {
        alert(result.error);
    }
}

/**
 * Handle signup - Supabase version
 */
async function handleSignup(e) {
    e.preventDefault();
    
    if (state.formData.password !== state.formData.confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (state.formData.password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    showLoading('Creating account...');
    
    const result = await SupabaseAuth.register({
        name: state.formData.name,
        email: state.formData.email,
        password: state.formData.password,
        confirmPassword: state.formData.confirmPassword
    });
    
    hideLoading();
    
    if (result.success) {
        alert('Account created successfully! Please login.');
        state.formData = { email: '', password: '', name: '', confirmPassword: '' };
        navigateTo('login');
    } else {
        alert(result.error);
    }
}

/**
 * Handle form input changes
 */
function handleInputChange(e) {
    state.formData[e.target.name] = e.target.value;
}

/**
 * Select topic
 */
function selectTopic(topic) {
    state.selectedTopic = topic;
    render();
}

/**
 * Select question set
 */
function selectSet(set) {
    state.selectedSet = set;
    render();
}

/**
 * Start assessment
 */
function startAssessment() {
    state.currentQuestions = data.questions[state.selectedTopic]?.[state.selectedSet] || [];
    
    if (state.currentQuestions.length === 0) {
        alert('No questions available for this topic and set.');
        return;
    }
    
    state.userAnswers = {};
    state.currentQuestionIndex = 0;
    navigateTo('assessment');
}

/**
 * Handle answer selection - supports both single and multiple choice
 */
function handleAnswerSelect(questionId, answerIndex, isMultiple) {
    if (isMultiple) {
        // Multiple choice - use array
        if (!state.userAnswers[questionId]) {
            state.userAnswers[questionId] = [];
        }
        
        const answers = state.userAnswers[questionId];
        const index = answers.indexOf(answerIndex);
        
        if (index > -1) {
            answers.splice(index, 1);
        } else {
            answers.push(answerIndex);
        }
    } else {
        // Single choice
        state.userAnswers[questionId] = answerIndex;
    }
    render();
}

/**
 * Navigate to next question
 */
function nextQuestion() {
    if (state.currentQuestionIndex < state.currentQuestions.length - 1) {
        state.currentQuestionIndex++;
        render();
    }
}

/**
 * Navigate to previous question
 */
function previousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        render();
    }
}

/**
 * Submit assessment - Supabase version
 */
async function submitAssessment() {
    let correctCount = 0;
    
    // Check answers
    state.currentQuestions.forEach(q => {
        const userAnswer = state.userAnswers[q.id];
        const correctAnswer = q.correct;
        
        if (q.isMultipleAnswer) {
            // Multiple choice - compare arrays
            const correct = correctAnswer.split(',').map(Number).sort();
            const user = (userAnswer || []).sort();
            
            if (JSON.stringify(correct) === JSON.stringify(user)) {
                correctCount++;
            }
        } else {
            // Single choice - compare numbers
            if (userAnswer === Number(correctAnswer)) {
                correctCount++;
            }
        }
    });
    
    const score = Math.round((correctCount / state.currentQuestions.length) * 100);
    const passed = score >= 60;
    
    const assessmentData = {
        topic: state.selectedTopic,
        set: state.selectedSet,
        score: score,
        correctAnswers: correctCount,
        totalQuestions: state.currentQuestions.length,
        passed: passed,
        date: new Date().toISOString(),
        answers: state.userAnswers
    };
    
    showLoading('Saving results...');
    
    const result = await SupabaseData.saveAssessment(assessmentData);
    
    hideLoading();
    
    if (result.success) {
        state.testResult = assessmentData;
        navigateTo('result');
    } else {
        alert('Failed to save assessment. Please try again.');
    }
}

/**
 * Logout
 */
function logout() {
    SupabaseAuth.logout();
    state.currentUser = null;
    navigateTo('home');
}

/**
 * Get topic icon
 */
function getTopicIcon(topic) {
    const icons = {
        'Manual Testing': '📝',
        'Automation Testing': '🤖',
        'Performance Testing': '⚡',
        'API Testing': '🔌',
        'Security Testing': '🔒'
    };
    return icons[topic] || '📚';
}

/**
 * Render the application
 */
async function render() {
    const root = document.getElementById('root');
    
    switch (state.currentPage) {
        case 'home':
            root.innerHTML = renderHome();
            break;
        case 'login':
            root.innerHTML = renderLogin();
            attachFormListeners();
            break;
        case 'signup':
            root.innerHTML = renderSignup();
            attachFormListeners();
            break;
        case 'user-dashboard':
            root.innerHTML = renderUserDashboard();
            break;
        case 'admin-dashboard':
            root.innerHTML = await renderAdminDashboard();
            break;
        case 'assessment':
            root.innerHTML = renderAssessment();
            break;
        case 'result':
            root.innerHTML = renderResult();
            break;
    }
}

/**
 * Render home page
 */
function renderHome() {
    return `
        <div class="home-container">
            <div class="home-header">
                <h1 class="home-title">TestMaster Pro</h1>
                <p class="home-subtitle">Software Testing Assessment Platform</p>
            </div>
            
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">📝</div>
                    <h3>Comprehensive Testing</h3>
                    <p>240 questions across 4 testing domains</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <h3>Instant Results</h3>
                    <p>Get immediate feedback on your performance</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>Track Progress</h3>
                    <p>Monitor your improvement over time</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🏆</div>
                    <h3>Multiple Choice</h3>
                    <p>Realistic exam-style questions</p>
                </div>
            </div>
            
            <div class="home-cta">
                <button class="cta-button" onclick="app.navigateTo('login')">Get Started</button>
            </div>
        </div>
    `;
}

/**
 * Render login page
 */
function renderLogin() {
    return `
        <div class="auth-container">
            <div class="auth-box">
                <h2 class="auth-title">Welcome Back</h2>
                <p class="auth-subtitle">Login to continue your assessment</p>
                
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="your@email.com" required
                               value="${state.formData.email}">
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Enter password" required
                               value="${state.formData.password}">
                    </div>
                    
                    <button type="submit" class="auth-button">Sign In</button>
                </form>
                
                <div class="auth-footer">
                    <p>Don't have an account? <span class="link" onclick="app.navigateTo('signup')">Sign Up</span></p>
                    <p><span class="link" onclick="app.navigateTo('home')">← Back to Home</span></p>
                </div>
                
                <div class="demo-credentials">
                    <p><strong>Test Accounts:</strong></p>
                    <p>Admin: admin@testmaster.com / admin123</p>
                    <p>User: user@testmaster.com / user123</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render signup page
 */
function renderSignup() {
    return `
        <div class="auth-container">
            <div class="auth-box">
                <h2 class="auth-title">Create Account</h2>
                <p class="auth-subtitle">Start your testing assessment journey</p>
                
                <form id="signupForm" class="auth-form">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" name="name" placeholder="John Doe" required
                               value="${state.formData.name}">
                    </div>
                    
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="your@email.com" required
                               value="${state.formData.email}">
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Minimum 8 characters" required
                               value="${state.formData.password}" minlength="8">
                    </div>
                    
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" name="confirmPassword" placeholder="Re-enter password" required
                               value="${state.formData.confirmPassword}">
                    </div>
                    
                    <button type="submit" class="auth-button">Create Account</button>
                </form>
                
                <div class="auth-footer">
                    <p>Already have an account? <span class="link" onclick="app.navigateTo('login')">Sign In</span></p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render user dashboard
 */
function renderUserDashboard() {
    const topics = data.questions ? Object.keys(data.questions) : [];
    
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div>
                    <h1>Welcome, ${state.currentUser.full_name || state.currentUser.name}</h1>
                    <p>Select a topic to start your assessment</p>
                </div>
                <button class="logout-button" onclick="app.logout()">Logout</button>
            </div>
            
            ${!state.selectedTopic ? `
                <div class="topics-grid">
                    ${topics.map(topic => `
                        <div class="topic-card" onclick="app.selectTopic('${topic}')">
                            <div class="topic-icon">${getTopicIcon(topic)}</div>
                            <h3>${topic}</h3>
                            <p>20 questions per set</p>
                            <p>3 sets available</p>
                        </div>
                    `).join('')}
                </div>
            ` : !state.selectedSet ? `
                <div class="set-selection">
                    <button class="back-button" onclick="app.selectTopic('')">← Back to Topics</button>
                    <h2>${getTopicIcon(state.selectedTopic)} ${state.selectedTopic}</h2>
                    <p>Select a question set:</p>
                    
                    <div class="sets-grid">
                        ${['set1', 'set2', 'set3'].map((set, index) => `
                            <div class="set-card" onclick="app.selectSet('${set}')">
                                <h3>Set ${index + 1}</h3>
                                <p>20 Questions</p>
                                <p>⏱️ ~15-20 minutes</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <div class="start-assessment">
                    <button class="back-button" onclick="app.selectSet('')">← Back to Sets</button>
                    <div class="assessment-info">
                        <h2>${state.selectedTopic}</h2>
                        <h3>${state.selectedSet.toUpperCase()}</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-icon">📝</span>
                                <span>20 Questions</span>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">⏱️</span>
                                <span>15-20 minutes</span>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">🎯</span>
                                <span>60% to pass</span>
                            </div>
                            <div class="info-item">
                                <span class="info-icon">✅</span>
                                <span>Multiple choice included</span>
                            </div>
                        </div>
                        <button class="start-button" onclick="app.startAssessment()">Start Assessment</button>
                    </div>
                </div>
            `}
        </div>
    `;
}

/**
 * Render admin dashboard with full analytics
 */
async function renderAdminDashboard() {
    // Load all data
    showLoading('Loading analytics...');
    
    const allAssessments = await SupabaseData.getAllAssessments();
    const allUsers = await SupabaseData.getAllUsers();
    const topics = data.questions ? Object.keys(data.questions) : [];
    
    hideLoading();
    
    // Calculate statistics
    const totalUsers = allUsers.length;
    const totalAssessments = allAssessments.length;
    const passedCount = allAssessments.filter(a => a.passed).length;
    const failedCount = totalAssessments - passedCount;
    const passRate = totalAssessments > 0 ? Math.round((passedCount / totalAssessments) * 100) : 0;
    
    // Get total questions
    let totalQuestions = 0;
    Object.values(data.questions || {}).forEach(topic => {
        Object.values(topic).forEach(set => {
            totalQuestions += set.length;
        });
    });
    
    // Topic-wise statistics
    const topicStats = {};
    topics.forEach(topic => {
        const topicAssessments = allAssessments.filter(a => a.topic === topic);
        topicStats[topic] = {
            total: topicAssessments.length,
            passed: topicAssessments.filter(a => a.passed).length,
            failed: topicAssessments.filter(a => !a.passed).length,
            avgScore: topicAssessments.length > 0 
                ? Math.round(topicAssessments.reduce((sum, a) => sum + a.score, 0) / topicAssessments.length)
                : 0
        };
    });
    
    // Top scorers (top 10)
    const topScorers = allAssessments
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(a => ({
            name: a.user_name,
            email: a.user_email,
            topic: a.topic,
            score: a.score,
            date: new Date(a.test_date).toLocaleDateString()
        }));
    
    // Recent activity (last 10)
    const recentActivity = allAssessments
        .sort((a, b) => new Date(b.test_date) - new Date(a.test_date))
        .slice(0, 10);
    
    return `
        <div class="dashboard-container">
            <div class="dashboard-header">
                <div>
                    <h1>📊 Admin Dashboard</h1>
                    <p>Complete System Analytics</p>
                </div>
                <button class="logout-button" onclick="app.logout()">Logout</button>
            </div>
            
            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-value">${totalUsers}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-content">
                        <div class="stat-value">${totalAssessments}</div>
                        <div class="stat-label">Assessments Taken</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-content">
                        <div class="stat-value">${topics.length}</div>
                        <div class="stat-label">Topics Available</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">❓</div>
                    <div class="stat-content">
                        <div class="stat-value">${totalQuestions}</div>
                        <div class="stat-label">Total Questions</div>
                    </div>
                </div>
                
                <div class="stat-card success">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-value">${passedCount}</div>
                        <div class="stat-label">Passed</div>
                    </div>
                </div>
                
                <div class="stat-card danger">
                    <div class="stat-icon">❌</div>
                    <div class="stat-content">
                        <div class="stat-value">${failedCount}</div>
                        <div class="stat-label">Failed</div>
                    </div>
                </div>
                
                <div class="stat-card info">
                    <div class="stat-icon">📈</div>
                    <div class="stat-content">
                        <div class="stat-value">${passRate}%</div>
                        <div class="stat-label">Pass Rate</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-content">
                        <div class="stat-value">${topScorers.length > 0 ? topScorers[0].score + '%' : 'N/A'}</div>
                        <div class="stat-label">Top Score</div>
                    </div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="charts-section">
                <div class="chart-card">
                    <h3>📊 Pass/Fail Distribution</h3>
                    <div class="chart-container">
                        <div class="pie-chart">
                            <div class="pie-slice passed" style="--percentage: ${passRate}">
                                <span>${passedCount}</span>
                            </div>
                            <div class="chart-legend">
                                <div class="legend-item">
                                    <span class="legend-color passed"></span>
                                    <span>Passed: ${passedCount} (${passRate}%)</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-color failed"></span>
                                    <span>Failed: ${failedCount} (${100 - passRate}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-card">
                    <h3>📈 Topic Performance</h3>
                    <div class="bar-chart">
                        ${topics.map(topic => {
                            const stats = topicStats[topic];
                            const percentage = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0;
                            return `
                                <div class="bar-item">
                                    <div class="bar-label">${topic}</div>
                                    <div class="bar-container">
                                        <div class="bar-fill" style="width: ${percentage}%">
                                            <span>${stats.avgScore}%</span>
                                        </div>
                                    </div>
                                    <div class="bar-stats">${stats.passed}/${stats.total}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Top Scorers Leaderboard -->
            <div class="admin-section">
                <h3>🏆 Top Scorers Leaderboard</h3>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Topic</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topScorers.length > 0 ? topScorers.map((scorer, index) => `
                                <tr>
                                    <td>
                                        <span class="rank-badge rank-${index + 1}">
                                            ${index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : index + 1}
                                        </span>
                                    </td>
                                    <td>${scorer.name}</td>
                                    <td>${scorer.email}</td>
                                    <td>${scorer.topic}</td>
                                    <td><span class="score-badge ${scorer.score >= 90 ? 'excellent' : scorer.score >= 70 ? 'good' : 'average'}">${scorer.score}%</span></td>
                                    <td>${scorer.date}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="6" style="text-align: center;">No data available</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="admin-section">
                <h3>🕒 Recent Activity</h3>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Topic</th>
                                <th>Set</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentActivity.length > 0 ? recentActivity.map(activity => `
                                <tr>
                                    <td>${activity.user_name}</td>
                                    <td>${activity.topic}</td>
                                    <td>${activity.question_set.toUpperCase()}</td>
                                    <td>${activity.score}%</td>
                                    <td>
                                        <span class="status-badge ${activity.passed ? 'status-pass' : 'status-fail'}">
                                            ${activity.passed ? '✅ Passed' : '❌ Failed'}
                                        </span>
                                    </td>
                                    <td>${new Date(activity.test_date).toLocaleString()}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="6" style="text-align: center;">No recent activity</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Topic-wise Breakdown -->
            <div class="admin-section">
                <h3>📚 Topic-wise Breakdown</h3>
                <div class="topics-breakdown">
                    ${topics.map(topic => {
                        const stats = topicStats[topic];
                        return `
                            <div class="topic-breakdown-card">
                                <h4>${getTopicIcon(topic)} ${topic}</h4>
                                <div class="breakdown-stats">
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">Total Attempts:</span>
                                        <span class="breakdown-value">${stats.total}</span>
                                    </div>
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">Passed:</span>
                                        <span class="breakdown-value success">${stats.passed}</span>
                                    </div>
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">Failed:</span>
                                        <span class="breakdown-value danger">${stats.failed}</span>
                                    </div>
                                    <div class="breakdown-item">
                                        <span class="breakdown-label">Avg Score:</span>
                                        <span class="breakdown-value">${stats.avgScore}%</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Quick Links -->
            <div class="admin-section">
                <h3>🔗 Quick Actions</h3>
                <div class="quick-actions">
                    <a href="https://supabase.com/dashboard/project/tpeetgghfkobnuyjamgt/editor" target="_blank" class="action-link">
                        <span>🗄️</span>
                        <span>View Database</span>
                    </a>
                    <a href="https://supabase.com/dashboard/project/tpeetgghfkobnuyjamgt/editor?table=users" target="_blank" class="action-link">
                        <span>👥</span>
                        <span>Manage Users</span>
                    </a>
                    <a href="https://supabase.com/dashboard/project/tpeetgghfkobnuyjamgt/editor?table=questions" target="_blank" class="action-link">
                        <span>❓</span>
                        <span>Manage Questions</span>
                    </a>
                    <a href="https://supabase.com/dashboard/project/tpeetgghfkobnuyjamgt/editor?table=assessments" target="_blank" class="action-link">
                        <span>📊</span>
                        <span>View All Results</span>
                    </a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render assessment page
 */
function renderAssessment() {
    const currentQuestion = state.currentQuestions[state.currentQuestionIndex];
    const progress = ((state.currentQuestionIndex + 1) / state.currentQuestions.length) * 100;
    
    // Check if this is a multiple choice question
    const isMultiple = currentQuestion.isMultipleAnswer || (typeof currentQuestion.correct === 'string' && currentQuestion.correct.includes(','));
    
    return `
        <div class="assessment-container">
            <div class="assessment-header">
                <h2>${state.selectedTopic}</h2>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <p>Question ${state.currentQuestionIndex + 1} of ${state.currentQuestions.length}</p>
            </div>
            
            <div class="question-card ${isMultiple ? 'multiple-choice' : ''}">
                ${isMultiple ? '<div class="multiple-indicator">📌 Multiple Choice: Select ALL correct answers</div>' : ''}
                <h3 class="question-text">${currentQuestion.question}</h3>
                
                <div class="options-container">
                    ${currentQuestion.options.map((option, index) => {
                        const userAnswer = state.userAnswers[currentQuestion.id];
                        const isSelected = isMultiple 
                            ? (userAnswer || []).includes(index)
                            : userAnswer === index;
                        
                        return `
                            <div class="option ${isSelected ? 'selected' : ''}"
                                 onclick="app.handleAnswerSelect(${currentQuestion.id}, ${index}, ${isMultiple})">
                                <div class="option-${isMultiple ? 'checkbox' : 'radio'}">
                                    ${isSelected ? `<div class="${isMultiple ? 'checkbox-check' : 'radio-dot'}"></div>` : ''}
                                </div>
                                <div class="option-text">${option}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="navigation-buttons">
                <button class="nav-button" 
                        onclick="app.previousQuestion()" 
                        ${state.currentQuestionIndex === 0 ? 'disabled' : ''}>
                    ← Previous
                </button>
                
                ${state.currentQuestionIndex === state.currentQuestions.length - 1 ? `
                    <button class="submit-button" onclick="app.submitAssessment()">
                        Submit Assessment
                    </button>
                ` : `
                    <button class="nav-button" onclick="app.nextQuestion()">
                        Next →
                    </button>
                `}
            </div>
        </div>
    `;
}

/**
 * Render result page
 */
function renderResult() {
    const result = state.testResult;
    const percentage = result.score;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (percentage / 100) * circumference;
    
    return `
        <div class="result-container">
            <div class="result-card">
                <h2>Assessment Complete!</h2>
                
                <div class="score-circle">
                    <svg width="140" height="140">
                        <circle cx="70" cy="70" r="54" fill="none" stroke="#e5e7eb" stroke-width="12"/>
                        <circle cx="70" cy="70" r="54" fill="none" 
                                stroke="${result.passed ? '#10b981' : '#ef4444'}" 
                                stroke-width="12"
                                stroke-dasharray="${circumference}"
                                stroke-dashoffset="${offset}"
                                stroke-linecap="round"
                                transform="rotate(-90 70 70)"/>
                    </svg>
                    <div class="score-text">
                        <div class="score-number">${result.score}%</div>
                        <div class="score-label">${result.passed ? 'Passed' : 'Failed'}</div>
                    </div>
                </div>
                
                <div class="result-details">
                    <div class="detail-item">
                        <span class="detail-label">Topic:</span>
                        <span class="detail-value">${result.topic}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Question Set:</span>
                        <span class="detail-value">${result.set.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Correct Answers:</span>
                        <span class="detail-value">${result.correctAnswers} / ${result.totalQuestions}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="badge ${result.passed ? 'badge-success' : 'badge-danger'}">
                            ${result.passed ? 'Passed' : 'Failed'}
                        </span>
                    </div>
                </div>
                
                <div class="result-actions">
                    <button class="action-button" onclick="app.navigateTo('user-dashboard')">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Attach form listeners
 */
function attachFormListeners() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        loginForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', handleInputChange);
        });
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        signupForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', handleInputChange);
        });
    }
}

/**
 * Show loading overlay
 */
function showLoading(message) {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
    `;
    overlay.innerHTML = `
        <div style="width: 50px; height: 50px; border: 4px solid #fff; border-top-color: transparent; 
                    border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 20px; font-size: 18px;">${message}</p>
    `;
    document.body.appendChild(overlay);
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.remove();
}

/**
 * Initialize app on page load
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    // Load questions from Supabase
    if (typeof SupabaseData !== 'undefined') {
        showLoading('Loading questions...');
        const questions = await SupabaseData.loadQuestions();
        hideLoading();
        
        if (questions) {
            data.questions = questions;
            console.log('✅ Questions loaded from Supabase:', Object.keys(questions).length, 'topics');
        } else {
            console.error('❌ Failed to load questions from Supabase');
            alert('Failed to load questions. Please check your internet connection and refresh the page.');
        }
    } else {
        console.error('❌ SupabaseData not defined. Make sure Supabase scripts are loaded.');
        alert('Supabase not initialized. Please check your configuration.');
    }
    
    // Check authentication
    if (typeof SupabaseAuth !== 'undefined') {
        const session = SupabaseAuth.getSession();
        if (session) {
            state.currentUser = session;
            navigateTo(session.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
            return;
        }
    }
    
    render();
});

// Expose functions to window for onclick handlers
window.app = {
    navigateTo,
    handleLogin,
    handleSignup,
    selectTopic,
    selectSet,
    startAssessment,
    handleAnswerSelect,
    nextQuestion,
    previousQuestion,
    submitAssessment,
    logout
};