import { createClient } from '@supabase/supabase-js';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getLocalJwt() {

  const email = '';
  const password = '';

  console.log(`Attempting to sign in user: ${email}`);

  // Sign in the user
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (signInError) {
    console.error('Error signing in:', signInError.message);
    console.log('Please ensure a user with this email and password exists in your LOCAL Supabase Auth.');
    console.log('You can sign up a user via the local Supabase Studio: http://127.0.0.1:54323');
  } else if (signInData.session) {
    const localJwt = signInData.session.access_token;
    console.log('\nSuccessfully obtained local JWT:');
    console.log(localJwt);
    console.log('\nUse this token in the Authorization: Bearer header for local function testing.');
  } else {
    console.log('Sign in successful, but no session data returned.');
  }
}

// Run the function
getLocalJwt();