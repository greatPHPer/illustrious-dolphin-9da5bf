-- Algolassi comments: Google-authenticated comments publish immediately;
-- anonymous comments remain pending. The browser never chooses the approval state.

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS comments_user_id_idx
  ON public.comments(user_id);

CREATE OR REPLACE FUNCTION public.set_comment_auth_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.user_id := (SELECT auth.uid());
  NEW.approved := ((SELECT auth.uid()) IS NOT NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_set_auth_state ON public.comments;
CREATE TRIGGER comments_set_auth_state
BEFORE INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.set_comment_auth_state();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Remove existing policies so the approval rule cannot be weakened by an older policy.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'comments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.comments', policy_record.policyname);
  END LOOP;
END;
$$;

GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT ON public.comments TO anon, authenticated;

CREATE POLICY "Anyone can read published comments"
ON public.comments
FOR SELECT
TO anon, authenticated
USING (approved = true);

CREATE POLICY "Anonymous users can submit pending comments"
ON public.comments
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL
  AND approved = false
);

CREATE POLICY "Authenticated users can submit published comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND approved = true
);
