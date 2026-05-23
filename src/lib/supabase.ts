import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get or create a persistent guest session using email-based auth
// Uses localStorage to persist the guest credentials across sessions
export async function ensureGuestSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;

  // Check for existing guest credentials
  const guestEmail = localStorage.getItem('pocketdeck_guest_email');
  const guestPassword = localStorage.getItem('pocketdeck_guest_password');

  if (guestEmail && guestPassword) {
    // Try to sign in with existing guest account
    const { error } = await supabase.auth.signInWithPassword({
      email: guestEmail,
      password: guestPassword,
    });
    if (!error) return;
    // If sign in fails, clear and create new
    localStorage.removeItem('pocketdeck_guest_email');
    localStorage.removeItem('pocketdeck_guest_password');
  }

  // Create new guest account
  const guestId = crypto.randomUUID();
  const email = `guest_${guestId.replace(/-/g, '')}@pocketdeck.local`;
  const password = `Guest_${guestId.slice(0, 16)}!`;

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        is_guest: true,
      },
    },
  });

  if (signUpError) {
    console.error('Failed to create guest session:', signUpError);
    return;
  }

  // Store credentials for future use
  localStorage.setItem('pocketdeck_guest_email', email);
  localStorage.setItem('pocketdeck_guest_password', password);
}
