'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authenticate a user with email/password using Supabase.
 * Why: Centralizes sign-in logic so server actions can perform secure auth and return normalized errors.
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    // Surface an authentication-safe error message back to the client
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Register a new user with email/password using Supabase.
 * Why: Keeps registration on the server to avoid exposing secrets and to attach any user metadata at creation time.
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Terminate the current session.
 * Why: Ensures server-side cookie state is cleared and client receives a clean logout.
 */
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Return the current authenticated user from the server session.
 * Why: Use server-side session to avoid trusting client state.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Return the current Supabase session for the request.
 * Why: Some server components may need access to session claims for rendering decisions.
 */
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
