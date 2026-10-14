export type UserRole = "citizen" | "mp" | "admin";

export type LanguageCode =
  | "en" | "hi" | "bn" | "ta" | "te" | "kn" | "mr" | "gu";

export type ComplaintStatus =
  | "new"
  | "ai_processing"
  | "analyzed"
  | "under_review"
  | "resolved"
  | "closed";

export type ProjectStatus =
  | "proposed"
  | "approved"
  | "in_progress"
  | "completed"
  | "rejected";

export type InfrastructureType =
  | "school"
  | "hospital"
  | "water_supply"
  | "road"
  | "public_transport"
  | "electricity"
  | "others";

export type AiProcessingStage =
  | "speech_to_text"
  | "translation"
  | "ocr"
  | "classification"
  | "embedding"
  | "vision"
  | "dedup";

export type AiJobStatus = "pending" | "processing" | "completed" | "failed";

export type ReportStatus = "generating" | "ready" | "failed";

export type FeedbackAction = "approved" | "shortlisted" | "rejected" | "comment";

export type ReportType = "monthly" | "quarterly" | "annual" | "custom";

export interface Database {
  public: {
    Tables: {
      profiles: ProfilesTable;
      constituencies: ConstituenciesTable;
      wards: WardsTable;
      complaints: ComplaintsTable;
      projects: ProjectsTable;
      infrastructure: InfrastructureTable;
      demographics: DemographicsTable;
      ai_processing_jobs: AiProcessingJobsTable;
      assistant_chats: AssistantChatsTable;
      reports: ReportsTable;
      recommendation_feedback: RecommendationFeedbackTable;
    };
  };
}

