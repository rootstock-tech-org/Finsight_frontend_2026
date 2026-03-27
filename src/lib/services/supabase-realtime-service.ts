import { supabase } from '../supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type RealtimeCallback<T extends Record<string, any> = any> = (payload: RealtimePostgresChangesPayload<T>) => void

export interface RealtimeSubscription {
  channel: RealtimeChannel
  table: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
}

export class SupabaseRealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map()

  // Subscribe to table changes
  subscribeToTable<T extends Record<string, any> = any>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    filter?: string,
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    const subscriptionKey = `${table}-${event}-${filter || 'all'}`
    
    // Unsubscribe if already exists
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribeFromTable(subscriptionKey)
    }

    const channel = supabase
      .channel(subscriptionKey)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        callback || (() => {})
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      channel,
      table,
      event,
      filter,
    }

    this.subscriptions.set(subscriptionKey, subscription)
    return channel
  }

  // Subscribe to user-specific data changes
  subscribeToUserData<T extends Record<string, any> = any>(
    table: string,
    userId: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    const filter = `user_id=eq.${userId}`
    return this.subscribeToTable(table, event, filter, callback)
  }

  // Subscribe to watchlist changes
  subscribeToWatchlist<T extends Record<string, any> = any>(
    userId: string,
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    return this.subscribeToUserData('watchlist', userId, '*', callback)
  }

  // Subscribe to analysis records changes
  subscribeToAnalysisRecords<T extends Record<string, any> = any>(
    userId: string,
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    return this.subscribeToUserData('analysis_records', userId, '*', callback)
  }

  // Subscribe to user profile changes
  subscribeToUserProfile<T extends Record<string, any> = any>(
    userId: string,
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    return this.subscribeToUserData('user_profiles', userId, '*', callback)
  }

  // Subscribe to specific stock symbol changes
  subscribeToStockSymbol<T extends Record<string, any> = any>(
    symbol: string,
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    const subscriptionKey = `stock-${symbol}`
    
    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribeFromTable(subscriptionKey)
    }

    const channel = supabase
      .channel(subscriptionKey)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'stocks',
          filter: `symbol=eq.${symbol}`,
        },
        callback || (() => {})
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      channel,
      table: 'stocks',
      event: '*',
      filter: `symbol=eq.${symbol}`,
    }

    this.subscriptions.set(subscriptionKey, subscription)
    return channel
  }

  // Subscribe to market data changes
  subscribeToMarketData<T extends Record<string, any> = any>(
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    return this.subscribeToTable('market_data', '*', undefined, callback)
  }

  // Subscribe to news updates
  subscribeToNews<T extends Record<string, any> = any>(
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    return this.subscribeToTable('news', '*', undefined, callback)
  }

  // Subscribe to notifications
  subscribeToNotifications<T extends Record<string, any> = any>(
    userId: string,
    callback?: RealtimeCallback<T>
  ): RealtimeChannel {
    return this.subscribeToUserData('notifications', userId, '*', callback)
  }

  // Unsubscribe from a specific table subscription
  unsubscribeFromTable(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey)
    if (subscription) {
      subscription.channel.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
    }
  }

  // Unsubscribe from all subscriptions
  unsubscribeFromAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.channel.unsubscribe()
    })
    this.subscriptions.clear()
  }

  // Get all active subscriptions
  getActiveSubscriptions(): RealtimeSubscription[] {
    return Array.from(this.subscriptions.values())
  }

  // Check if a subscription is active
  isSubscriptionActive(subscriptionKey: string): boolean {
    return this.subscriptions.has(subscriptionKey)
  }

  // Subscribe to custom channel
  subscribeToCustomChannel(
    channelName: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(channelName)
      .on('broadcast' as any, { event: '*' }, callback)
      .subscribe()

    return channel
  }

  // Send broadcast message to custom channel
  async sendBroadcast(
    channelName: string,
    event: string,
    payload: any
  ): Promise<{ error: any }> {
    try {
      await supabase
        .channel(channelName)
        .send({
          type: 'broadcast',
          event,
          payload,
        })

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Subscribe to presence (for collaborative features)
  subscribeToPresence(
    channelName: string,
    userId: string,
    userData: any,
    onPresenceChange?: (state: any) => void,
    onPresenceSync?: () => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(channelName, {
        config: {
          presence: {
            key: userId,
          },
        },
      })
.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
  onPresenceChange?.(newPresences)
})
.on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
  onPresenceChange?.(leftPresences)
})
      .subscribe(async (status: any) => { 
        if (status === 'SUBSCRIBED') {
          await channel.track(userData)
        }
      })

    return channel
  }

  // Get presence state
  async getPresenceState(channelName: string): Promise<{ data: any; error: any }> {
    try {
      const channel = supabase.channel(channelName)
      // Note: getPresence() method doesn't exist in current Supabase version
      // Return empty data for now
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Export singleton instance
export const supabaseRealtimeService = new SupabaseRealtimeService()
