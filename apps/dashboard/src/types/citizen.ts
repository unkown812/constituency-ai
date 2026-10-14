export type SubmissionStatus =
  | "new"
  | "ai_processing"
  | "analyzed"
  | "under_review"
  | "resolved"
  | "closed";

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
  feedback?: { rating: number; comment?: string };
  created_at: string;
  updated_at: string;
  timeline?: TimelineEvent[];
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

export interface SubmissionListResponse {
  items: SubmissionSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
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

export interface Language {
  code: string;
  name_en: string;
  name_native: string;
}

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "new",
  "ai_processing",
  "analyzed",
  "under_review",
  "resolved",
  "closed",
];

export const STATUS_COLORS: Record<SubmissionStatus, string> = {
  new: "#41454d",
  ai_processing: "#1b61c9",
  analyzed: "#1b61c9",
  under_review: "#e58600",
  resolved: "#006400",
  closed: "#41454d",
};

export const CATEGORIES: Category[] = [
  { id: "roads", label_en: "Roads", icon: "Wrench" },
  { id: "water", label_en: "Water Supply", icon: "Droplet" },
  { id: "health", label_en: "Healthcare", icon: "Heart" },
  { id: "education", label_en: "Education", icon: "GraduationCap" },
  { id: "electricity", label_en: "Electricity", icon: "Zap" },
  { id: "sanitation", label_en: "Sanitation", icon: "ShieldCheck" },
  { id: "public_transport", label_en: "Public Transport", icon: "Bus" },
  { id: "other", label_en: "Other", icon: "AlertCircle" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  roads: "#1b61c9",
  water: "#06b6d4",
  health: "#fa3e3e",
  education: "#a855f7",
  electricity: "#f59e0b",
  sanitation: "#22c55e",
  public_transport: "#6366f1",
  other: "#6b7280",
};

export const LANGUAGES: Language[] = [
  { code: "en", name_en: "English", name_native: "English" },
  { code: "hi", name_en: "Hindi", name_native: "हिन्दी" },
  { code: "bn", name_en: "Bengali", name_native: "বাংলা" },
  { code: "ta", name_en: "Tamil", name_native: "தமிழ்" },
  { code: "te", name_en: "Telugu", name_native: "తెలుగు" },
  { code: "kn", name_en: "Kannada", name_native: "ಕನ್ನಡ" },
  { code: "mr", name_en: "Marathi", name_native: "मराठी" },
  { code: "gu", name_en: "Gujarati", name_native: "ગુજરાતી" },
];

export type MediaItem = {
  uri: string;
  type: "image" | "document";
  name?: string;
  file?: File;
};
