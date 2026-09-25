import { SECURITY_CONFIG } from '../security.config';

const AUTH_SESSION_KEY = 'wayground_auth_session';
const AUTH_REMEMBER_KEY = 'wayground_auth_remember';

/**
 * Returns whether website password protection is enabled in code
 */
export function isProtectionActive(): boolean {
  return Boolean(SECURITY_CONFIG.IS_PROTECTED);
}

/**
 * Returns the configured password hint (if any)
 */
export function getPasswordHint(): string {
  return (SECURITY_CONFIG.HINT || '').trim();
}

/**
 * Check if the current browser session is authenticated.
 * When IS_PROTECTED is true, this ALWAYS returns false on page load / reload / refresh,
 * ensuring the lock screen always appears every time the page is opened or refreshed.
 */
export function isUserAuthenticated(): boolean {
  // Clear any legacy persistent storage tokens
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
  } catch {
    // ignore
  }

  // If protection is set to false in src/security.config.ts, web is completely unlocked
  if (!SECURITY_CONFIG.IS_PROTECTED) {
    return true;
  }

  // Always locked on every reload or fresh page open
  return false;
}

/**
 * Verify user password input strictly against the hardcoded password in src/security.config.ts
 */
export function verifyPassword(inputPassword: string): boolean {
  if (!SECURITY_CONFIG.IS_PROTECTED) {
    return true;
  }
  return inputPassword.trim() === SECURITY_CONFIG.PASSWORD.trim();
}

/**
 * Grant access to session
 * Deliberately does NOT persist to localStorage/sessionStorage so that every reload locks again.
 */
export function loginUser(_rememberDevice?: boolean): void {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
  } catch (err) {
    console.error('Auth cleanup error:', err);
  }
}

/**
 * Lock the web app and clear authentication tokens
 */
export function logoutUser(): void {
  try {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
  } catch (err) {
    console.error('Failed to clear auth session:', err);
  }
}
