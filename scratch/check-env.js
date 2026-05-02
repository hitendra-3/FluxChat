require('dotenv').config();
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'FOUND' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING');
console.log('SUPABASE_JWT_SECRET:', process.env.SUPABASE_JWT_SECRET ? 'FOUND' : 'MISSING');
