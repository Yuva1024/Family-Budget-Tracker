import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** True when env vars are set — otherwise app runs in demo mode */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Simple in-memory lock that replaces navigator.locks.
 * Prevents the "Lock broken by another request with the 'steal' option"
 * AbortError that occurs when multiple tabs or React re-renders compete
 * for the same navigator.locks Web Lock.
 */
const inMemoryLocks = new Map<string, Promise<unknown>>();

async function simpleLock<T>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>,
): Promise<T> {
  // Wait for any existing lock on this name to release
  const existing = inMemoryLocks.get(name);
  if (existing) {
    try { await existing; } catch { /* ignore */ }
  }
  // Run the function and track it
  const promise = fn();
  inMemoryLocks.set(name, promise);
  try {
    return await promise;
  } finally {
    // Clean up if this is still the current lock holder
    if (inMemoryLocks.get(name) === promise) {
      inMemoryLocks.delete(name);
    }
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: simpleLock,
    },
  })
  : null;
