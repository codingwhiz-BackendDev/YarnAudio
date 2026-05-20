/**
 * YarnAudio Supabase Authentication Module
 * Handles client-side Supabase auth integration with Django backend
 */

class SupabaseAuthClient {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl || document.currentScript?.dataset.supabaseUrl || window.SUPABASE_URL;
        this.supabaseKey = supabaseKey || document.currentScript?.dataset.supabaseKey || window.SUPABASE_KEY;
        this.client = null;
        this.user = null;
        this.session = null;
        
        this.init();
    }

    init() {
        try {
            if (typeof supabase === 'undefined') {
                console.error('[v0] Supabase JS library not loaded');
                return;
            }

            this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('[v0] Supabase client initialized');
            
            // Restore session from localStorage
            this.restoreSession();
            this.setupAuthStateListener();
        } catch (error) {
            console.error('[v0] Failed to initialize Supabase:', error);
        }
    }

    /**
     * Setup auth state change listener
     */
    setupAuthStateListener() {
        if (!this.client) return;

        const { data: { subscription } } = this.client.auth.onAuthStateChange((event, session) => {
            console.log('[v0] Auth state changed:', event);
            
            if (session) {
                this.user = session.user;
                this.session = session;
                this.saveSession(session);
                document.dispatchEvent(new CustomEvent('supabase:auth-change', { 
                    detail: { event, user: this.user } 
                }));
            } else {
                this.user = null;
                this.session = null;
                this.clearSession();
                document.dispatchEvent(new CustomEvent('supabase:auth-change', { 
                    detail: { event, user: null } 
                }));
            }
        });

        return subscription;
    }

    /**
     * Sign up with email and password
     */
    async signUp(email, password, metadata = {}) {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            
            console.log('[v0] Signing up:', email);
            
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                    emailRedirectTo: `${window.location.origin}/callback/`
                }
            });

            if (error) throw error;
            
            console.log('[v0] Sign up successful');
            return { data, error: null };
        } catch (error) {
            console.error('[v0] Sign up error:', error);
            return { data: null, error };
        }
    }

    /**
     * Sign in with email and password
     */
    async signInWithPassword(email, password) {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            
            console.log('[v0] Signing in:', email);
            
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            
            console.log('[v0] Sign in successful');
            return { data, error: null };
        } catch (error) {
            console.error('[v0] Sign in error:', error);
            return { data: null, error };
        }
    }

    /**
     * Sign in with OAuth provider
     */
    async signInWithOAuth(provider, redirectTo) {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            
            console.log('[v0] OAuth sign in:', provider);
            
            const { data, error } = await this.client.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectTo || `${window.location.origin}/callback/`
                }
            });

            if (error) throw error;
            
            console.log('[v0] OAuth sign in started');
            return { data, error: null };
        } catch (error) {
            console.error('[v0] OAuth error:', error);
            return { data: null, error };
        }
    }

    /**
     * Sign out user
     */
    async signOut() {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            
            console.log('[v0] Signing out');
            
            const { error } = await this.client.auth.signOut();
            
            if (error) throw error;
            
            // Notify Django backend
            await fetch('/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                }
            });
            
            console.log('[v0] Sign out successful');
            return { error: null };
        } catch (error) {
            console.error('[v0] Sign out error:', error);
            return { error };
        }
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            
            console.log('[v0] Requesting password reset:', email);
            
            const { data, error } = await this.client.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset/`
            });

            if (error) throw error;
            
            console.log('[v0] Password reset email sent');
            return { data, error: null };
        } catch (error) {
            console.error('[v0] Password reset error:', error);
            return { data: null, error };
        }
    }

    /**
     * Update user
     */
    async updateUser(attributes) {
        try {
            if (!this.client) throw new Error('Supabase client not initialized');
            
            console.log('[v0] Updating user');
            
            const { data, error } = await this.client.auth.updateUser(attributes);

            if (error) throw error;
            
            console.log('[v0] User updated');
            return { data, error: null };
        } catch (error) {
            console.error('[v0] Update user error:', error);
            return { data: null, error };
        }
    }

    /**
     * Get current session
     */
    getSession() {
        return this.session;
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.user && !!this.session;
    }

    /**
     * Get access token
     */
    getAccessToken() {
        return this.session?.access_token || null;
    }

    /**
     * Save session to localStorage
     */
    saveSession(session) {
        try {
            localStorage.setItem('supabase_session', JSON.stringify(session));
            console.log('[v0] Session saved');
        } catch (error) {
            console.warn('[v0] Could not save session:', error);
        }
    }

    /**
     * Restore session from localStorage
     */
    restoreSession() {
        try {
            const saved = localStorage.getItem('supabase_session');
            if (saved) {
                const session = JSON.parse(saved);
                this.session = session;
                this.user = session.user;
                console.log('[v0] Session restored');
            }
        } catch (error) {
            console.warn('[v0] Could not restore session:', error);
        }
    }

    /**
     * Clear session from localStorage
     */
    clearSession() {
        try {
            localStorage.removeItem('supabase_session');
            console.log('[v0] Session cleared');
        } catch (error) {
            console.warn('[v0] Could not clear session:', error);
        }
    }

    /**
     * Get CSRF token from page
     */
    getCsrfToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        
        return cookieValue;
    }
}

// Initialize global instance if Supabase config is available
let supabaseAuth = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get Supabase config from meta tags or window object
    const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content ||
                        window.SUPABASE_URL;
    const supabaseKey = document.querySelector('meta[name="supabase-key"]')?.content ||
                        window.SUPABASE_KEY;

    if (supabaseUrl && supabaseKey) {
        supabaseAuth = new SupabaseAuthClient(supabaseUrl, supabaseKey);
    } else {
        console.warn('[v0] Supabase configuration not found. Please add SUPABASE_URL and SUPABASE_KEY to your config.');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseAuthClient };
}
