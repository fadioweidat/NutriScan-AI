import dotenv from 'dotenv';
dotenv.config();

console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY:", process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 15) + "...");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 15) + "...");

// Let's decode the JWT if it is one
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (key && key.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
    console.log("Service role payload role:", payload.role);
  } catch (e) {
    console.error("Not a valid JWT");
  }
} else {
  console.log("Key does not start with eyJ. Not a standard JWT.");
}
