#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase Setup Helper');
console.log('========================\n');

console.log('📋 To complete your Supabase setup, follow these steps:\n');

console.log('1. 📖 Go to your Supabase dashboard:');
console.log('   https://supabase.com/dashboard/project/pfbcpqifhbqpymnagzss\n');

console.log('2. 🗄️  Navigate to SQL Editor in the left sidebar\n');

console.log('3. 📝 Copy the entire contents of supabase-schema.sql file\n');

console.log('4. 🚀 Paste it into the SQL Editor and click "Run"\n');
console.log('5. 🔧 If user signup fails, run the fix-trigger.sql script\n');

console.log('6. 🪣 Create storage buckets:');
console.log('   - Go to Storage in the left sidebar');
console.log('   - Create these buckets:');
console.log('     • finsight-files (public)');
console.log('     • finsight-documents (private)');
console.log('     • finsight-images (public)');
console.log('     • finsight-exports (private)');
console.log('     • finsight-temp (private)\n');

console.log('7. 🔐 Configure authentication:');
console.log('   - Go to Authentication > Settings');
console.log('   - Set Site URL to: http://localhost:3000');
console.log('   - Add redirect URLs:');
console.log('     • http://localhost:3000/auth/callback');
console.log('     • http://localhost:3000/dashboard');
console.log('     • http://localhost:3000/profile\n');

console.log('8. ✅ Test the connection:');
console.log('   - Start your dev server: npm run dev');
console.log('   - Go to /dashboard and click "Supabase Test" tab');
console.log('   - Click "Test Basic Connection"\n');

console.log('🎉 Once completed, your app will be fully connected to Supabase!\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Note: .env.local file is not accessible (this is normal for security)');
  console.log('   Your Supabase credentials are already configured in the code.\n');
}

console.log('📚 For more details, see SUPABASE_SETUP.md\n');
