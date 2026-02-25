/**
 * Supabase Configuration
 */

// Supabase credentials
const SUPABASE_URL = 'https://tpeetgghfkobnuyjamgt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-7WN3OcAF0dwS5s0m5P0-g_YkLAvkOx';

// Create Supabase client
let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase initialized');
} else {
    console.error('❌ Supabase library not loaded');
}

// Make it globally available
window.supabase = supabaseClient || null;

// Configuration
const SUPABASE_CONFIG = {
    tables: {
        users: 'users',
        questions: 'questions',
        assessments: 'assessments'
    },
    auth: {
        sessionTimeout: 24 * 60 * 60 * 1000,
        passwordMinLength: 8,
        requireStrongPassword: false
    }
};


