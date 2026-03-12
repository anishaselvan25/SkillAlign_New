/**
 * SkillAlign - Local Authentication Module
 * For local testing before SharePoint deployment
 */

const LocalAuth = {
    
    /**
     * Register new user (USER role only - SMEs must be added by admin)
     */
    register: async function(userData) {
        try {
            // Validation
            if (!userData.email || !userData.password || !userData.name) {
                return { success: false, error: 'All fields are required' };
            }
            
            if (userData.password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' };
            }
            
            if (userData.password !== userData.confirmPassword) {
                return { success: false, error: 'Passwords do not match' };
            }
            
            // Check if user exists
            const users = LocalStorage.get(LOCAL_CONFIG.storage.keys.users) || [];
            const exists = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
            
            if (exists) {
                return { success: false, error: 'Email already registered' };
            }
            
            // Create new user (ALWAYS as 'user' role - SMEs must be added by admin)
            const newUser = {
                id: users.length + 1,
                email: userData.email.toLowerCase(),
                password: btoa(userData.password),  // Base64 encode
                name: userData.name,
                role: 'user',  // ALWAYS user - cannot self-register as SME
                isActive: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            users.push(newUser);
            LocalStorage.set(LOCAL_CONFIG.storage.keys.users, users);
            
            console.log('✅ User registered:', userData.email);
            return { success: true, message: 'Account created successfully!' };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    },
    
    /**
     * Login user
     */
    login: async function(email, password) {
        try {
            const users = LocalStorage.get(LOCAL_CONFIG.storage.keys.users) || [];
            const passwordHash = btoa(password);
            
            const user = users.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && 
                u.password === passwordHash
            );
            
            if (!user) {
                return { success: false, error: 'Invalid email or password' };
            }
            
            if (!user.isActive) {
                return { success: false, error: 'Account is deactivated' };
            }
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            LocalStorage.set(LOCAL_CONFIG.storage.keys.users, users);
            
            // Create session
            const session = {
                id: user.id,
                email: user.email,
                name: user.name,
                full_name: user.name,
                role: user.role,
                loginTime: Date.now()
            };
            
            this.saveSession(session);
            
            console.log('✅ User logged in:', email);
            return { success: true, user: session };
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    },
    
    /**
     * Save session
     */
    saveSession: function(session) {
        sessionStorage.setItem(LOCAL_CONFIG.storage.prefix + 'session', JSON.stringify(session));
    },
    
    /**
     * Get current session
     */
    getSession: function() {
        const sessionData = sessionStorage.getItem(LOCAL_CONFIG.storage.prefix + 'session');
        if (!sessionData) return null;
        
        try {
            const session = JSON.parse(sessionData);
            // Session never expires in local mode for testing
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
        sessionStorage.removeItem(LOCAL_CONFIG.storage.prefix + 'session');
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
    },
    
    /**
     * Check if user is SME
     */
    isSME: function() {
        const session = this.getSession();
        return session && (session.role === 'sme' || session.role === 'admin');
    }
};

console.log('✅ Local authentication module loaded');