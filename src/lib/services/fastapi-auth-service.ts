/**
 * fastapi-auth-service.ts
 *
 * Auth strategy: localStorage session (user_id) + cookie for middleware.
 * Cookie allows Next.js middleware to gate protected routes server-side.
 */

import { useAuthStore, FinSightUser } from '@/lib/store/auth-store';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const SESSION_KEY = 'finsight_user_id';
const SESSION_COOKIE = 'finsight_user_id';

const DEFAULT_ADMIN_ENTITY_ID = '00000000-0000-0000-0000-000000000001';

const COMM_PREF_MAP: Record<string, number> = { whatsapp: 1, sms: 2, telegram: 3 };
const STOCK_FREQ_MAP: Record<string, number> = { daily: 1, weekly: 2, monthly: 3 };
const COMM_PREF_REVERSE: Record<number, string> = { 1: 'whatsapp', 2: 'sms', 3: 'telegram' };
const STOCK_FREQ_REVERSE: Record<number, string> = { 1: 'daily', 2: 'weekly', 3: 'monthly' };
const TIER_REVERSE: Record<number, string> = { 1: 'free', 2: 'basic', 3: 'premium', 4: 'enterprise' };

export interface SignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  communicationPreference: 'whatsapp' | 'sms' | 'telegram';
  stockUpdateFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  user: FinSightUser | null;
  error: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function profileToUser(p: Record<string, any>): FinSightUser {
  return {
    id: p.id,
    user_id: p.user_id || p.id,
    email: p.email,
    first_name: p.first_name,
    last_name: p.last_name,
    full_name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    mobile_number: p.mobile_number,
    role_id: p.role_id,
    is_active: p.is_active,
    is_locked: p.is_locked,
    subscription_tier: p.subscription_tier,
    communication_preference: p.communication_preference,
    stock_update_frequency: p.stock_update_frequency,
    avatar_url: p.avatar_url,
    preferences: p.preferences || {},
    admin_entity_id: p.admin_entity_id,
  };
}

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      "ngrok-skip-browser-warning": "true",  // ← mandatory
      ...(options?.headers || {}),
    },
  });
}

// Sets a cookie readable by Next.js middleware
function setSessionCookie(userId: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${SESSION_COOKIE}=${userId}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class FastAPIAuthService {

  // ── Register ──────────────────────────────────────────────────────────────

  async signUp({
    email,
    firstName,
    lastName,
    mobileNumber,
    communicationPreference,
    stockUpdateFrequency,
  }: SignUpParams): Promise<AuthResult> {
    try {
      const userId = crypto.randomUUID();

      const payload = {
        user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        mobile_number: mobileNumber,
        communication_preference: COMM_PREF_MAP[communicationPreference] ?? 1,
        stock_update_frequency: STOCK_FREQ_MAP[stockUpdateFrequency] ?? 1,
        admin_entity_id: DEFAULT_ADMIN_ENTITY_ID,
        is_active: true,
        is_email_verified: false,
        is_phone_verified: false,
        role_id: 1,
        subscription_tier: 1,
      };

      const res = await apiFetch('/user_profiles/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { user: null, error: err.detail || 'Registration failed' };
      }

      const profile = await res.json();
      const user = profileToUser(profile);

      localStorage.setItem(SESSION_KEY, user.user_id);
      setSessionCookie(user.user_id);
      useAuthStore.getState().setUser(user);

      return { user, error: null };
    } catch (e) {
      console.error('signUp error:', e);
      return { user: null, error: 'Network error during registration' };
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async signIn({ email }: SignInParams): Promise<AuthResult> {
    try {
      const res = await apiFetch(`/user_profiles/?only_active=false`);

      if (!res.ok) {
        return { user: null, error: 'Failed to reach authentication service' };
      }

      const profiles: Record<string, any>[] = await res.json();
      const match = profiles.find(
        (p) => p.email?.toLowerCase() === email.toLowerCase()
      );

      if (!match) {
        return { user: null, error: 'No account found with this email' };
      }

      if (match.is_locked) {
        return { user: null, error: 'Account is locked. Please contact support.' };
      }

      const user = profileToUser(match);
      localStorage.setItem(SESSION_KEY, user.user_id);
      setSessionCookie(user.user_id);
      useAuthStore.getState().setUser(user);

      return { user, error: null };
    } catch (e) {
      console.error('signIn error:', e);
      return { user: null, error: 'Network error during login' };
    }
  }

  // ── Restore session on app load ───────────────────────────────────────────
  // Called once on mount. Sets isHydrated=true when done so pages know
  // whether to redirect or wait.

  async restoreSession(): Promise<AuthResult> {
    const { setUser, setHydrated } = useAuthStore.getState();
    try {
      const userId = localStorage.getItem(SESSION_KEY);
      if (!userId) {
        setHydrated(true);
        return { user: null, error: null };
      }

      const res = await apiFetch(`/user_profiles/${userId}`);
      if (!res.ok) {
        localStorage.removeItem(SESSION_KEY);
        clearSessionCookie();
        setHydrated(true);
        return { user: null, error: null };
      }

      const profile = await res.json();
      const user = profileToUser(profile);
      setUser(user);
      setSessionCookie(user.user_id); // refresh cookie expiry
      setHydrated(true);
      return { user, error: null };
    } catch (e) {
      console.error('restoreSession error:', e);
      setHydrated(true); // always unblock the app even on network error
      return { user: null, error: null };
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────

  async signOut(): Promise<{ error: string | null }> {
    localStorage.removeItem(SESSION_KEY);
    clearSessionCookie();
    useAuthStore.getState().logout();
    return { error: null };
  }

  // ── Get current user ──────────────────────────────────────────────────────

  getCurrentUser(): FinSightUser | null {
    return useAuthStore.getState().user;
  }

  // ── Update profile ────────────────────────────────────────────────────────

  async updateProfile(
    profileId: string,
    updates: {
      first_name?: string;
      last_name?: string;
      mobile_number?: string;
      avatar_url?: string;
      preferences?: Record<string, any>;
    }
  ): Promise<AuthResult> {
    try {
      const res = await apiFetch(`/user_profiles/${profileId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { user: null, error: err.detail || 'Profile update failed' };
      }

      const profile = await res.json();
      const user = profileToUser(profile);
      useAuthStore.getState().setUser(user);

      return { user, error: null };
    } catch (e) {
      console.error('updateProfile error:', e);
      return { user: null, error: 'Network error during profile update' };
    }
  }

  // ── Deactivate account ────────────────────────────────────────────────────

  async deactivateAccount(userId: string): Promise<{ error: string | null }> {
    try {
      const res = await apiFetch(`/user_profiles/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.detail || 'Deactivation failed' };
      }
      await this.signOut();
      return { error: null };
    } catch (e) {
      return { error: 'Network error during deactivation' };
    }
  }

  // ── Utility maps ──────────────────────────────────────────────────────────

  getCommPrefText(id: number): string { return COMM_PREF_REVERSE[id] || 'whatsapp'; }
  getStockFreqText(id: number): string { return STOCK_FREQ_REVERSE[id] || 'daily'; }
  getSubscriptionTierText(id: number): string { return TIER_REVERSE[id] || 'free'; }
}

export const fastapiAuthService = new FastAPIAuthService();
export default fastapiAuthService;