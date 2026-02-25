/**
 * Supabase Authentication Module
 * Handles user registration, login, and session management
 */

const SupabaseAuth = {
    
    /**
     * Register new user
     */
    register: async function(userData) {
        try {
            // Validation
            if (!userData.email || !userData.password || !userData.name) {
                return { success: false, error: 'All fields are required' };
            }
            
            if (userData.password.length < SUPABASE_CONFIG.auth.passwordMinLength) {
                return { 
                    success: false, 
                    error: `Password must be at least ${SUPABASE_CONFIG.auth.passwordMinLength} characters` 
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
            
            // Password strength validation
            if (SUPABASE_CONFIG.auth.requireStrongPassword) {
                const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
                if (!strongRegex.test(userData.password)) {
                    return { 
                        success: false, 
                        error: 'Password must contain uppercase, lowercase, and numbers' 
                    };
                }
            }
            
            // Simple hash (FOR DEMO - use bcrypt in production!)
            const passwordHash = btoa(userData.password);
            
            // Insert user into Supabase
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.users)
                .insert([{
                    email: userData.email.toLowerCase().trim(),
                    password_hash: passwordHash,
                    full_name: userData.name.trim(),
                    role: 'user',
                    is_active: true
                }])
                .select()
                .single();
            
            if (error) {
                console.error('Supabase error:', error);
                if (error.code === '23505') {
                    return { success: false, error: 'Email already registered' };
                }
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
            
            // Query Supabase
            const { data, error } = await supabase
                .from(SUPABASE_CONFIG.tables.users)
                .select('*')
                .eq('email', email.toLowerCase().trim())
                .eq('password_hash', passwordHash)
                .single();
            
            if (error || !data) {
                console.error('Login error:', error);
                return { success: false, error: 'Invalid email or password' };
            }
            
            // Check if active
            if (!data.is_active) {
                return { 
                    success: false, 
                    error: 'Account is deactivated. Please contact support.' 
                };
            }
            
            // Update last login
            await supabase
                .from(SUPABASE_CONFIG.tables.users)
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.id);
            
            // Create session
            const session = {
                id: data.id,
                email: data.email,
                name: data.full_name,
                role: data.role,
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
            if (sessionAge > SUPABASE_CONFIG.auth.sessionTimeout) {
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
    module.exports = SupabaseAuth;
}


