/**
 * Supabase Data Operations Module
 * Handles all database CRUD operations
 */

const SupabaseData = {
    
    /**
     * Load all questions from database
     */
    loadQuestions: async function() {
        try {
            console.log('📚 Loading questions from Supabase...');
            
            // Check if supabase is available
            if (!window.supabase) {
                console.error('❌ Supabase client not initialized');
                return null;
            }
            
            const { data, error } = await window.supabase
                .from('questions')
                .select('*')
                .eq('is_active', true)
                .order('question_id', { ascending: true });
            
            if (error) {
                console.error('❌ Supabase error:', error);
                return null;
            }
            
            if (!data || data.length === 0) {
                console.warn('⚠️ No questions found in database');
                return null;
            }
            
            console.log(`📊 Raw data from Supabase: ${data.length} questions`);
            
            // Organize questions by topic and set
            const organized = {};
            
            data.forEach(q => {
                if (!organized[q.topic]) {
                    organized[q.topic] = {};
                }
                if (!organized[q.topic][q.question_set]) {
                    organized[q.topic][q.question_set] = [];
                }
                
                // Check if multiple choice
                const isMultiple = q.correct_answer && q.correct_answer.includes(',');
                
                organized[q.topic][q.question_set].push({
                    id: q.question_id,
                    question: q.question_text,
                    options: [q.option_1, q.option_2, q.option_3, q.option_4],
                    correct: q.correct_answer,
                    isMultipleAnswer: isMultiple
                });
            });
            
            console.log(`✅ Organized ${data.length} questions into ${Object.keys(organized).length} topics`);
            return organized;
            
        } catch (error) {
            console.error('❌ Error loading questions:', error);
            return null;
        }
    },
    
    /**
     * Save assessment to database
     */
    saveAssessment: async function(assessmentData) {
        try {
            const session = SupabaseAuth.getSession();
            if (!session) {
                throw new Error('Not authenticated');
            }
            
            console.log('💾 Saving assessment...');
            
            const { data, error } = await window.supabase
                .from('assessments')
                .insert([{
                    user_id: session.id,
                    user_email: session.email,
                    user_name: session.name,
                    topic: assessmentData.topic,
                    question_set: assessmentData.set,
                    score: assessmentData.score,
                    correct_answers: assessmentData.correctAnswers,
                    total_questions: assessmentData.totalQuestions,
                    passed: assessmentData.passed,
                    answers: assessmentData.answers
                }])
                .select()
                .single();
            
            if (error) {
                console.error('❌ Error saving assessment:', error);
                throw error;
            }
            
            console.log('✅ Assessment saved');
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
            const session = SupabaseAuth.getSession();
            if (!session) {
                console.warn('⚠️ Not authenticated');
                return [];
            }
            
            const { data, error } = await window.supabase
                .from('assessments')
                .select('*')
                .eq('user_id', session.id)
                .order('test_date', { ascending: false });
            
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
            console.log('📊 Loading all assessments...');
            
            const { data, error } = await window.supabase
                .from('assessments')
                .select('*')
                .order('test_date', { ascending: false });
            
            if (error) {
                console.error('❌ Error loading assessments:', error);
                return [];
            }
            
            console.log(`✅ Loaded ${data ? data.length : 0} assessments`);
            return data || [];
            
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
            
            const { data, error } = await window.supabase
                .from('users')
                .select('id, email, full_name, role, is_active, created_at, last_login')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error loading users:', error);
                return [];
            }
            
            console.log(`✅ Loaded ${data ? data.length : 0} users`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * Get assessment statistics (admin only)
     */
    getStatistics: async function() {
        try {
            const session = SupabaseAuth.getSession();
            if (!session || session.role !== 'admin') {
                console.warn('⚠️ Unauthorized: Admin access required');
                return null;
            }
            
            console.log('📈 Loading statistics...');
            
            // Get total assessments count
            const { count: totalAssessments, error: e1 } = await window.supabase
                .from('assessments')
                .select('*', { count: 'exact', head: true });
            
            // Get passed count
            const { count: passedCount, error: e2 } = await window.supabase
                .from('assessments')
                .select('*', { count: 'exact', head: true })
                .eq('passed', true);
            
            // Get active users count
            const { count: userCount, error: e3 } = await window.supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            // Get questions count
            const { count: questionCount, error: e4 } = await window.supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            if (e1 || e2 || e3 || e4) {
                console.error('❌ Error loading statistics');
                return null;
            }
            
            const stats = {
                totalAssessments: totalAssessments || 0,
                passedCount: passedCount || 0,
                failedCount: (totalAssessments || 0) - (passedCount || 0),
                activeUsers: userCount || 0,
                totalQuestions: questionCount || 0
            };
            
            console.log('✅ Statistics loaded:', stats);
            return stats;
            
        } catch (error) {
            console.error('❌ Error loading statistics:', error);
            return null;
        }
    },
    
    /**
     * Get topic-wise statistics (admin only)
     */
    getTopicStats: async function() {
        try {
            const { data, error } = await window.supabase
                .from('assessments')
                .select('topic, score, passed');
            
            if (error) {
                console.error('❌ Error loading topic stats:', error);
                return {};
            }
            
            const stats = {};
            
            data.forEach(assessment => {
                if (!stats[assessment.topic]) {
                    stats[assessment.topic] = {
                        total: 0,
                        passed: 0,
                        failed: 0,
                        totalScore: 0
                    };
                }
                
                stats[assessment.topic].total++;
                if (assessment.passed) {
                    stats[assessment.topic].passed++;
                } else {
                    stats[assessment.topic].failed++;
                }
                stats[assessment.topic].totalScore += assessment.score;
            });
            
            // Calculate average scores
            Object.keys(stats).forEach(topic => {
                const topicData = stats[topic];
                topicData.avgScore = topicData.total > 0 
                    ? Math.round(topicData.totalScore / topicData.total)
                    : 0;
                delete topicData.totalScore;
            });
            
            return stats;
            
        } catch (error) {
            console.error('❌ Error:', error);
            return {};
        }
    },
    
    /**
     * Get top scorers (admin only)
     */
    getTopScorers: async function(limit = 10) {
        try {
            const { data, error } = await window.supabase
                .from('assessments')
                .select('user_name, user_email, topic, question_set, score, test_date')
                .order('score', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('❌ Error loading top scorers:', error);
                return [];
            }
            
            return data || [];
            
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * Get recent activity (admin only)
     */
    getRecentActivity: async function(limit = 10) {
        try {
            const { data, error } = await window.supabase
                .from('assessments')
                .select('*')
                .order('test_date', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('❌ Error loading recent activity:', error);
                return [];
            }
            
            return data || [];
            
        } catch (error) {
            console.error('❌ Error:', error);
            return [];
        }
    },
    
    /**
     * Delete assessment (admin only)
     */
    deleteAssessment: async function(assessmentId) {
        try {
            const session = SupabaseAuth.getSession();
            if (!session || session.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }
            
            const { error } = await window.supabase
                .from('assessments')
                .delete()
                .eq('id', assessmentId);
            
            if (error) {
                throw error;
            }
            
            console.log('✅ Assessment deleted');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error deleting assessment:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Update user status (admin only)
     */
    updateUserStatus: async function(userId, isActive) {
        try {
            const session = SupabaseAuth.getSession();
            if (!session || session.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }
            
            const { error } = await window.supabase
                .from('users')
                .update({ is_active: isActive })
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
            
            console.log('✅ User status updated');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error updating user:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Export data to CSV (admin only)
     */
    exportToCsv: async function(dataType) {
        try {
            const session = SupabaseAuth.getSession();
            if (!session || session.role !== 'admin') {
                throw new Error('Unauthorized: Admin access required');
            }
            
            let data, headers;
            
            if (dataType === 'assessments') {
                const { data: assessments } = await window.supabase
                    .from('assessments')
                    .select('*')
                    .order('test_date', { ascending: false });
                
                data = assessments;
                headers = ['ID', 'User Name', 'User Email', 'Topic', 'Set', 'Score', 'Passed', 'Date'];
            } else if (dataType === 'users') {
                const { data: users } = await window.supabase
                    .from('users')
                    .select('id, email, full_name, role, is_active, created_at');
                
                data = users;
                headers = ['ID', 'Email', 'Full Name', 'Role', 'Active', 'Created'];
            }
            
            if (!data) {
                throw new Error('No data to export');
            }
            
            // Convert to CSV
            let csv = headers.join(',') + '\n';
            data.forEach(row => {
                const values = Object.values(row).map(val => 
                    typeof val === 'string' ? `"${val}"` : val
                );
                csv += values.join(',') + '\n';
            });
            
            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${dataType}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            console.log('✅ Data exported to CSV');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            return { success: false, error: error.message };
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseData;
}