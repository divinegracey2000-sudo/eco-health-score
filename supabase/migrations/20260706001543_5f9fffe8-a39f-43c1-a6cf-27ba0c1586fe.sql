CREATE TABLE IF NOT EXISTS public.admin_override_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  access_code text,
  domain text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.admin_override_commands TO anon, authenticated;
GRANT ALL ON public.admin_override_commands TO service_role;

ALTER TABLE public.admin_override_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin override commands can be submitted" ON public.admin_override_commands;
CREATE POLICY "Admin override commands can be submitted"
ON public.admin_override_commands
FOR INSERT
TO anon, authenticated
WITH CHECK (action IN ('upsert', 'delete') AND length(domain) >= 3);

CREATE OR REPLACE FUNCTION public.handle_admin_override_command()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _domain text := lower(regexp_replace(NEW.domain, '^www\.', ''));
  _row jsonb := COALESCE(NEW.payload, '{}'::jsonb) || jsonb_build_object('domain', lower(regexp_replace(NEW.domain, '^www\.', '')));
BEGIN
  IF NEW.access_code IS NULL OR NEW.access_code <> '87654321' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _domain IS NULL OR length(_domain) < 3 THEN
    RAISE EXCEPTION 'Invalid domain';
  END IF;

  IF NEW.action = 'delete' THEN
    DELETE FROM public.store_overrides WHERE domain = _domain;
  ELSIF NEW.action = 'upsert' THEN
    INSERT INTO public.store_overrides (
      domain, store_name, overall_score, grade, health,
      total_issues, critical_issues, warnings, opportunities,
      conversion_potential, seo_score, performance_score,
      setup_score, retention_score, marketing_score
    ) VALUES (
      _domain,
      NULLIF(_row->>'store_name',''),
      CASE WHEN _row ? 'overall_score' AND _row->>'overall_score' <> '' THEN (_row->>'overall_score')::int ELSE NULL END,
      NULLIF(_row->>'grade',''),
      NULLIF(_row->>'health',''),
      CASE WHEN _row ? 'total_issues' AND _row->>'total_issues' <> '' THEN (_row->>'total_issues')::int ELSE NULL END,
      CASE WHEN _row ? 'critical_issues' AND _row->>'critical_issues' <> '' THEN (_row->>'critical_issues')::int ELSE NULL END,
      CASE WHEN _row ? 'warnings' AND _row->>'warnings' <> '' THEN (_row->>'warnings')::int ELSE NULL END,
      CASE WHEN _row ? 'opportunities' AND _row->>'opportunities' <> '' THEN (_row->>'opportunities')::int ELSE NULL END,
      CASE WHEN _row ? 'conversion_potential' AND _row->>'conversion_potential' <> '' THEN (_row->>'conversion_potential')::numeric ELSE NULL END,
      CASE WHEN _row ? 'seo_score' AND _row->>'seo_score' <> '' THEN (_row->>'seo_score')::int ELSE NULL END,
      CASE WHEN _row ? 'performance_score' AND _row->>'performance_score' <> '' THEN (_row->>'performance_score')::int ELSE NULL END,
      CASE WHEN _row ? 'setup_score' AND _row->>'setup_score' <> '' THEN (_row->>'setup_score')::int ELSE NULL END,
      CASE WHEN _row ? 'retention_score' AND _row->>'retention_score' <> '' THEN (_row->>'retention_score')::int ELSE NULL END,
      CASE WHEN _row ? 'marketing_score' AND _row->>'marketing_score' <> '' THEN (_row->>'marketing_score')::int ELSE NULL END
    )
    ON CONFLICT (domain) DO UPDATE SET
      store_name = CASE WHEN _row ? 'store_name' THEN EXCLUDED.store_name ELSE public.store_overrides.store_name END,
      overall_score = CASE WHEN _row ? 'overall_score' THEN EXCLUDED.overall_score ELSE public.store_overrides.overall_score END,
      grade = CASE WHEN _row ? 'grade' THEN EXCLUDED.grade ELSE public.store_overrides.grade END,
      health = CASE WHEN _row ? 'health' THEN EXCLUDED.health ELSE public.store_overrides.health END,
      total_issues = CASE WHEN _row ? 'total_issues' THEN EXCLUDED.total_issues ELSE public.store_overrides.total_issues END,
      critical_issues = CASE WHEN _row ? 'critical_issues' THEN EXCLUDED.critical_issues ELSE public.store_overrides.critical_issues END,
      warnings = CASE WHEN _row ? 'warnings' THEN EXCLUDED.warnings ELSE public.store_overrides.warnings END,
      opportunities = CASE WHEN _row ? 'opportunities' THEN EXCLUDED.opportunities ELSE public.store_overrides.opportunities END,
      conversion_potential = CASE WHEN _row ? 'conversion_potential' THEN EXCLUDED.conversion_potential ELSE public.store_overrides.conversion_potential END,
      seo_score = CASE WHEN _row ? 'seo_score' THEN EXCLUDED.seo_score ELSE public.store_overrides.seo_score END,
      performance_score = CASE WHEN _row ? 'performance_score' THEN EXCLUDED.performance_score ELSE public.store_overrides.performance_score END,
      setup_score = CASE WHEN _row ? 'setup_score' THEN EXCLUDED.setup_score ELSE public.store_overrides.setup_score END,
      retention_score = CASE WHEN _row ? 'retention_score' THEN EXCLUDED.retention_score ELSE public.store_overrides.retention_score END,
      marketing_score = CASE WHEN _row ? 'marketing_score' THEN EXCLUDED.marketing_score ELSE public.store_overrides.marketing_score END,
      updated_at = now();
  ELSE
    RAISE EXCEPTION 'Invalid action';
  END IF;

  NEW.access_code = NULL;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_admin_override_command() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS admin_override_commands_apply ON public.admin_override_commands;
CREATE TRIGGER admin_override_commands_apply
BEFORE INSERT ON public.admin_override_commands
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_override_command();

REVOKE ALL ON FUNCTION public.admin_upsert_store_override(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_list_store_overrides(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_store_override(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_store_override(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_store_overrides(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_store_override(text, text) TO service_role;