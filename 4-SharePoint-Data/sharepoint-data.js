/**
 * Enhanced SharePoint Data Operations Module
 * With random question selection and SME features
 */

const SharePointData = {
    
    /**
     * Load topics from SharePoint
     */
    loadTopics: async function() {
        try {
            console.log('📚 Loading topics from SharePoint...');
            
            const { data, error } = await SharePointAPI.getListItems(
                'TestMaster_Topics',
                'IsActive eq true',
                'ID,TopicName,TopicIcon,TopicDescription,TotalQuestions',
                'TopicName'
            );
            
            if (error) {
                console.error('❌ SharePoint error:', error);
                return [];
            }
            
            console.log(`✅ Loaded ${data ? data.length : 0} topics`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error loading topics:', error);
            return [];
        }
    },
    
    /**
     * Load random questions from topic (replaces set-based loading)
     */
    loadRandomQuestions: async function(topicName, count = 60) {
        try {
            console.log(`🎲 Loading random ${count} questions for: ${topicName}`);
            
            // Get ALL active questions for this topic
            const { data, error } = await SharePointAPI.getListItems(
                'TestMaster_Questions',
                `Topic eq '${topicName}' and IsActive eq true`,
                'ID,QuestionID,QuestionText,Option1,Option2,Option3,Option4,CorrectAnswer,IsMultipleChoice',
                'QuestionID'
            );
            
            if (error) {
                console.error('❌ SharePoint error:', error);
                return null;
            }
            
            if (!data || data.length === 0) {
                console.warn('⚠️ No questions found for this topic');
                return null;
            }
            
            console.log(`📊 Found ${data.length} total questions for ${topicName}`);
            
            // Shuffle and select random questions
            const shuffled = this.shuffleArray([...data]);
            const selected = shuffled.slice(0, Math.min(count, data.length));
            
            // Convert to app format
            const questions = selected.map(q => ({
                id: q.QuestionID,
                question: q.QuestionText,
                options: [q.Option1, q.Option2, q.Option3, q.Option4],
                correct: q.CorrectAnswer,
                isMultipleAnswer: q.IsMultipleChoice || (q.CorrectAnswer && q.CorrectAnswer.includes(','))
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
     * Save assessment to SharePoint
     */
    saveAssessment: async function(assessmentData) {
        try {
            const session = SharePointAuth.getSession();
            if (!session) {
                throw new Error('Not authenticated');
            }
            
            console.log('💾 Saving assessment to SharePoint...');
            
            const { data, error } = await SharePointAPI.addListItem(
                'TestMaster_Assessments',
                {
                    Title: `${session.name} - ${assessmentData.topic}`,
                    UserID: session.id,
                    UserEmail: session.email,
                    UserName: session.name,
                    Topic: assessmentData.topic,
                    QuestionsAsked: assessmentData.totalQuestions,
                    Score: assessmentData.score,
                    CorrectAnswers: assessmentData.correctAnswers,
                    TotalQuestions: assessmentData.totalQuestions,
                    Passed: assessmentData.passed,
                    TestDate: new Date().toISOString(),
                    TimeTaken: assessmentData.timeTaken || 0,
                    Answers: JSON.stringify(assessmentData.answers),
                    QuestionIDs: JSON.stringify(assessmentData.questionIds || [])
                }
            );
            
            if (error) {
                console.error('❌ Error saving assessment:', error);
                throw error;
            }
            
            console.log('✅ Assessment saved to SharePoint');
            return { success: true, data };
            
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
            const session = SharePointAuth.getSession();
            if (!session) {
                console.warn('⚠️ Not authenticated');
                return [];
            }
            
            const { data, error } = await SharePointAPI.getListItems(
                'TestMaster_Assessments',
                `UserID eq ${session.id}`,
                null,
                'TestDate desc'
            );
            
            if (error) {
                console.error('❌ Error loading user assessments:', error);
                return [];
            }
            
            return data || [];
            
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
            console.log('📊 Loading all assessments from SharePoint...');
            
            const { data, error } = await SharePointAPI.getListItems(
                'TestMaster_Assessments',
                null,
                'ID,UserID,UserEmail,UserName,Topic,QuestionsAsked,Score,CorrectAnswers,TotalQuestions,Passed,TestDate,TimeTaken',
                'TestDate desc'
            );
            
            if (error) {
                console.error('❌ Error loading assessments:', error);
                return [];
            }
            
            // Convert SharePoint format to app format
            const converted = data ? data.map(item => ({
                id: item.ID,
                user_id: item.UserID,
                user_email: item.UserEmail,
                user_name: item.UserName,
                topic: item.Topic,
                question_set: 'random', // No more sets
                score: item.Score,
                correct_answers: item.CorrectAnswers,
                total_questions: item.TotalQuestions || item.QuestionsAsked,
                passed: item.Passed,
                test_date: item.TestDate,
                time_taken: item.TimeTaken
            })) : [];
            
            console.log(`✅ Loaded ${converted.length} assessments from SharePoint`);
            return converted;
            
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
            console.log('👥 Loading all users from SharePoint...');
            
            const { data, error } = await SharePointAPI.getListItems(
                'TestMaster_Users',
                null,
                'ID,UserEmail,UserName,UserRole,IsActive,Created,LastLogin'
            );
            
            if (error) {
                console.error('❌ Error loading users:', error);
                return [];
            }
            
            // Convert SharePoint format to app format
            const converted = data ? data.map(item => ({
                id: item.ID,
                email: item.UserEmail,
                full_name: item.UserName,
                role: item.UserRole,
                is_active: item.IsActive,
                created_at: item.Created,
                last_login: item.LastLogin
            })) : [];
            
            console.log(`✅ Loaded ${converted.length} users from SharePoint`);
            return converted;
            
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * Get question statistics by topic
     */
    getQuestionStats: async function() {
        try {
            const topics = await this.loadTopics();
            const stats = {};
            
            for (const topic of topics) {
                const { data } = await SharePointAPI.getListItems(
                    'TestMaster_Questions',
                    `Topic eq '${topic.TopicName}' and IsActive eq true`,
                    'ID,IsMultipleChoice'
                );
                
                stats[topic.TopicName] = {
                    total: data ? data.length : 0,
                    singleChoice: data ? data.filter(q => !q.IsMultipleChoice).length : 0,
                    multipleChoice: data ? data.filter(q => q.IsMultipleChoice).length : 0
                };
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting question stats:', error);
            return {};
        }
    }
};

console.log('✅ Enhanced SharePoint data operations module loaded');
