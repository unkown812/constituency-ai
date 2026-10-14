export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  constituency_id: string;
  constituency_name: string;
  preferred_language: string;
  notification_enabled: boolean;
  created_at: string;
}

export type SubmissionStatus =
  | 'new'
  | 'ai_processing'
  | 'analyzed'
  | 'under_review'
  | 'resolved'
  | 'closed';

export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface TimelineEvent {
  event: string;
  label: string;
  date: string;
  icon: string;
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  original_description?: string;
  original_language?: string;
  category: string;
  status: SubmissionStatus;
  location: Location;
  address?: string;
  ward?: string;
  image_urls: string[];
  thumbnail_url?: string;
  image_count?: number;
  document_url?: string;
  voice_url?: string;
  voice_transcript?: string;
  ai_summary?: string;
  ai_confidence?: number;
  feedback?: 'thumbs_up' | 'thumbs_down' | null;
  created_at: string;
  updated_at: string;
  timeline?: TimelineEvent[];
}

export interface SubmissionListResponse {
  items: SubmissionSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SubmissionSummary {
  id: string;
  title: string;
  category: string;
  status: SubmissionStatus;
  location: Location;
  thumbnail_url?: string;
  image_count: number;
  created_at: string;
  updated_at: string;
}

export interface SubmissionStats {
  total: number;
  this_month: number;
  by_status: Record<SubmissionStatus, number>;
  resolved_this_month: number;
  under_review: number;
}

export interface Category {
  id: string;
  label_en: string;
  icon: string;
}

export interface Language {
  code: string;
  name_en: string;
  name_native: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface SendOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    full_name: string | null;
    phone: string;
    role: string;
    is_new_user: boolean;
  };
}

export interface CreateSubmissionPayload {
  category: string;
  description: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  image_urls?: string[];
  document_url?: string;
  voice_url?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  preferred_language?: string;
  notification_enabled?: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  submission_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unread_count: number;
  total: number;
  page: number;
  limit: number;
}

export interface UploadResponse {
  url: string;
  thumbnail_url?: string;
  file_type: string;
  file_size: number;
  original_name: string;
}

export interface TranscribeResponse {
  url: string;
  transcript: string;
  transcript_en: string;
  duration_seconds: number;
  detected_language: string;
}

export interface ApiError {
  detail: string;
  code: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
