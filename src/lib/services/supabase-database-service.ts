import { supabase } from '../supabase'
import { PostgrestError } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  full_name?: string
  mobile_number: string
  communication_preference: number // Integer ID for communication preference
  stock_update_frequency: number // Integer ID for stock update frequency
  avatar_url?: string
  subscription_tier: number // Integer ID for subscription tier
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

// External interface for API consumers (uses text values)
export interface UserProfileExternal {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  full_name?: string
  mobile_number: string
  communication_preference: 'whatsapp' | 'sms' | 'telegram'
  stock_update_frequency: 'daily' | 'weekly' | 'monthly'
  avatar_url?: string
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise'
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AnalysisRecord {
  id: string
  user_id: string
  title: string
  content?: string
  analysis_type: 'document' | 'url' | 'text'
  result: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface WatchlistItem {
  id: string
  user_id: string
  symbol: string
  company_name?: string
  added_at: string
  notes?: string
  created_at: string
  updated_at: string
}

export class SupabaseDatabaseService {
  // Mapping functions for communication preferences
  private static readonly commPrefMap: { [key: string]: number } = {
    'whatsapp': 1,
    'sms': 2,
    'telegram': 3
  };

  private static readonly commPrefReverseMap: { [key: number]: string } = {
    1: 'whatsapp',
    2: 'sms',
    3: 'telegram'
  };

  // Mapping functions for stock update frequencies
  private static readonly stockFreqMap: { [key: string]: number } = {
    'daily': 1,
    'weekly': 2,
    'monthly': 3
  };

  private static readonly stockFreqReverseMap: { [key: number]: string } = {
    1: 'daily',
    2: 'weekly',
    3: 'monthly'
  };

  // Mapping functions for subscription tiers
  private static readonly subscriptionTierMap: { [key: string]: number } = {
    'free': 1,
    'basic': 2,
    'premium': 3,
    'enterprise': 4
  };

  private static readonly subscriptionTierReverseMap: { [key: number]: string } = {
    1: 'free',
    2: 'basic',
    3: 'premium',
    4: 'enterprise'
  };

  // Helper methods for conversion
  static getCommPrefId(text: string): number {
    return this.commPrefMap[text] || 1; // Default to whatsapp
  }

  static getCommPrefText(id: number): 'whatsapp' | 'sms' | 'telegram' {
    return (this.commPrefReverseMap[id] as 'whatsapp' | 'sms' | 'telegram') || 'whatsapp';
  }

  static getStockFreqId(text: string): number {
    return this.stockFreqMap[text] || 1; // Default to daily
  }

  static getStockFreqText(id: number): 'daily' | 'weekly' | 'monthly' {
    return (this.stockFreqReverseMap[id] as 'daily' | 'weekly' | 'monthly') || 'daily';
  }

  static getSubscriptionTierId(text: string): number {
    return this.subscriptionTierMap[text] || 1; // Default to free
  }

  static getSubscriptionTierText(id: number): 'free' | 'basic' | 'premium' | 'enterprise' {
    return (this.subscriptionTierReverseMap[id] as 'free' | 'basic' | 'premium' | 'enterprise') || 'free';
  }

  // Convert internal profile to external format
  static convertToExternal(profile: UserProfile): UserProfileExternal {
    return {
      ...profile,
      communication_preference: this.getCommPrefText(profile.communication_preference),
      stock_update_frequency: this.getStockFreqText(profile.stock_update_frequency),
      subscription_tier: this.getSubscriptionTierText(profile.subscription_tier)
    };
  }

  // Convert external profile to internal format
  static convertToInternal(profile: Omit<UserProfileExternal, 'id' | 'created_at' | 'updated_at'>): Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> {
    return {
      ...profile,
      communication_preference: this.getCommPrefId(profile.communication_preference),
      stock_update_frequency: this.getStockFreqId(profile.stock_update_frequency),
      subscription_tier: this.getSubscriptionTierId(profile.subscription_tier)
    };
  }
  async createUserProfile(profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
    try {
      console.log('🔧 Creating user profile:', profileData);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user profile:', error);
        return { data: null, error };
      }

      console.log('✅ User profile created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Exception creating user profile:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  async getUserProfile(userId: string, userMetadata?: any): Promise<{ data: UserProfileExternal | null; error: PostgrestError | null }> {
    try {
      console.log('🔍 Fetching profile for user ID:', userId);
      
      // First check if profile exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);

      if (checkError) {
        console.error('❌ Error checking profile existence:', checkError);
        return { data: null, error: checkError };
      }

      console.log('📊 Found profiles:', existingProfiles?.length || 0);

      if (!existingProfiles || existingProfiles.length === 0) {
        console.log('⚠️ No profile found for user, creating one...');
        
        // Extract user details from provided metadata or use defaults
        const firstName = userMetadata?.first_name || userMetadata?.firstName || '';
        const lastName = userMetadata?.last_name || userMetadata?.lastName || '';
        const email = userMetadata?.email || '';
        const mobileNumber = userMetadata?.mobile_number || userMetadata?.mobileNumber || userMetadata?.phone || '';
        
        // Create a default profile with actual user data
        const defaultProfile = {
          user_id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          mobile_number: mobileNumber,
          communication_preference: 1, // 1 = whatsapp (default)
          stock_update_frequency: 1, // 1 = daily (default)
          subscription_tier: 1, // 1 = free (default)
          preferences: {}
        };

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')  
          .insert(defaultProfile)
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          return { data: null, error: createError };
        }

        console.log('✅ Created new profile:', newProfile);
        return { data: SupabaseDatabaseService.convertToExternal(newProfile), error: null };
      }

      if (existingProfiles.length > 1) {
        console.warn('⚠️ Multiple profiles found, using the first one');
        // Use the first profile and log a warning
        return { data: SupabaseDatabaseService.convertToExternal(existingProfiles[0]), error: null };
      }

      // Check if existing profile has empty fields and update with user metadata
      const existingProfile = existingProfiles[0];
      const needsUpdate = !existingProfile.first_name || !existingProfile.last_name || !existingProfile.email || !existingProfile.mobile_number;
      
      if (needsUpdate && userMetadata) {
        
        // Extract user details from metadata
        const firstName = userMetadata.first_name || userMetadata.firstName || existingProfile.first_name || '';
        const lastName = userMetadata.last_name || userMetadata.lastName || existingProfile.last_name || '';
        const email = userMetadata.email || existingProfile.email || '';
        const mobileNumber = userMetadata.mobile_number || userMetadata.mobileNumber || userMetadata.phone || existingProfile.mobile_number || '';
        
        // Update the profile with correct data
        const updateData = {
          first_name: firstName,
          last_name: lastName,
          email: email,
          mobile_number: mobileNumber,
          full_name: `${firstName} ${lastName}`.trim()
        };
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
          // Return existing profile even if update failed
          return { data: SupabaseDatabaseService.convertToExternal(existingProfile), error: null };
        }
        
        return { data: SupabaseDatabaseService.convertToExternal(updatedProfile), error: null };
      }
      
      // Return the existing profile as-is
      return { data: SupabaseDatabaseService.convertToExternal(existingProfile), error: null };

    } catch (error) {
      console.error('💥 Exception in getUserProfile:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfileExternal>): Promise<{ data: UserProfileExternal | null; error: PostgrestError | null }> {
    try {
      // Convert text values to integer IDs for database update
      const internalUpdates: Partial<UserProfile> = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        full_name: updates.full_name,
        mobile_number: updates.mobile_number,
        email: updates.email,
        avatar_url: updates.avatar_url,
        preferences: updates.preferences
      };
      
      if (updates.communication_preference) {
        internalUpdates.communication_preference = SupabaseDatabaseService.getCommPrefId(updates.communication_preference);
      }
      
      if (updates.stock_update_frequency) {
        internalUpdates.stock_update_frequency = SupabaseDatabaseService.getStockFreqId(updates.stock_update_frequency);
      }

      if (updates.subscription_tier) {
        internalUpdates.subscription_tier = SupabaseDatabaseService.getSubscriptionTierId(updates.subscription_tier);
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(internalUpdates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        return { data: null, error };
      }

      // Convert back to external format
      return { data: data ? SupabaseDatabaseService.convertToExternal(data) : null, error: null };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  // Analysis Records
  async createAnalysisRecord(record: Omit<AnalysisRecord, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: AnalysisRecord | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('analysis_records')
        .insert(record)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async getUserAnalysisRecords(userId: string): Promise<{ data: AnalysisRecord[] | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('analysis_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async updateAnalysisRecord(id: string, updates: Partial<AnalysisRecord>): Promise<{ data: AnalysisRecord | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('analysis_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async deleteAnalysisRecord(id: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from('analysis_records')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as PostgrestError }
    }
  }

  // Watchlist
  async addToWatchlist(item: Omit<WatchlistItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: WatchlistItem | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert(item)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async getUserWatchlist(userId: string): Promise<{ data: WatchlistItem[] | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async removeFromWatchlist(id: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as PostgrestError }
    }
  }

  // Generic CRUD operations
  async createRecord<T>(table: string, record: Partial<T>): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(record)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async getRecord<T>(table: string, id: string): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async updateRecord<T>(table: string, id: string, updates: Partial<T>): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }

  async deleteRecord(table: string, id: string): Promise<{ error: PostgrestError | null }> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as PostgrestError }
    }
  }

  async listRecords<T>(table: string, filters?: Record<string, any>): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    try {
      let query = supabase.from(table).select('*')

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { data, error } = await query

      return { data, error }
    } catch (error) {
      return { data: null, error: error as PostgrestError }
    }
  }
}

// Export singleton instance
export const supabaseDatabaseService = new SupabaseDatabaseService()
