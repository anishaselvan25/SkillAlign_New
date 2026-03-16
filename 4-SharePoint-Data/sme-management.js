/**
 * SkillAlign - SME Management Module
 * Admin controls who can be SME
 */

const SMEManagement = {
    
    /**
     * Add SME (Admin only)
     */
    addSME: async function(smeData) {
        try {
            const session = SharePointAuth.getSession();
            if (!session || session.role !== 'admin') {
                return { success: false, error: 'Unauthorized: Admin only' };
            }
            
            // Validation
            if (!smeData.email || !smeData.name || !smeData.password) {
                return { success: false, error: 'All fields are required' };
            }
            
            if (smeData.password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' };
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(smeData.email)) {
                return { success: false, error: 'Invalid email format' };
            }
            
            const users = SharePointAPI.get(LOCAL_CONFIG.storage.keys.users) || [];
            
            // Check if user already exists
            const exists = users.find(u => u.email.toLowerCase() === smeData.email.toLowerCase());
            if (exists) {
                return { success: false, error: 'User with this email already exists' };
            }
            
            // Create SME account
            const newSME = {
                id: users.length + 1,
                email: smeData.email.toLowerCase(),
                password: btoa(smeData.password),  // Base64 encode
                name: smeData.name,
                role: 'sme',
                isActive: true,
                assignedTopics: smeData.topics || [],
                createdAt: new Date().toISOString(),
                createdBy: session.name,
                lastLogin: null
            };
            
            users.push(newSME);
            SharePointAPI.set(LOCAL_CONFIG.storage.keys.users, users);
            
            // Send email notification (simulated for local)
            await EmailSimulator.sendSMEWelcomeEmail({
                to: newSME.email,
                name: newSME.name,
                topics: smeData.topics || [],
                adminName: session.name,
                tempPassword: smeData.password,
                loginUrl: window.location.origin
            });
            
            console.log('✅ SME added:', newSME.email);
            return { 
                success: true, 
                message: 'SME added successfully! Email notification sent.',
                data: newSME 
            };
            
        } catch (error) {
            console.error('❌ Error adding SME:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get all SMEs (Admin only)
     */
    getAllSMEs: async function() {
        try {
            const session = SharePointAuth.getSession();
            if (!session || session.role !== 'admin') {
                return { success: false, error: 'Unauthorized: Admin only', data: [] };
            }
            
            const users = SharePointAPI.get(LOCAL_CONFIG.storage.keys.users) || [];
            const smes = users.filter(u => u.role === 'sme');
            
            return { success: true, data: smes };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },
    
    /**
     * Update SME status (Admin only)
     */
    updateSMEStatus: async function(smeId, isActive) {
        try {
            const session = SharePointAuth.getSession();
            if (!session || session.role !== 'admin') {
                return { success: false, error: 'Unauthorized: Admin only' };
            }
            
            const users = SharePointAPI.get(LOCAL_CONFIG.storage.keys.users) || [];
            const sme = users.find(u => u.id === smeId && u.role === 'sme');
            
            if (!sme) {
                return { success: false, error: 'SME not found' };
            }
            
            sme.isActive = isActive;
            SharePointAPI.set(LOCAL_CONFIG.storage.keys.users, users);
            
            console.log(`✅ SME ${isActive ? 'activated' : 'deactivated'}:`, sme.email);
            return { success: true, message: `SME ${isActive ? 'activated' : 'deactivated'} successfully` };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Delete SME (Admin only)
     */
    deleteSME: async function(smeId) {
        try {
            const session = SharePointAuth.getSession();
            if (!session || session.role !== 'admin') {
                return { success: false, error: 'Unauthorized: Admin only' };
            }
            
            const users = SharePointAPI.get(LOCAL_CONFIG.storage.keys.users) || [];
            const index = users.findIndex(u => u.id === smeId && u.role === 'sme');
            
            if (index === -1) {
                return { success: false, error: 'SME not found' };
            }
            
            users.splice(index, 1);
            SharePointAPI.set(LOCAL_CONFIG.storage.keys.users, users);
            
            console.log('✅ SME deleted');
            return { success: true, message: 'SME deleted successfully' };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Assign topics to SME (Admin only)
     */
    assignTopicsToSME: async function(smeId, topics) {
        try {
            const session = SharePointAuth.getSession();
            if (!session || session.role !== 'admin') {
                return { success: false, error: 'Unauthorized: Admin only' };
            }
            
            const users = SharePointAPI.get(LOCAL_CONFIG.storage.keys.users) || [];
            const sme = users.find(u => u.id === smeId && u.role === 'sme');
            
            if (!sme) {
                return { success: false, error: 'SME not found' };
            }
            
            sme.assignedTopics = topics;
            SharePointAPI.set(LOCAL_CONFIG.storage.keys.users, users);
            
            // Send notification email
            await EmailSimulator.sendTopicAssignmentEmail({
                to: sme.email,
                name: sme.name,
                topics: topics,
                adminName: session.name
            });
            
            console.log('✅ Topics assigned to SME:', sme.email);
            return { success: true, message: 'Topics assigned successfully! Email notification sent.' };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get SME statistics (Admin only)
     */
    getSMEStatistics: async function() {
        try {
            const session = SharePointAuth.getSession();
            if (!session || session.role !== 'admin') {
                return { success: false, data: null };
            }
            
            const users = SharePointAPI.get(LOCAL_CONFIG.storage.keys.users) || [];
            const questions = SharePointAPI.get(LOCAL_CONFIG.storage.keys.questions) || [];
            
            const smes = users.filter(u => u.role === 'sme');
            
            const stats = smes.map(sme => {
                const smeQuestions = questions.filter(q => q.createdBy === sme.name && q.isActive);
                return {
                    id: sme.id,
                    name: sme.name,
                    email: sme.email,
                    isActive: sme.isActive,
                    assignedTopics: sme.assignedTopics || [],
                    questionsAdded: smeQuestions.length,
                    lastLogin: sme.lastLogin,
                    createdAt: sme.createdAt
                };
            });
            
            return { success: true, data: stats };
            
        } catch (error) {
            console.error('❌ Error:', error);
            return { success: false, data: null };
        }
    }
};

console.log('✅ SME Management module loaded');
