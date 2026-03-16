/**
 * SharePoint Authentication Module
 * Handles user registration, login, and session management
 */

const SharePointAuth = {
    
    /**
     * Register new user
     */
    register: async function(userData) {
        try {
            // Validation
            if (!userData.email || !userData.password || !userData.name) {
                return { success: false, error: 'All fields are required' };
            }
            
            if (userData.password.length < SHAREPOINT_CONFIG.auth.passwordMinLength) {
                return { 
                    success: false, 
                    error: `Password must be at least ${SHAREPOINT_CONFIG.auth.passwordMinLength} characters` 
                };
            }
            
            if (userData.password !== userData.confirmPassword) {
                return { success: false, error: 'Passwords do not match' };
            }
            
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                return { success: false, error: 'Invalid email format' };
            }
            
            // Check if user already exists
            const { data: existingUsers } = await SharePointAPI.getListItems(
                SHAREPOINT_CONFIG.lists.users,
                `UserEmail eq '${userData.email.toLowerCase()}'`
            );
            
            if (existingUsers && existingUsers.length > 0) {
                return { success: false, error: 'Email already registered' };
            }
            
            // Simple hash (FOR DEMO - use bcrypt in production!)
            const passwordHash = btoa(userData.password);
            
            // Insert user into SharePoint
            const { data, error } = await SharePointAPI.addListItem(
                SHAREPOINT_CONFIG.lists.users,
                {
                    Title: userData.name,
                    UserEmail: userData.email.toLowerCase().trim(),
                    UserName: userData.name.trim(),
                    UserPassword: passwordHash,
                    UserRole: 'User',
                    IsActive: true
                }
            );
            
            if (error) {
                console.error('SharePoint error:', error);
                return { success: false, error: 'Registration failed. Please try again.' };
            }
            
            console.log('✅ User registered:', userData.email);
            return { 
                success: true, 
                message: 'Account created successfully! You can now login.',
                data: data
            };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                error: 'Registration failed. Please check your connection.' 
            };
        }
    },
    
    /**
     * Login user
     */
    login: async function(email, password) {
        try {
            const passwordHash = btoa(password);
            
            // Query SharePoint
            const { data, error } = await SharePointAPI.getListItems(
                SHAREPOINT_CONFIG.lists.users,
                `UserEmail eq '${email.toLowerCase().trim()}' and UserPassword eq '${passwordHash}'`
            );
            
            if (error || !data || data.length === 0) {
                console.error('Login error:', error);
                return { success: false, error: 'Invalid email or password' };
            }
            
            const user = data[0];
            
            // Check if active
            if (!user.IsActive) {
                return { 
                    success: false, 
                    error: 'Account is deactivated. Please contact support.' 
                };
            }
            
            // Update last login
            await SharePointAPI.updateListItem(
                SHAREPOINT_CONFIG.lists.users,
                user.ID,
                { LastLogin: new Date().toISOString() }
            );
            
            // Create session
            const session = {
                id: user.ID,
                email: user.UserEmail,
                name: user.UserName,
                full_name: user.UserName,
                role: user.UserRole.toLowerCase(),
                loginTime: Date.now()
            };
            
            this.saveSession(session);
            
            console.log('✅ User logged in:', email);
            return { success: true, user: session };
            
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                error: 'Login failed. Please check your connection.' 
            };
        }
    },
    
    /**
     * Save session to storage
     */
    saveSession: function(session) {
        sessionStorage.setItem('userSession', JSON.stringify(session));
    },
    
    /**
     * Get current session
     */
    getSession: function() {
        const sessionData = sessionStorage.getItem('userSession');
        if (!sessionData) return null;
        
        try {
            const session = JSON.parse(sessionData);
            
            // Check timeout
            const sessionAge = Date.now() - session.loginTime;
            if (sessionAge > SHAREPOINT_CONFIG.auth.sessionTimeout) {
                this.logout();
                return null;
            }
            
            return session;
        } catch (error) {
            console.error('Session parse error:', error);
            this.logout();
            return null;
        }
    },
    
    /**
     * Logout user
     */
    logout: function() {
        sessionStorage.removeItem('userSession');
        console.log('✅ User logged out');
    },
    
    /**
     * Check if authenticated
     */
    isAuthenticated: function() {
        return this.getSession() !== null;
    },
    
    /**
     * Check if user is admin
     */
    isAdmin: function() {
        const session = this.getSession();
        return session && session.role === 'admin';
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SharePointAuth;
}

console.log('✅ SharePoint authentication module loaded');
