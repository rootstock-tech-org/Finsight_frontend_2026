// Test Supabase Connection
// Run this in your browser console to test the connection

async function testSupabaseConnection() {
    console.log('🧪 Testing Supabase Connection...');
    
    try {
        // Import the supabase client
        const { supabase } = await import('./src/lib/supabase.ts');
        
        console.log('🔧 Supabase URL:', supabase.supabaseUrl);
        console.log('🔑 Anon Key exists:', !!supabase.supabaseKey);
        console.log('🔑 Anon Key length:', supabase.supabaseKey?.length || 0);
        
        // Test a simple query
        const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
        
        if (error) {
            console.error('❌ Database Error:', error);
            return { success: false, error };
        } else {
            console.log('✅ Database connection successful!');
            return { success: true, data };
        }
    } catch (error) {
        console.error('💥 Connection Error:', error);
        return { success: false, error };
    }
}

// Test registration specifically
async function testRegistration() {
    console.log('🧪 Testing Registration...');
    
    try {
        const {fastapiAuthService} = await import('./src/lib/services/supabase-auth-service.ts');
        
        const testData = {
            email: `test${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            mobileNumber: '9876543210',
            communicationPreference: 'whatsapp',
            stockUpdateFrequency: 'daily'
        };
        
        console.log('📝 Test Data:', testData);
        
        const result = await supabaseAuthService.signUp(testData);
        
        if (result.error) {
            console.error('❌ Registration Error:', {
                message: result.error.message,
                status: result.error.status,
                statusText: result.error.statusText,
                name: result.error.name
            });
        } else {
            console.log('✅ Registration Success:', {
                userId: result.user?.id,
                email: result.user?.email
            });
        }
        
        return result;
    } catch (error) {
        console.error('💥 Registration Exception:', error);
        return { user: null, error };
    }
}

// Export functions
window.testSupabaseConnection = testSupabaseConnection;
window.testRegistration = testRegistration;

console.log('🚀 Test functions loaded. Run testSupabaseConnection() or testRegistration() to test.');
