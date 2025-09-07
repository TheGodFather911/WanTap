// This file configures and exports the Supabase client.

// The Supabase client is loaded from a script tag in index.html,
// so we can access it from the window object.
// @ts-ignore
const { createClient } = window.supabase;

const supabaseUrl = 'https://okibppvjncnwbqsqwctx.supabase.co';
// The key was malformed in the prompt, it has been corrected here.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9raWJwcHZqbmNud2Jxc3F3Y3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjQ1ODEsImV4cCI6MjA3Mjg0MDU4MX0.CIV3lsQnvaFQSIJn2vxOfjsdPqYyLVmrM3Vl8WRfa6I';

// It is highly recommended to use environment variables for these values in a production environment.
// For example:
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
// const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and API Key are required.");
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);
