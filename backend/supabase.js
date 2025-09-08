const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

// Client for user operations (uses anon key) with optimized settings
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false, // Disable session persistence for server-side
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
    },
  },
});

// Admin client for server operations (uses service role key) with optimized settings
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
    },
  },
});

module.exports = { supabase, supabaseAdmin };

