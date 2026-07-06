
DROP FUNCTION IF EXISTS public.admin_upsert_store_override(jsonb);
DROP FUNCTION IF EXISTS public.admin_list_store_overrides();
DROP FUNCTION IF EXISTS public.admin_delete_store_override(text);

CREATE OR REPLACE FUNCTION public.admin_upsert_store_override(_secret text, _row jsonb)
RETURNS public.store_overrides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _domain text := lower(_row->>'domain');
  _result public.store_overrides;
BEGIN
  IF _secret IS NULL OR _secret <> '87654321' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _domain IS NULL OR length(_domain) < 3 THEN
    RAISE EXCEPTION 'Invalid domain';
  END IF;

  INSERT INTO public.store_overrides (
    domain, store_name, overall_score, grade, health,
    total_issues, critical_issues, warnings, opportunities,
    conversion_potential, seo_score, performance_score,
    setup_score, retention_score, marketing_score
  ) VALUES (
    _domain,
    NULLIF(_row->>'store_name',''),
    (_row->>'overall_score')::int,
    NULLIF(_row->>'grade',''),
    NULLIF(_row->>'health',''),
    (_row->>'total_issues')::int,
    (_row->>'critical_issues')::int,
    (_row->>'warnings')::int,
    (_row->>'opportunities')::int,
    (_row->>'conversion_potential')::numeric,
    (_row->>'seo_score')::int,
    (_row->>'performance_score')::int,
    (_row->>'setup_score')::int,
    (_row->>'retention_score')::int,
    (_row->>'marketing_score')::int
  )
  ON CONFLICT (domain) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    overall_score = EXCLUDED.overall_score,
    grade = EXCLUDED.grade,
    health = EXCLUDED.health,
    total_issues = EXCLUDED.total_issues,
    critical_issues = EXCLUDED.critical_issues,
    warnings = EXCLUDED.warnings,
    opportunities = EXCLUDED.opportunities,
    conversion_potential = EXCLUDED.conversion_potential,
    seo_score = EXCLUDED.seo_score,
    performance_score = EXCLUDED.performance_score,
    setup_score = EXCLUDED.setup_score,
    retention_score = EXCLUDED.retention_score,
    marketing_score = EXCLUDED.marketing_score,
    updated_at = now()
  RETURNING * INTO _result;

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_store_overrides(_secret text)
RETURNS SETOF public.store_overrides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _secret IS NULL OR _secret <> '87654321' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.store_overrides ORDER BY updated_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_store_override(_secret text, _domain text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _secret IS NULL OR _secret <> '87654321' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  DELETE FROM public.store_overrides WHERE domain = lower(_domain);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_store_override(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_store_overrides(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_store_override(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_store_override(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_store_overrides(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_store_override(text, text) TO anon, authenticated;
