export const CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
  API_PREFIX: '/api/v1',
  MAX_IMAGES: 3,
  MAX_DOCUMENTS: 1,
  MAX_FILE_SIZE_MB: 50,
  SUBMISSION_DESCRIPTION_MIN_LENGTH: 10,
  PAGINATION_LIMIT: 20,
  LOCALE_KEY: 'app-locale',
  AUTH_TOKEN_KEY: 'auth-token',
  REFRESH_TOKEN_KEY: 'refresh-token',
};

export const SUBMISSION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: '#6b7280' },
  ai_processing: { label: 'AI Processing', color: '#3b82f6' },
  analyzed: { label: 'Analyzed', color: '#3b82f6' },
  under_review: { label: 'Under Review', color: '#f59e0b' },
  resolved: { label: 'Resolved', color: '#22c55e' },
  closed: { label: 'Closed', color: '#6b7280' },
};
