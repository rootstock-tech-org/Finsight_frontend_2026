/**
 * fastapi-database-service.ts
 *
 * Drop-in replacement for supabase-database-service.ts.
 * All DB operations now go through FastAPI REST endpoints.
 * Static conversion helpers (commPref, stockFreq, subscriptionTier) are preserved
 * so any code that imports them continues to work unchanged.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// ── Types (identical to supabase-database-service.ts) ────────────────────────

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  mobile_number: string;
  communication_preference: number;
  stock_update_frequency: number;
  avatar_url?: string;
  subscription_tier: number;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfileExternal {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  mobile_number: string;
  communication_preference: 'whatsapp' | 'sms' | 'telegram';
  stock_update_frequency: 'daily' | 'weekly' | 'monthly';
  avatar_url?: string;
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  analysis_type: 'document' | 'url' | 'text';
  result: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  company_name?: string;
  added_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Fake error shape so callers that check .error still work
interface ApiError { message: string }

// ── Helper ────────────────────────────────────────────────────────────────────

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true", ...(options?.headers || {}) },
    
  });
}

// ── Service class ─────────────────────────────────────────────────────────────

export class FastAPIDatabaseService {

  // ── Static conversion maps (identical to original) ────────────────────────

  private static readonly commPrefMap: Record<string, number> = { whatsapp: 1, sms: 2, telegram: 3 };
  private static readonly commPrefReverseMap: Record<number, string> = { 1: 'whatsapp', 2: 'sms', 3: 'telegram' };
  private static readonly stockFreqMap: Record<string, number> = { daily: 1, weekly: 2, monthly: 3 };
  private static readonly stockFreqReverseMap: Record<number, string> = { 1: 'daily', 2: 'weekly', 3: 'monthly' };
  private static readonly subscriptionTierMap: Record<string, number> = { free: 1, basic: 2, premium: 3, enterprise: 4 };
  private static readonly subscriptionTierReverseMap: Record<number, string> = { 1: 'free', 2: 'basic', 3: 'premium', 4: 'enterprise' };

  static getCommPrefId(text: string): number { return this.commPrefMap[text] || 1; }
  static getCommPrefText(id: number): 'whatsapp' | 'sms' | 'telegram' {
    return (this.commPrefReverseMap[id] as any) || 'whatsapp';
  }
  static getStockFreqId(text: string): number { return this.stockFreqMap[text] || 1; }
  static getStockFreqText(id: number): 'daily' | 'weekly' | 'monthly' {
    return (this.stockFreqReverseMap[id] as any) || 'daily';
  }
  static getSubscriptionTierId(text: string): number { return this.subscriptionTierMap[text] || 1; }
  static getSubscriptionTierText(id: number): 'free' | 'basic' | 'premium' | 'enterprise' {
    return (this.subscriptionTierReverseMap[id] as any) || 'free';
  }

  static convertToExternal(profile: UserProfile): UserProfileExternal {
    return {
      ...profile,
      communication_preference: this.getCommPrefText(profile.communication_preference),
      stock_update_frequency: this.getStockFreqText(profile.stock_update_frequency),
      subscription_tier: this.getSubscriptionTierText(profile.subscription_tier),
    };
  }

  static convertToInternal(
    profile: Omit<UserProfileExternal, 'id' | 'created_at' | 'updated_at'>
  ): Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> {
    return {
      ...profile,
      communication_preference: this.getCommPrefId(profile.communication_preference),
      stock_update_frequency: this.getStockFreqId(profile.stock_update_frequency),
      subscription_tier: this.getSubscriptionTierId(profile.subscription_tier),
    };
  }

  // ── User Profiles ─────────────────────────────────────────────────────────

  async createUserProfile(
    profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: UserProfile | null; error: ApiError | null }> {
    try {
      const res = await apiFetch('/user_profiles/', {
        method: 'POST',
        body: JSON.stringify(profileData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: { message: err.detail || 'Create failed' } };
      }
      return { data: await res.json(), error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  async getUserProfile(
    userId: string,
    userMetadata?: any
  ): Promise<{ data: UserProfileExternal | null; error: ApiError | null }> {
    try {
      const res = await apiFetch(`/user_profiles/${userId}`);

      if (res.status === 404) {
        // Auto-create profile if metadata provided (mirrors original behaviour)
        if (userMetadata) {
          const firstName = userMetadata.first_name || userMetadata.firstName || '';
          const lastName  = userMetadata.last_name  || userMetadata.lastName  || '';
          const { data, error } = await this.createUserProfile({
            user_id: userId,
            email: userMetadata.email || '',
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            mobile_number: userMetadata.mobile_number || userMetadata.phone || '',
            communication_preference: 1,
            stock_update_frequency: 1,
            subscription_tier: 1,
            preferences: {},
            avatar_url: undefined,
          });
          if (error || !data) return { data: null, error };
          return { data: FastAPIDatabaseService.convertToExternal(data), error: null };
        }
        return { data: null, error: { message: 'Profile not found' } };
      }

      if (!res.ok) {
        return { data: null, error: { message: `HTTP ${res.status}` } };
      }

      const profile: UserProfile = await res.json();
      return { data: FastAPIDatabaseService.convertToExternal(profile), error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfileExternal>
  ): Promise<{ data: UserProfileExternal | null; error: ApiError | null }> {
    try {
      // First get the profile id (we need the PK, not the user_id)
      const { data: existing } = await this.getUserProfile(userId);
      if (!existing) return { data: null, error: { message: 'Profile not found' } };

      const internalUpdates: Partial<UserProfile> = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        full_name: updates.full_name,
        mobile_number: updates.mobile_number,
        avatar_url: updates.avatar_url,
        preferences: updates.preferences,
      };
      if (updates.communication_preference)
        internalUpdates.communication_preference = FastAPIDatabaseService.getCommPrefId(updates.communication_preference);
      if (updates.stock_update_frequency)
        internalUpdates.stock_update_frequency = FastAPIDatabaseService.getStockFreqId(updates.stock_update_frequency);
      if (updates.subscription_tier)
        internalUpdates.subscription_tier = FastAPIDatabaseService.getSubscriptionTierId(updates.subscription_tier);

      const res = await apiFetch(`/user_profiles/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(internalUpdates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: { message: err.detail || 'Update failed' } };
      }
      const updated: UserProfile = await res.json();
      return { data: FastAPIDatabaseService.convertToExternal(updated), error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  // ── Analysis Records ──────────────────────────────────────────────────────
  // Maps to FastAPI /analysis_results/ endpoints

  async createAnalysisRecord(
    record: Omit<AnalysisRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: AnalysisRecord | null; error: ApiError | null }> {
    try {
      const res = await apiFetch('/analysis_results/', {
        method: 'POST',
        body: JSON.stringify({
          user_id: record.user_id,
          doc_name: record.title,
          doc_type: record.analysis_type === 'document' ? 'AR' : record.analysis_type === 'url' ? 'IR' : 'OTH',
          summary: record.content || '',
          result: record.result,
          status: 'completed',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: { message: err.detail || 'Create failed' } };
      }
      const d = await res.json();
      return {
        data: {
          id: d.id, user_id: d.user_id,
          title: d.doc_name, content: d.summary,
          analysis_type: 'document',
          result: d.result || {},
          created_at: d.created_at, updated_at: d.created_at,
        },
        error: null,
      };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  async getUserAnalysisRecords(
    userId: string
  ): Promise<{ data: AnalysisRecord[] | null; error: ApiError | null }> {
    try {
      const res = await apiFetch(`/analysis_results/?user_id=${userId}&limit=50`);
      if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
      const items = await res.json();
      const records: AnalysisRecord[] = items.map((d: any) => ({
        id: d.id, user_id: d.user_id,
        title: d.doc_name, content: d.summary,
        analysis_type: 'document' as const,
        result: d.result || {},
        created_at: d.created_at, updated_at: d.created_at,
      }));
      return { data: records, error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  async deleteAnalysisRecord(
    id: string,
    userId?: string
  ): Promise<{ error: ApiError | null }> {
    try {
      const qs = userId ? `?user_id=${userId}` : '';
      const res = await apiFetch(`/analysis_results/${id}${qs}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: { message: err.detail || 'Delete failed' } };
      }
      return { error: null };
    } catch (e) {
      return { error: { message: String(e) } };
    }
  }

  // ── Watchlist ─────────────────────────────────────────────────────────────

  async addToWatchlist(
    item: Pick<WatchlistItem, 'user_id' | 'symbol' | 'company_name' | 'notes'>
  ): Promise<{ data: WatchlistItem | null; error: ApiError | null }> {
    try {
      const res = await apiFetch(`/watchlist/?user_id=${item.user_id}`, {
        method: 'POST',
        body: JSON.stringify({ symbol: item.symbol, notes: item.notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: { message: err.detail || 'Add failed' } };
      }
      const d = await res.json();
      return {
        data: {
          id: d.id, user_id: d.user_id, symbol: d.symbol || item.symbol,
          company_name: item.company_name,
          added_at: d.added_at || new Date().toISOString(),
          notes: d.notes,
          created_at: d.added_at || new Date().toISOString(),
          updated_at: d.added_at || new Date().toISOString(),
        },
        error: null,
      };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  async getUserWatchlist(
    userId: string
  ): Promise<{ data: WatchlistItem[] | null; error: ApiError | null }> {
    try {
      const res = await apiFetch(`/watchlist/${userId}`);
      if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}` } };
      const items = await res.json();
      const watchlist: WatchlistItem[] = items.map((d: any) => ({
        id: d.id, user_id: d.user_id, symbol: d.symbol || '',
        company_name: d.name,
        added_at: d.added_at,
        notes: d.notes,
        created_at: d.added_at,
        updated_at: d.added_at,
      }));
      return { data: watchlist, error: null };
    } catch (e) {
      return { data: null, error: { message: String(e) } };
    }
  }

  async removeFromWatchlist(
    id: string,
    userId?: string
  ): Promise<{ error: ApiError | null }> {
    try {
      const qs = userId ? `?user_id=${userId}` : '';
      const res = await apiFetch(`/watchlist/${id}${qs}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: { message: err.detail || 'Remove failed' } };
      }
      return { error: null };
    } catch (e) {
      return { error: { message: String(e) } };
    }
  }
}

// Export singleton + alias so existing imports work without change
export const fastapiDatabaseService = new FastAPIDatabaseService();
export const supabaseDatabaseService = fastapiDatabaseService; // backward-compat alias
export default fastapiDatabaseService;