import { Timestamp } from 'firebase/firestore';

// ============================================================================
// USER TYPES
// ============================================================================

export type Locale = 'he-IL' | 'en-US';
export type DarkModePreference = 'auto' | 'light' | 'dark';
export type SubscriptionTier = 'free' | 'pro' | 'family' | 'therapist';

export interface UserSettings {
  darkMode: DarkModePreference;
  notifications: {
    messages: boolean;
    events: boolean;
  };
  aiInsights: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  timezone: string; // e.g., "Asia/Jerusalem"
  locale: Locale;
  subscriptionTier: SubscriptionTier;
  createdAt: Timestamp;
  settings: UserSettings;
  // Encryption keys (stored encrypted with user's password)
  publicKey?: string; // RSA public key (PEM format)
  encryptedPrivateKey?: string; // RSA private key encrypted with user password
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageType = 'text' | 'audio' | 'video' | 'image';
export type EmotionTone =
  | 'encouragement'
  | 'gratitude'
  | 'reflection'
  | 'farewell'
  | 'hope'
  | 'other';
export type AIEmotion =
  | 'positive'
  | 'calm'
  | 'grieving'
  | 'nostalgic'
  | 'hopeful';
export type MessageVisibility = 'private' | 'shared';

export interface MessageEncryption {
  scheme: 'e2ee-envelope';
  encryptedKeyFor: Record<string, string>; // { userId: encryptedKey }
  algo: 'AES-GCM-256';
  iv?: string; // Initialization vector for AES-GCM
}

export interface Message {
  id: string;
  ownerId: string; // Creator of the message
  recipientIds: string[]; // Self / other users / group
  type: MessageType;
  title?: string;
  content?: string; // Encrypted text content
  mediaURL?: string; // Firebase Storage path (encrypted)
  emotionTone: EmotionTone;
  aiEmotion?: AIEmotion;
  aiKeywords?: string[]; // AI-extracted keywords (encrypted)
  createdAt: Timestamp;
  openDate: Timestamp; // When the message can be opened
  isOpened: boolean;
  openedAt?: Timestamp;
  capsuleGroupId?: string; // For group capsules
  visibility: MessageVisibility;
  encryption: MessageEncryption;
  replyToMessageId?: string; // For "reply to past self"
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type EventKind =
  | 'birthday'
  | 'anniversary'
  | 'memorial_person'
  | 'memorial_pet'
  | 'personal_milestone';
export type EmotionTag = 'happy' | 'calm' | 'memory' | 'longing';

export interface Event {
  id: string;
  userId: string;
  kind: EventKind;
  title: string;
  date: Timestamp; // Next occurrence anchor
  recurring: boolean; // Yearly recurrence
  emotionTag: EmotionTag;
  description?: string;
  mediaURL?: string;
  createdAt: Timestamp;
  visibility: MessageVisibility;
  // Icons mapped to kinds
  icon?: string; // Emoji: 🎂 💍 🕯️ 🐾 ✨
}

// ============================================================================
// CAPSULE TYPES
// ============================================================================

export interface Capsule {
  id: string;
  ownerId: string;
  participantIds: string[];
  title: string;
  description?: string;
  openDate: Timestamp;
  createdAt: Timestamp;
  isOpened: boolean;
  openedAt?: Timestamp;
  // Track who has opened
  openedBy: string[]; // User IDs who have viewed
}

// ============================================================================
// INSIGHTS TYPES
// ============================================================================

export type InsightPeriod = 'monthly' | 'weekly';

export interface Insight {
  id: string;
  userId: string;
  period: InsightPeriod;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  emotionStats: Record<string, number>; // { tone: count }
  topThemes: string[]; // Keywords or topics
  messageCount: number;
  summaryTextHe?: string;
  summaryTextEn?: string;
  createdAt: Timestamp;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | 'message_open'
  | 'event_upcoming'
  | 'capsule_open'
  | 'insight_ready';

export interface NotificationTemplate {
  type: NotificationType;
  titleHe: string;
  titleEn: string;
  bodyHe: string;
  bodyEn: string;
}

export interface PushNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledFor?: Timestamp;
  sentAt?: Timestamp;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export type AnalyticsEventType =
  | 'message_create'
  | 'message_open'
  | 'event_create'
  | 'capsule_create'
  | 'ai_prompt_used'
  | 'timeline_scroll'
  | 'subscription_upgrade';

export interface AnalyticsEvent {
  userId: string;
  eventType: AnalyticsEventType;
  timestamp: Timestamp;
  metadata?: Record<string, any>; // No sensitive content
}

// ============================================================================
// INVITATION TYPES
// ============================================================================

export interface Invitation {
  id: string;
  fromUserId: string;
  toEmail: string;
  messageId?: string; // If inviting to read a message
  capsuleId?: string; // If inviting to a capsule
  createdAt: Timestamp;
  expiresAt: Timestamp;
  accepted: boolean;
  acceptedAt?: Timestamp;
}

// ============================================================================
// FEATURE FLAGS & ADMIN
// ============================================================================

export interface FeatureFlags {
  aiInsights: boolean;
  groupCapsules: boolean;
  videoMessages: boolean;
  therapistMode: boolean;
}

export interface AdminConfig {
  maintenanceMode: boolean;
  featureFlags: FeatureFlags;
  subscriptionLimits: {
    free: {
      maxMessages: number;
      maxMediaSizeMB: number;
      canUseAudio: boolean;
      canUseVideo: boolean;
      maxCapsuleParticipants: number;
    };
    pro: {
      maxMessages: number;
      maxMediaSizeMB: number;
      canUseAudio: boolean;
      canUseVideo: boolean;
      maxCapsuleParticipants: number;
    };
    family: {
      maxMessages: number;
      maxMediaSizeMB: number;
      canUseAudio: boolean;
      canUseVideo: boolean;
      maxCapsuleParticipants: number;
    };
  };
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type CubeFace = 'front' | 'top' | 'bottom' | 'timeline';

export interface CubeState {
  currentFace: CubeFace;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  isAnimating: boolean;
}

export interface TimelineFilter {
  type?: 'messages' | 'events' | 'capsules' | 'all';
  emotionTone?: EmotionTone;
  recipients?: 'self' | 'other' | 'group' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AIPromptResponse {
  suggestions: string[];
  tone?: EmotionTone;
  emotion?: AIEmotion;
  keywords?: string[];
}

export interface AIAnalysisResponse {
  emotion: AIEmotion;
  tone: EmotionTone;
  keywords: string[];
  confidence: number;
}

// ============================================================================
// CLIENT-SIDE DECRYPTED TYPES
// ============================================================================

// These types represent decrypted data on the client side
export interface DecryptedMessage extends Omit<Message, 'content' | 'encryption'> {
  content: string; // Decrypted
  decryptedMediaURL?: string; // Decrypted URL
}

export interface DecryptedCapsule extends Capsule {
  messages: DecryptedMessage[];
}
