-- ==============================================================================
-- LexiSense - SQL Script: Kosongkan SEMUA Data (100% Blank Slate)
-- Tanpa ralat Foreign Key
-- ==============================================================================

-- 1. Kosongkan SEMUA jadual dalam schema public serentak
TRUNCATE TABLE 
    public.audit_logs,
    public.children,
    public.classes,
    public.eye_tracking_gaze_logs,
    public.parent_users,
    public.profiles,
    public.questionnaire_responses,
    public.schools,
    public.screening_results,
    public.students,
    public.teacher_followups
CASCADE;

-- 2. (Pilihan) Kosongkan juga semua akaun log masuk di auth.users jika ingin reset pendaftaran
-- TRUNCATE auth.users CASCADE;
