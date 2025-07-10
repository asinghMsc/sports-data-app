// c:\Users\Amrit\datasimo\challenges\sports-data-app\get-production-jwt.mjs
import { createClient } from '@supabase/supabase-js';

// !!! IMPORTANT !!!
// Use your PRODUCTION Supabase URL and ANON key from your Supabase dashboard -> Project Settings -> API

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getProductionJwt() {
  // !!! IMPORTANT !!!
  // Replace with the email and password of a user that exists in your PRODUCTION Supabase Auth
  // You might need to sign up a user first via your deployed application or Supabase Studio
  const email = ''; // Replace with actual production user email
  const password = ''; // Replace with actual production user password

  console.log(`Attempting to sign in production user: ${email}`);

  // Sign in the user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (signInError) {
    console.error('Error signing in to production:', signInError.message);
    console.log('Please ensure a user with this email and password exists in your PRODUCTION Supabase Auth.');
  } else if (signInData.session) {
    const productionJwt = signInData.session.access_token;
    console.log('\nSuccessfully obtained production JWT:');
    console.log(productionJwt);
    console.log('\nUse this token in the Authorization: Bearer header for production function testing.');
  } else {
    console.log('Production sign in successful, but no session data returned.');
  }
}

// Run the function
getProductionJwt();
