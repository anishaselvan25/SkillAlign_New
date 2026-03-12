/**
 * SkillAlign - Local Data Operations Module
 * Handles all data operations with localStorage
 */

const LocalData = {
    
    /**
     * Load all topics
     */
    loadTopics: async function() {
        try {
            console.log('📚 Loading topics from localStorage...');
            
            const topics = LocalStorage.get(LOCAL_CONFIG.storage.keys.topics) || [];
            const questions = LocalStorage.get(LOCAL_CONFIG.storage.keys.questions) || [];
            
            // Update question counts
            topics.forEach(topic => {
                topic.totalQuestions = questions.filter(q => 
                    q.topic === topic.name && q.isActive
                ).length;
            });
            
            // Save updated counts
            LocalStorage.set(LOCAL_CONFIG.storage.keys.topics, topics);
            
            console.log(`✅ Loaded ${topics.length} topics`);
            return topics.filter(t => t.isActive);
            
        } catch (error) {
            console.error('❌ Error loading topics:', error);
            return [];
        }
    },
    
    /**
     * Load random questions from topic (30 questions)
     */
    loadRandomQuestions: async function(topicName, count = LOCAL_CONFIG.questionsPerAssessment) {
        try {
            console.log(`🎲 Loading random ${count} questions for: ${topicName}`);
            
            const allQuestions = LocalStorage.get(LOCAL_CONFIG.storage.keys.questions) || [];
            
            // Filter by topic and active status
            const topicQuestions = allQuestions.filter(q => 
                q.topic === topicName && q.isActive
            );
            
            if (topicQuestions.length === 0) {
                console.warn('⚠️ No questions found for this topic');
                return null;
            }
            
            console.log(`📊 Found ${topicQuestions.length} total questions for ${topicName}`);
            
            // Shuffle and select random questions
            const shuffled = this.shuffleArray([...topicQuestions]);
            const selected = shuffled.slice(0, Math.min(count, topicQuestions.length));
            
            // Convert to app format
            const questions = selected.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correct: q.correctAnswer,
                isMultipleAnswer: q.isMultipleChoice || (q.correctAnswer && q.correctAnswer.includes(','))
            }));
            
            console.log(`✅ Randomly selected ${questions.length} questions`);
            return questions;
            
        } catch (error) {
            console.error('❌ Error loading random questions:', error);
            return null;
        }
    },
    
    /**
     * Shuffle array (Fisher-Yates algorithm)
     */
    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    
    /**
     * Save assessment
     */
    saveAssessment: async function(assessmentData) {
        try {
            const session = LocalAuth.getSession();
            if (!session) {
                throw new Error('Not authenticated');
            }
            
            console.log('💾 Saving assessment...');
            
            const assessments = LocalStorage.get(LOCAL_CONFIG.storage.keys.assessments) || [];
            
            const newAssessment = {
                id: assessments.length + 1,
                user_id: session.id,
                user_email: session.email,
                user_name: session.name,
                topic: assessmentData.topic,
                question_set: 'random',
                score: assessmentData.score,
                correct_answers: assessmentData.correctAnswers,
                total_questions: assessmentData.totalQuestions,
                passed: assessmentData.passed,
                test_date: new Date().toISOString(),
                time_taken: assessmentData.timeTaken || 0,
                answers: assessmentData.answers,
                question_ids: assessmentData.questionIds || []
            };
            
            assessments.push(newAssessment);
            LocalStorage.set(LOCAL_CONFIG.storage.keys.assessments, assessments);
            
            console.log('✅ Assessment saved');
            return { success: true, data: newAssessment };
            
        } catch (error) {
            console.error('❌ Save assessment error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get user's assessment history
     */
    getUserAssessments: async function() {
        try {
            const session = LocalAuth.getSession();
            if (!session) {
                return [];
            }
            
            const assessments = LocalStorage.get(LOCAL_CONFIG.storage.keys.assessments) || [];
            return assessments.filter(a => a.user_id === session.id)
                .sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
            
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * Get all assessments (admin only)
     */
    getAllAssessments: async function() {
        try {
            console.log('📊 Loading all assessments...');
            
            const assessments = LocalStorage.get(LOCAL_CONFIG.storage.keys.assessments) || [];
            const sorted = assessments.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
            
            console.log(`✅ Loaded ${sorted.length} assessments`);
            return sorted;
            
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * Get all users (admin only)
     */
    getAllUsers: async function() {
        try {
            console.log('👥 Loading all users...');
            
            const users = LocalStorage.get(LOCAL_CONFIG.storage.keys.users) || [];
            
            const mapped = users.map(u => ({
                id: u.id,
                email: u.email,
                full_name: u.name,
                role: u.role,
                is_active: u.isActive,
                created_at: u.createdAt,
                last_login: u.lastLogin
            }));
            
            console.log(`✅ Loaded ${mapped.length} users`);
            return mapped;
            
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * SME: Add new topic
     */
    addTopic: async function(topicData) {
        try {
            const session = LocalAuth.getSession();
            if (!session || (session.role !== 'sme' && session.role !== 'admin')) {
                return { success: false, error: 'Unauthorized: SME or Admin access required' };
            }
            
            const topics = LocalStorage.get(LOCAL_CONFIG.storage.keys.topics) || [];
            
            // Check if exists
            const exists = topics.find(t => t.name.toLowerCase() === topicData.topicName.toLowerCase());
            if (exists) {
                return { success: false, error: 'Topic already exists' };
            }
            
            const newTopic = {
                id: topics.length + 1,
                name: topicData.topicName,
                icon: topicData.topicIcon || '📚',
                description: topicData.description || '',
                isActive: true,
                totalQuestions: 0,
                createdAt: new Date().toISOString()
            };
            
            topics.push(newTopic);
            LocalStorage.set(LOCAL_CONFIG.storage.keys.topics, topics);
            
            console.log('✅ Topic added:', topicData.topicName);
            return { success: true, data: newTopic };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * SME: Add new question
     */
    addQuestion: async function(questionData) {
        try {
            const session = LocalAuth.getSession();
            if (!session || (session.role !== 'sme' && session.role !== 'admin')) {
                return { success: false, error: 'Unauthorized: SME or Admin access required' };
            }
            
            const questions = LocalStorage.get(LOCAL_CONFIG.storage.keys.questions) || [];
            
            // Determine if multiple choice
            const isMultiple = questionData.correctAnswer.includes(',');
            
            const newQuestion = {
                id: questions.length + 1,
                topic: questionData.topic,
                question: questionData.questionText,
                options: [
                    questionData.option1,
                    questionData.option2,
                    questionData.option3,
                    questionData.option4
                ],
                correctAnswer: questionData.correctAnswer,
                isMultipleChoice: isMultiple,
                difficulty: questionData.difficulty || 'Medium',
                isActive: true,
                createdBy: session.name,
                createdAt: new Date().toISOString()
            };
            
            questions.push(newQuestion);
            LocalStorage.set(LOCAL_CONFIG.storage.keys.questions, questions);
            
            console.log('✅ Question added');
            return { success: true, data: { questionId: newQuestion.id } };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * SME: Get questions by topic
     */
    getQuestionsByTopic: async function(topicName) {
        try {
            const questions = LocalStorage.get(LOCAL_CONFIG.storage.keys.questions) || [];
            return questions.filter(q => q.topic === topicName && q.isActive);
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * SME: Delete question
     */
    deleteQuestion: async function(questionId) {
        try {
            const session = LocalAuth.getSession();
            if (!session || session.role !== 'admin') {
                return { success: false, error: 'Unauthorized: Admin only' };
            }
            
            const questions = LocalStorage.get(LOCAL_CONFIG.storage.keys.questions) || [];
            const index = questions.findIndex(q => q.id === questionId);
            
            if (index === -1) {
                return { success: false, error: 'Question not found' };
            }
            
            // Soft delete
            questions[index].isActive = false;
            LocalStorage.set(LOCAL_CONFIG.storage.keys.questions, questions);
            
            console.log('✅ Question deleted');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    }
};

console.log('✅ Local data operations module loaded');
console.log(`📊 Questions per assessment: ${LOCAL_CONFIG.questionsPerAssessment}`);