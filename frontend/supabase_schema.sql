-- ==============================================================================
-- LexiSense Supabase Database & Auth Schema Setup Script (v8.0 - Full Live Cloud Sync)
-- Execute this script in your Supabase Project SQL Editor (Dashboard > SQL Editor)
-- ==============================================================================

-- 1. Create Role Enum Type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('parent', 'admin', 'super_admin');
    END IF;
END $$;

-- 2. Create Profiles Table Linked to auth.users (and standalone profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role public.user_role NOT NULL DEFAULT 'parent'::public.user_role,
    school_branch TEXT DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_branch TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- 3. Create Children Profiles Table
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    age INT DEFAULT 8,
    grade TEXT DEFAULT 'Class 1A',
    school TEXT DEFAULT 'SK Taman Permata',
    avatar TEXT DEFAULT '👧',
    school_grade TEXT DEFAULT NULL,
    school_name TEXT DEFAULT NULL,
    parent_name TEXT DEFAULT NULL,
    parent_phone TEXT DEFAULT NULL,
    parent_email TEXT DEFAULT NULL,
    gender TEXT DEFAULT 'Unspecified',
    status TEXT DEFAULT 'Pending',
    risk TEXT DEFAULT 'Not Screened',
    score INT DEFAULT 0,
    match_score INT DEFAULT 0,
    pillar1_score INT DEFAULT 0,
    pillar2_score INT DEFAULT 0,
    pillar3_score INT DEFAULT 0,
    diagnostic_area TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.children ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'Class 1A';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'SK Taman Permata';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '👧';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS school_grade TEXT DEFAULT NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS school_name TEXT DEFAULT NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS parent_name TEXT DEFAULT NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS parent_phone TEXT DEFAULT NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS parent_email TEXT DEFAULT NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Unspecified';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS risk TEXT DEFAULT 'Not Screened';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS match_score INT DEFAULT 0;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS pillar1_score INT DEFAULT 0;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS pillar2_score INT DEFAULT 0;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS pillar3_score INT DEFAULT 0;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS diagnostic_area TEXT DEFAULT NULL;

-- 4. Create Screening Results Table
CREATE TABLE IF NOT EXISTS public.screening_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    child_id TEXT DEFAULT 'child_1',
    child_name TEXT NOT NULL,
    match_score INT NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL DEFAULT 'Low Risk',
    raw_score INT DEFAULT 0,
    adjusted_raw_score INT DEFAULT 0,
    pillar1_score INT DEFAULT 0,
    pillar2_score INT DEFAULT 0,
    pillar3_score INT DEFAULT 0,
    reading_wpm INT DEFAULT 0,
    hesitation_ms INT DEFAULT 0,
    reading_seconds INT DEFAULT 0,
    educator_script TEXT DEFAULT NULL,
    sub_scores JSONB DEFAULT '{}'::jsonb,
    recommendation TEXT DEFAULT NULL,
    grade TEXT DEFAULT NULL,
    school TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.screening_results ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.screening_results ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT NULL;
ALTER TABLE public.screening_results ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT NULL;
ALTER TABLE public.screening_results ADD COLUMN IF NOT EXISTS school TEXT DEFAULT NULL;

-- 5. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor TEXT NOT NULL DEFAULT 'system',
    event TEXT NOT NULL,
    target TEXT DEFAULT NULL,
    ip TEXT DEFAULT '127.0.0.1',
    status TEXT DEFAULT 'SUCCESS',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Schools, Classes & Students (Admin Portal) Tables
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT DEFAULT 'MOE-SCH',
    sen_lead TEXT DEFAULT 'SEN Coordinator',
    students INT DEFAULT 0,
    teachers INT DEFAULT 1,
    screenings INT DEFAULT 0,
    avg_score INT DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    grade TEXT DEFAULT 'Year 1',
    school TEXT DEFAULT 'SK Taman Permata',
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'SK Taman Permata';
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'Year 1';

-- Dedicated Students Table (For Admin / Educator Portal)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    age INT DEFAULT 8,
    class TEXT DEFAULT 'Class 1A',
    grade TEXT DEFAULT 'Class 1A',
    school TEXT DEFAULT 'SK Taman Permata',
    school_name TEXT DEFAULT NULL,
    school_grade TEXT DEFAULT NULL,
    parent_name TEXT DEFAULT NULL,
    parent_phone TEXT DEFAULT NULL,
    parent_email TEXT DEFAULT NULL,
    gender TEXT DEFAULT 'Male',
    status TEXT DEFAULT 'Pending',
    risk TEXT DEFAULT 'Not Screened',
    score INT DEFAULT 0,
    match_score INT DEFAULT 0,
    pillar1_score INT DEFAULT 0,
    pillar2_score INT DEFAULT 0,
    pillar3_score INT DEFAULT 0,
    diagnostic_area TEXT DEFAULT NULL,
    reading_wpm INT DEFAULT 0,
    date TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create Teacher Follow-Ups Table (Educator Follow-Up Tracking)
CREATE TABLE IF NOT EXISTS public.teacher_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    date TEXT DEFAULT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_children_parent ON public.children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_name ON public.children(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_students_teacher ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(LOWER(class));
CREATE INDEX IF NOT EXISTS idx_screening_parent ON public.screening_results(parent_id);
CREATE INDEX IF NOT EXISTS idx_screening_child_name ON public.screening_results(LOWER(child_name));
CREATE INDEX IF NOT EXISTS idx_classes_name ON public.classes(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_teacher_followups_student ON public.teacher_followups(LOWER(student_name));
CREATE INDEX IF NOT EXISTS idx_teacher_followups_status ON public.teacher_followups(status);

-- 9. Row Level Security (RLS) - Permissive for Full Multi-Portal Real-Time Synchronization
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_followups ENABLE ROW LEVEL SECURITY;

-- Clean out old policies
DROP POLICY IF EXISTS "Allow all on profiles for anon and authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow all on children for anon and authenticated" ON public.children;
DROP POLICY IF EXISTS "Allow all on students for anon and authenticated" ON public.students;
DROP POLICY IF EXISTS "Allow all on classes for anon and authenticated" ON public.classes;
DROP POLICY IF EXISTS "Allow all on screening_results for anon and authenticated" ON public.screening_results;
DROP POLICY IF EXISTS "Allow all on audit_logs for anon and authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow all on schools for anon and authenticated" ON public.schools;
DROP POLICY IF EXISTS "Allow all on teacher_followups for anon and authenticated" ON public.teacher_followups;

-- Create Open & Synced Policies for anon & authenticated roles
CREATE POLICY "Allow all on profiles for anon and authenticated"
    ON public.profiles FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on children for anon and authenticated"
    ON public.children FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on students for anon and authenticated"
    ON public.students FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on classes for anon and authenticated"
    ON public.classes FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on screening_results for anon and authenticated"
    ON public.screening_results FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on audit_logs for anon and authenticated"
    ON public.audit_logs FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on schools for anon and authenticated"
    ON public.schools FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on teacher_followups for anon and authenticated"
    ON public.teacher_followups FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- Create Open & Synced Policies for anon & authenticated roles
CREATE POLICY "Allow all on profiles for anon and authenticated"
    ON public.profiles FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on children for anon and authenticated"
    ON public.children FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on students for anon and authenticated"
    ON public.students FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on classes for anon and authenticated"
    ON public.classes FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on screening_results for anon and authenticated"
    ON public.screening_results FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on audit_logs for anon and authenticated"
    ON public.audit_logs FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on schools for anon and authenticated"
    ON public.schools FOR ALL TO anon, authenticated
    USING (true) WITH CHECK (true);

-- 9. Trigger Function: Automatically create profile when user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    meta_username TEXT;
    meta_name TEXT;
    meta_school TEXT;
    meta_role public.user_role;
BEGIN
    meta_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
    meta_name := COALESCE(NEW.raw_user_meta_data->>'full_name', meta_username);
    meta_school := NEW.raw_user_meta_data->>'school_branch';
    
    BEGIN
        meta_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    EXCEPTION WHEN OTHERS THEN
        meta_role := 'parent'::public.user_role;
    END;

    INSERT INTO public.profiles (id, username, full_name, email, role, school_branch, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        meta_username,
        meta_name,
        NEW.email,
        COALESCE(meta_role, 'parent'::public.user_role),
        meta_school,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        school_branch = COALESCE(EXCLUDED.school_branch, profiles.school_branch),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Trigger Function: Auto-confirm email for immediate login
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = auth, public
AS $$
BEGIN
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 11. RPC Helper Functions
CREATE OR REPLACE FUNCTION public.check_username_exists(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(TRIM(p_username))
    );
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT email FROM public.profiles WHERE LOWER(username) = LOWER(TRIM(p_username)) LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

-- 12. Ensure all columns exist on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_branch TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- 13. Seed Primary Admin Account: Faiz Ikhwan (SK Taman Ria)
DELETE FROM auth.users WHERE email = 'faiz.ikhwan@sktamanria.edu.my' OR email = 'admin@lexisense.com';
DELETE FROM public.profiles WHERE role = 'admin' OR username IN ('admin', 'farida_sen', 'faizikhwan');

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Insert user into auth.users with encrypted password 'faiz12345'
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'faiz.ikhwan@sktamanria.edu.my',
        crypt('faiz12345', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"Faiz Ikhwan","username":"faizikhwan","role":"admin","school_branch":"SK Taman Ria","designation":"SEN Literacy Specialist / Guru Pemulihan"}'::jsonb,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Insert corresponding record into public.profiles
    INSERT INTO public.profiles (
        id,
        username,
        full_name,
        email,
        role,
        designation,
        school_branch,
        is_active,
        avatar_url,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'faizikhwan',
        'Faiz Ikhwan',
        'faiz.ikhwan@sktamanria.edu.my',
        'admin'::public.user_role,
        'SEN Literacy Specialist / Guru Pemulihan',
        'SK Taman Ria',
        true,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        username = 'faizikhwan',
        full_name = 'Faiz Ikhwan',
        email = 'faiz.ikhwan@sktamanria.edu.my',
        role = 'admin'::public.user_role,
        designation = 'SEN Literacy Specialist / Guru Pemulihan',
        school_branch = 'SK Taman Ria',
        updated_at = NOW();

END $$;

-- Add SK Taman Ria to Schools Directory
INSERT INTO public.schools (name, code, sen_lead, students, teachers, screenings, status)
VALUES ('SK Taman Ria', 'MOE-RIA-01', 'Faiz Ikhwan', 0, 1, 0, 'Active')
ON CONFLICT (name) DO UPDATE SET
    sen_lead = 'Faiz Ikhwan',
    status = 'Active';

NOTIFY pgrst, 'reload schema';

