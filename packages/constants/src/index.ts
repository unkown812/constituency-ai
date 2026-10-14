export const COMPLAINT_CATEGORIES = [
  'roads',
  'water',
  'sanitation',
  'electricity',
  'healthcare',
  'education',
  'public_safety',
  'housing',
  'environment',
  'other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = [
  'pending',
  'in_review',
  'in_progress',
  'resolved',
  'rejected',
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const PROJECT_STATUSES = [
  'proposed',
  'approved',
  'in_progress',
  'completed',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ur', name: 'Urdu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'or', name: 'Odia' },
  { code: 'pa', name: 'Punjabi' },
] as const;

export const USER_ROLES = ['citizen', 'admin', 'mp'] as const;
export type UserRole = (typeof USER_ROLES)[number];