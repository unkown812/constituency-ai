-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'citizen'::text CHECK (role = ANY (ARRAY['citizen'::text, 'mp'::text, 'admin'::text])),
  constituency_id uuid,
  phone text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.constituencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  district text,
  boundary USER-DEFINED,
  mp_profile_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT constituencies_pkey PRIMARY KEY (id),
  CONSTRAINT constituencies_mp_profile_id_fkey FOREIGN KEY (mp_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.wards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  constituency_id uuid NOT NULL,
  boundary USER-DEFINED,
  population integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wards_pkey PRIMARY KEY (id),
  CONSTRAINT wards_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id)
);
CREATE TABLE public.complaints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  constituency_id uuid NOT NULL,
  ward_id uuid,
  original_language USER-DEFINED NOT NULL DEFAULT 'en'::language_code,
  original_text text NOT NULL,
  translated_text text,
  title text,
  summary text,
  category USER-DEFINED,
  sub_category text,
  department text,
  urgency_score smallint CHECK (urgency_score >= 1 AND urgency_score <= 10),
  image_paths ARRAY DEFAULT '{}'::text[],
  voice_path text,
  document_paths ARRAY DEFAULT '{}'::text[],
  location USER-DEFINED NOT NULL,
  location_name text,
  embedding_id uuid,
  duplicate_of uuid,
  ai_confidence real,
  status USER-DEFINED NOT NULL DEFAULT 'new'::complaint_status,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  tsv tsvector,
  CONSTRAINT complaints_pkey PRIMARY KEY (id),
  CONSTRAINT complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT complaints_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id),
  CONSTRAINT complaints_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.wards(id),
  CONSTRAINT complaints_duplicate_of_fkey FOREIGN KEY (duplicate_of) REFERENCES public.complaints(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  constituency_id uuid NOT NULL,
  project_title text NOT NULL,
  description text,
  category USER-DEFINED,
  priority_score real,
  explanation text,
  estimated_cost numeric,
  currency text DEFAULT 'INR'::text,
  beneficiaries_estimate integer,
  status USER-DEFINED NOT NULL DEFAULT 'proposed'::project_status,
  location USER-DEFINED,
  source_complaint_ids ARRAY DEFAULT '{}'::uuid[],
  supporting_data jsonb,
  approved_by uuid,
  approved_at timestamp with time zone,
  start_date date,
  completion_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id),
  CONSTRAINT projects_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.infrastructure (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['school'::text, 'hospital'::text, 'water_supply'::text, 'road'::text, 'public_transport'::text, 'electricity'::text, 'others'::text])),
  subtype text,
  location USER-DEFINED NOT NULL,
  constituency_id uuid NOT NULL,
  ward_id uuid,
  properties jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT infrastructure_pkey PRIMARY KEY (id),
  CONSTRAINT infrastructure_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id),
  CONSTRAINT infrastructure_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.wards(id)
);
CREATE TABLE public.demographics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL UNIQUE,
  population integer,
  literacy_rate real,
  male_population integer,
  female_population integer,
  income_level text,
  census_year integer,
  properties jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT demographics_pkey PRIMARY KEY (id),
  CONSTRAINT demographics_ward_id_fkey FOREIGN KEY (ward_id) REFERENCES public.wards(id)
);
CREATE TABLE public.ai_processing_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL,
  stage text NOT NULL CHECK (stage = ANY (ARRAY['speech_to_text'::text, 'translation'::text, 'ocr'::text, 'classification'::text, 'embedding'::text, 'vision'::text, 'dedup'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  model_name text,
  input_payload jsonb,
  output_payload jsonb,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_processing_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT ai_processing_jobs_complaint_id_fkey FOREIGN KEY (complaint_id) REFERENCES public.complaints(id)
);
CREATE TABLE public.assistant_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  constituency_id uuid,
  question text NOT NULL,
  answer text,
  context_used jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT assistant_chats_pkey PRIMARY KEY (id),
  CONSTRAINT assistant_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT assistant_chats_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  constituency_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  parameters jsonb,
  file_path text,
  status text NOT NULL DEFAULT 'generating'::text CHECK (status = ANY (ARRAY['generating'::text, 'ready'::text, 'failed'::text])),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id),
  CONSTRAINT reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.recommendation_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  mp_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['approved'::text, 'shortlisted'::text, 'rejected'::text, 'comment'::text])),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT recommendation_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT recommendation_feedback_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT recommendation_feedback_mp_user_id_fkey FOREIGN KEY (mp_user_id) REFERENCES public.profiles(id)
);