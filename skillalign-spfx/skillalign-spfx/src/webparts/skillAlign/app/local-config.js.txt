/**
 * SkillAlign - Local Storage Configuration
 * For local testing on Mac before SharePoint deployment
 */

const LOCAL_CONFIG = {
    appName: 'SkillAlign',
    version: '1.0.0',
    questionsPerAssessment: 30,  // Changed from 60 to 30
    passingScore: 60,  // 60% to pass
    
    storage: {
        prefix: 'skillalign_',
        keys: {
            users: 'users',
            topics: 'topics',
            questions: 'questions',
            assessments: 'assessments',
            currentUser: 'current_user'
        }
    },
    
    roles: {
        USER: 'user',
        SME: 'sme',
        ADMIN: 'admin'
    }
};

/**
 * LocalStorage Helper Functions
 */
const LocalStorage = {
    
    /**
     * Get data from localStorage
     */
    get: function(key) {
        try {
            const data = localStorage.getItem(LOCAL_CONFIG.storage.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('LocalStorage get error:', error);
            return null;
        }
    },
    
    /**
     * Set data to localStorage
     */
    set: function(key, value) {
        try {
            localStorage.setItem(LOCAL_CONFIG.storage.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('LocalStorage set error:', error);
            return false;
        }
    },
    
    /**
     * Remove data from localStorage
     */
    remove: function(key) {
        try {
            localStorage.removeItem(LOCAL_CONFIG.storage.prefix + key);
            return true;
        } catch (error) {
            console.error('LocalStorage remove error:', error);
            return false;
        }
    },
    
    /**
     * Clear all app data
     */
    clearAll: function() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(LOCAL_CONFIG.storage.prefix)) {
                localStorage.removeItem(key);
            }
        });
        console.log('✅ All SkillAlign data cleared');
    },
    
    /**
     * Initialize with sample data
     */
    initializeSampleData: function() {
        // Check if already initialized
        if (this.get(LOCAL_CONFIG.storage.keys.users)) {
            console.log('✅ Sample data already exists');
            return;
        }
        
        console.log('📦 Initializing sample data...');
        
        // Create sample users
        const users = [
            {
                id: 1,
                email: 'admin@skillalign.com',
                password: btoa('admin123'),  // Base64 encoded
                name: 'Admin User',
                role: 'admin',
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                email: 'sme@skillalign.com',
                password: btoa('sme123'),
                name: 'SME User',
                role: 'sme',
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                email: 'user@skillalign.com',
                password: btoa('user123'),
                name: 'Test User',
                role: 'user',
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        
        // Create sample topics
        const topics = [
            {
                id: 1,
                name: 'Manual Testing',
                icon: '📝',
                description: 'Software testing performed manually without automation',
                isActive: true,
                totalQuestions: 0
            },
            {
                id: 2,
                name: 'Automation Testing',
                icon: '🤖',
                description: 'Automated software testing using tools and scripts',
                isActive: true,
                totalQuestions: 0
            },
            {
                id: 3,
                name: 'Performance Testing',
                icon: '⚡',
                description: 'Testing system performance under various conditions',
                isActive: true,
                totalQuestions: 0
            },
            {
                id: 4,
                name: 'API Testing',
                icon: '🔌',
                description: 'Testing application programming interfaces',
                isActive: true,
                totalQuestions: 0
            }
        ];
        
        // Create sample questions (10 per topic for testing)
        const questions = this.generateSampleQuestions();
        
        // Save to localStorage
        this.set(LOCAL_CONFIG.storage.keys.users, users);
        this.set(LOCAL_CONFIG.storage.keys.topics, topics);
        this.set(LOCAL_CONFIG.storage.keys.questions, questions);
        this.set(LOCAL_CONFIG.storage.keys.assessments, []);
        
        console.log('✅ Sample data initialized');
        console.log(`   - ${users.length} users`);
        console.log(`   - ${topics.length} topics`);
        console.log(`   - ${questions.length} questions`);
    },
    
    /**
     * Generate sample questions
     */
    generateSampleQuestions: function() {
        const questions = [];
        let questionId = 1;
        
        // Manual Testing Questions (40 questions)
        for (let i = 1; i <= 40; i++) {
            questions.push({
                id: questionId++,
                topic: 'Manual Testing',
                question: `Manual Testing Question ${i}: What is the purpose of ${i % 5 === 0 ? 'regression testing' : 'smoke testing'}?`,
                options: [
                    'To verify new functionality',
                    'To ensure existing functionality still works',
                    'To test performance',
                    'To test security'
                ],
                correctAnswer: i % 3 === 0 ? '0,1' : '1',  // Some multiple choice
                isMultipleChoice: i % 3 === 0,
                difficulty: i % 5 === 0 ? 'Hard' : (i % 3 === 0 ? 'Medium' : 'Easy'),
                isActive: true,
                createdBy: 'System',
                createdAt: new Date().toISOString()
            });
        }
        
        // Automation Testing Questions (40 questions)
        for (let i = 1; i <= 40; i++) {
            questions.push({
                id: questionId++,
                topic: 'Automation Testing',
                question: `Automation Testing Question ${i}: Which tool is commonly used for ${i % 4 === 0 ? 'web automation' : 'API automation'}?`,
                options: [
                    'Selenium',
                    'JMeter',
                    'Postman',
                    'All of the above'
                ],
                correctAnswer: i % 4 === 0 ? '0' : (i % 5 === 0 ? '3' : '2'),
                isMultipleChoice: false,
                difficulty: i % 4 === 0 ? 'Hard' : (i % 2 === 0 ? 'Medium' : 'Easy'),
                isActive: true,
                createdBy: 'System',
                createdAt: new Date().toISOString()
            });
        }
        
        // Performance Testing Questions (40 questions)
        for (let i = 1; i <= 40; i++) {
            questions.push({
                id: questionId++,
                topic: 'Performance Testing',
                question: `Performance Testing Question ${i}: What metric is measured in ${i % 3 === 0 ? 'load testing' : 'stress testing'}?`,
                options: [
                    'Response time',
                    'Throughput',
                    'Resource utilization',
                    'All of the above'
                ],
                correctAnswer: i % 5 === 0 ? '0,1,2' : '3',  // Some multiple choice
                isMultipleChoice: i % 5 === 0,
                difficulty: i % 6 === 0 ? 'Hard' : (i % 3 === 0 ? 'Medium' : 'Easy'),
                isActive: true,
                createdBy: 'System',
                createdAt: new Date().toISOString()
            });
        }
        
        // API Testing Questions (40 questions)
        for (let i = 1; i <= 40; i++) {
            questions.push({
                id: questionId++,
                topic: 'API Testing',
                question: `API Testing Question ${i}: Which HTTP method is used for ${i % 4 === 0 ? 'creating' : 'updating'} resources?`,
                options: [
                    'GET',
                    'POST',
                    'PUT',
                    'DELETE'
                ],
                correctAnswer: i % 4 === 0 ? '1' : '2',
                isMultipleChoice: false,
                difficulty: i % 5 === 0 ? 'Hard' : (i % 2 === 0 ? 'Medium' : 'Easy'),
                isActive: true,
                createdBy: 'System',
                createdAt: new Date().toISOString()
            });
        }
        
        return questions;
    }
};

// Initialize sample data on load
document.addEventListener('DOMContentLoaded', function() {
    LocalStorage.initializeSampleData();
    console.log('✅ SkillAlign Local Storage configured');
    console.log('📊 Questions per assessment:', LOCAL_CONFIG.questionsPerAssessment);
});