export interface ProfilesTable {
  Row: {
    id: string;
    full_name: string | null;
    role: UserRole;
    constituency_id: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    full_name?: string | null;
    role?: UserRole;
    constituency_id?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    full_name?: string | null;
    role?: UserRole;
    constituency_id?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface ConstituenciesTable {
  Row: {
    id: string;
    name: string;
    state: string | null;
    district: string | null;
    mp_profile_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    state?: string | null;
    district?: string | null;
    mp_profile_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    state?: string | null;
    district?: string | null;
    mp_profile_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface WardsTable {
  Row: {
    id: string;
    name: string;
    constituency_id: string;
    population: number | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    constituency_id: string;
    population?: number | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    constituency_id?: string;
    population?: number | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface ComplaintsTable {
  Row: {
    id: string;
    user_id: string;
    constituency_id: string;
    ward_id: string | null;
    original_language: LanguageCode;
    original_text: string;
    translated_text: string | null;
    title: string | null;
    summary: string | null;
    category: string | null;
    sub_category: string | null;
    department: string | null;
    urgency_score: number | null;
    image_paths: string[];
    voice_path: string | null;
    document_paths: string[];
    location: unknown;
    location_name: string | null;
    embedding_id: string | null;
    duplicate_of: string | null;
    ai_confidence: number | null;
    status: ComplaintStatus;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    constituency_id: string;
    ward_id?: string | null;
    original_language?: LanguageCode;
    original_text: string;
    translated_text?: string | null;
    title?: string | null;
    summary?: string | null;
    category?: string | null;
    sub_category?: string | null;
    department?: string | null;
    urgency_score?: number | null;
    image_paths?: string[];
    voice_path?: string | null;
    document_paths?: string[];
    location: unknown;
    location_name?: string | null;
    embedding_id?: string | null;
    duplicate_of?: string | null;
    ai_confidence?: number | null;
    status?: ComplaintStatus;
    resolved_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    constituency_id?: string;
    ward_id?: string | null;
    original_language?: LanguageCode;
    original_text?: string;
    translated_text?: string | null;
    title?: string | null;
    summary?: string | null;
    category?: string | null;
    sub_category?: string | null;
    department?: string | null;
    urgency_score?: number | null;
    image_paths?: string[];
    voice_path?: string | null;
    document_paths?: string[];
    location?: unknown;
    location_name?: string | null;
    embedding_id?: string | null;
    duplicate_of?: string | null;
    ai_confidence?: number | null;
    status?: ComplaintStatus;
    resolved_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface ProjectsTable {
  Row: {
    id: string;
    constituency_id: string;
    project_title: string;
    description: string | null;
    category: string | null;
    priority_score: number | null;
    explanation: string | null;
    estimated_cost: number | null;
    currency: string;
    beneficiaries_estimate: number | null;
    status: ProjectStatus;
    source_complaint_ids: string[];
    supporting_data: Record<string, unknown> | null;
    approved_by: string | null;
    approved_at: string | null;
    start_date: string | null;
    completion_date: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    constituency_id: string;
    project_title: string;
    description?: string | null;
    category?: string | null;
    priority_score?: number | null;
    explanation?: string | null;
    estimated_cost?: number | null;
    currency?: string;
    beneficiaries_estimate?: number | null;
    status?: ProjectStatus;
    source_complaint_ids?: string[];
    supporting_data?: Record<string, unknown> | null;
    approved_by?: string | null;
    approved_at?: string | null;
    start_date?: string | null;
    completion_date?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    constituency_id?: string;
    project_title?: string;
    description?: string | null;
    category?: string | null;
    priority_score?: number | null;
    explanation?: string | null;
    estimated_cost?: number | null;
    currency?: string;
    beneficiaries_estimate?: number | null;
    status?: ProjectStatus;
    source_complaint_ids?: string[];
    supporting_data?: Record<string, unknown> | null;
    approved_by?: string | null;
    approved_at?: string | null;
    start_date?: string | null;
    completion_date?: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface InfrastructureTable {
  Row: {
    id: string;
    name: string;
    type: InfrastructureType;
    subtype: string | null;
    constituency_id: string;
    ward_id: string | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    name: string;
    type: InfrastructureType;
    subtype?: string | null;
    constituency_id: string;
    ward_id?: string | null;
    properties?: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    name?: string;
    type?: InfrastructureType;
    subtype?: string | null;
    constituency_id?: string;
    ward_id?: string | null;
    properties?: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface DemographicsTable {
  Row: {
    id: string;
    ward_id: string;
    population: number | null;
    literacy_rate: number | null;
    male_population: number | null;
    female_population: number | null;
    income_level: string | null;
    census_year: number | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    ward_id: string;
    population?: number | null;
    literacy_rate?: number | null;
    male_population?: number | null;
    female_population?: number | null;
    income_level?: string | null;
    census_year?: number | null;
    properties?: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    ward_id?: string;
    population?: number | null;
    literacy_rate?: number | null;
    male_population?: number | null;
    female_population?: number | null;
    income_level?: string | null;
    census_year?: number | null;
    properties?: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface AiProcessingJobsTable {
  Row: {
    id: string;
    complaint_id: string;
    stage: AiProcessingStage;
    status: AiJobStatus;
    model_name: string | null;
    input_payload: Record<string, unknown> | null;
    output_payload: Record<string, unknown> | null;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    complaint_id: string;
    stage: AiProcessingStage;
    status?: AiJobStatus;
    model_name?: string | null;
    input_payload?: Record<string, unknown> | null;
    output_payload?: Record<string, unknown> | null;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    complaint_id?: string;
    stage?: AiProcessingStage;
    status?: AiJobStatus;
    model_name?: string | null;
    input_payload?: Record<string, unknown> | null;
    output_payload?: Record<string, unknown> | null;
    error_message?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    created_at?: string;
  };
}

export interface AssistantChatsTable {
  Row: {
    id: string;
    user_id: string;
    constituency_id: string | null;
    question: string;
    answer: string | null;
    context_used: Record<string, unknown> | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    constituency_id?: string | null;
    question: string;
    answer?: string | null;
    context_used?: Record<string, unknown> | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    constituency_id?: string | null;
    question?: string;
    answer?: string | null;
    context_used?: Record<string, unknown> | null;
    created_at?: string;
  };
}

export interface ReportsTable {
  Row: {
    id: string;
    constituency_id: string;
    type: string;
    parameters: Record<string, unknown> | null;
    file_path: string | null;
    status: ReportStatus;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    constituency_id: string;
    type: string;
    parameters?: Record<string, unknown> | null;
    file_path?: string | null;
    status?: ReportStatus;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    constituency_id?: string;
    type?: string;
    parameters?: Record<string, unknown> | null;
    file_path?: string | null;
    status?: ReportStatus;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
}

export interface RecommendationFeedbackTable {
  Row: {
    id: string;
    project_id: string;
    mp_user_id: string;
    action: FeedbackAction;
    comment: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    project_id: string;
    mp_user_id: string;
    action: FeedbackAction;
    comment?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    project_id?: string;
    mp_user_id?: string;
    action?: FeedbackAction;
    comment?: string | null;
    created_at?: string;
  };
}
