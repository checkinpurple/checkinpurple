/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Social features types
export interface Follow {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  stream_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  stream_id: string;
  content: string;
  created_at: string;
  username?: string; // For display
}

// Analytics types
export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: string;
}

// API request/response types
export interface FollowRequest {
  followed_id: string;
}

export interface LikeRequest {
  stream_id: string;
}

export interface CommentRequest {
  stream_id: string;
  content: string;
}

export interface TrackAnalyticsRequest {
  event_type: string;
  event_data?: Record<string, any>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

// Subscription tiers types
export interface SubscriptionTier {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  track_limit?: number | null;
  profile_limit?: number;
  features: Record<string, any>;
  created_at: string;
}

// Payment methods
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'paypal' | 'fatpay' | 'stripe' | 'other';
  url?: string; // For PayPal personal URL
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  tier?: SubscriptionTier;
}

// Coin system types
export interface CoinPackage {
  id: string;
  name: string;
  description?: string;
  coin_amount: number;
  price_usd: number;
  is_active: boolean;
  created_at: string;
}

export interface UserCoins {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'tip' | 'bonus' | 'refund';
  amount: number;
  description?: string;
  reference_id?: string;
  created_at: string;
}

// Scheduled releases types
export interface ScheduledRelease {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  release_date: string;
  price_coins: number;
  max_bookings?: number;
  current_bookings: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  stream_id?: string;
  created_at: string;
}

export interface ReleaseBooking {
  id: string;
  release_id: string;
  user_id: string;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  created_at: string;
}

// Tips types
export interface Tip {
  id: string;
  from_user_id: string;
  to_user_id: string;
  stream_id?: string;
  amount: number;
  message?: string;
  created_at: string;
}

// Additional API request/response types
export interface PurchaseCoinsRequest {
  package_id: string;
}

export interface TipArtistRequest {
  to_user_id: string;
  stream_id?: string;
  amount: number;
  message?: string;
}

export interface CreateScheduledReleaseRequest {
  title: string;
  description?: string;
  release_date: string;
  price_coins?: number;
  max_bookings?: number;
}

export interface BookReleaseRequest {
  release_id: string;
}

export interface SubscriptionResponse {
  subscription: UserSubscription;
  tier: SubscriptionTier;
}

export type ProfileType = 'fan' | 'artist' | 'merchant' | 'influencer' | 'artist_fan';

export interface UserProfile {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  created_at: string;
}

export interface ArtistProfile {
  user_id: string;
  genre: string;
  explicit_content: boolean;
  is_dj: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtistEvent {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  created_at: string;
}

export type BookingRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface ArtistBookingRequest {
  id: string;
  fan_id: string;
  artist_id: string;
  requested_date?: string;
  message?: string;
  status: BookingRequestStatus;
  created_at: string;
}
