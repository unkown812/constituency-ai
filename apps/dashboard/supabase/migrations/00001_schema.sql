-- Custom types
CREATE TYPE public.language_code AS ENUM (
  'en', 'hi', 'bn', 'ta', 'te', 'kn', 'mr', 'gu'
);

CREATE TYPE public.complaint_status AS ENUM (
  'new', 'ai_processing', 'analyzed', 'under_review', 'resolved', 'closed'
);

CREATE TYPE public.project_status AS ENUM (
  'proposed', 'approved', 'in_progress', 'completed', 'rejected'
);

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'mp', 'admin')),
  constituency_id uuid,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Constituencies
CREATE TABLE public.constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  district text,
  boundary geometry(MULTIPOLYGON, 4326),
  mp_profile_id uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_constituency_id_fkey
  FOREIGN KEY (constituency_id) REFERENCES public.constituencies(id);

-- Wards
CREATE TABLE public.wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  constituency_id uuid NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  boundary geometry(MULTIPOLYGON, 4326),
  population integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Complaints
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  constituency_id uuid NOT NULL REFERENCES public.constituencies(id),
  ward_id uuid REFERENCES public.wards(id),
  original_language public.language_code NOT NULL DEFAULT 'en',
  original_text text NOT NULL,
  translated_text text,
  title text,
  summary text,
  category text,
  sub_category text,
  department text,
  urgency_score smallint CHECK (urgency_score >= 1 AND urgency_score <= 10),
  image_paths text[] DEFAULT '{}',
  voice_path text,
  document_paths text[] DEFAULT '{}',
  location geometry(POINT, 4326) NOT NULL,
  location_name text,
  embedding_id uuid,
  duplicate_of uuid REFERENCES public.complaints(id),
  ai_confidence real,
  status public.complaint_status NOT NULL DEFAULT 'new',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(original_text, ''))
  ) STORED
);

CREATE INDEX idx_complaints_constituency_status ON public.complaints(constituency_id, status);
CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX idx_complaints_location ON public.complaints USING GIST(location);
CREATE INDEX idx_complaints_tsv ON public.complaints USING GIN(tsv);

-- Projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id uuid NOT NULL REFERENCES public.constituencies(id),
  project_title text NOT NULL,
  description text,
  category text,
  priority_score real,
  explanation text,
  estimated_cost numeric,
  currency text DEFAULT 'INR',
  beneficiaries_estimate integer,
  status public.project_status NOT NULL DEFAULT 'proposed',
  location geometry(POINT, 4326),
  source_complaint_ids uuid[] DEFAULT '{}',
  supporting_data jsonb,
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamptz,
  start_date date,
  completion_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_constituency ON public.projects(constituency_id);

-- Infrastructure
CREATE TABLE public.infrastructure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('school', 'hospital', 'water_supply', 'road', 'public_transport', 'electricity', 'others')),
  subtype text,
  location geometry(POINT, 4326) NOT NULL,
  constituency_id uuid NOT NULL REFERENCES public.constituencies(id),
  ward_id uuid REFERENCES public.wards(id),
  properties jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_infrastructure_constituency ON public.infrastructure(constituency_id);
CREATE INDEX idx_infrastructure_location ON public.infrastructure USING GIST(location);

-- Demographics
CREATE TABLE public.demographics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL UNIQUE REFERENCES public.wards(id) ON DELETE CASCADE,
  population integer,
  literacy_rate real,
  male_population integer,
  female_population integer,
  income_level text,
  census_year integer,
  properties jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- AI Processing Jobs
CREATE TABLE public.ai_processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('speech_to_text', 'translation', 'ocr', 'classification', 'embedding', 'vision', 'dedup')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  model_name text,
  input_payload jsonb,
  output_payload jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assistant Chats
CREATE TABLE public.assistant_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  constituency_id uuid REFERENCES public.constituencies(id),
  question text NOT NULL,
  answer text,
  context_used jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assistant_chats_user ON public.assistant_chats(user_id);

-- Reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id uuid NOT NULL REFERENCES public.constituencies(id),
  type text NOT NULL,
  parameters jsonb,
  file_path text,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recommendation Feedback
CREATE TABLE public.recommendation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  mp_user_id uuid NOT NULL REFERENCES public.profiles(id),
  action text NOT NULL CHECK (action IN ('approved', 'shortlisted', 'rejected', 'comment')),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGger set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.constituencies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.wards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.infrastructure
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.demographics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'citizen')
  );
  RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update own
CREATE POLICY profiles_read ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Constituencies: readable by all, writable by admin
CREATE POLICY constituencies_read ON public.constituencies
  FOR SELECT USING (true);

-- Wards: readable by all
CREATE POLICY wards_read ON public.wards
  FOR SELECT USING (true);

-- Complaints: users read own, MPs read their constituency, admins read all
CREATE POLICY complaints_select_own ON public.complaints
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.constituencies c ON c.id = p.constituency_id
      WHERE p.id = auth.uid()
      AND (p.role = 'mp' AND c.id = complaints.constituency_id OR p.role = 'admin')
    )
  );
CREATE POLICY complaints_insert ON public.complaints
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY complaints_update_own ON public.complaints
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('mp', 'admin')
    )
  );

-- Projects: readable by constituency users
CREATE POLICY projects_select ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.constituency_id = projects.constituency_id OR p.role = 'admin')
    )
  );
CREATE POLICY projects_insert ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('mp', 'admin')
    )
  );

-- Infrastructure: readable by all authenticated
CREATE POLICY infra_select ON public.infrastructure
  FOR SELECT USING (true);

-- Demographics: readable by all authenticated
CREATE POLICY demographics_select ON public.demographics
  FOR SELECT USING (true);

-- AI Jobs: readable by complaint owner or mp/admin
CREATE POLICY ai_jobs_select ON public.ai_processing_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = ai_processing_jobs.complaint_id
      AND (c.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('mp', 'admin')
      ))
    )
  );

-- Assistant Chats: user-specific
CREATE POLICY chats_select_own ON public.assistant_chats
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY chats_insert_own ON public.assistant_chats
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reports: constituency-scoped read
CREATE POLICY reports_select ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (p.constituency_id = reports.constituency_id OR p.role = 'admin')
    )
  );
CREATE POLICY reports_insert ON public.reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('mp', 'admin')
    )
  );

-- Recommendation Feedback: MPs and admins
CREATE POLICY feedback_select ON public.recommendation_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('mp', 'admin')
    )
  );
CREATE POLICY feedback_insert ON public.recommendation_feedback
  FOR INSERT WITH CHECK (mp_user_id = auth.uid());
