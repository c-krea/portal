-- Local-only: app RPC helpers (public.exec_sql / public.exec_dml), pulled from prod on 2026-07-10.
CREATE OR REPLACE FUNCTION public.exec_sql(q text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t',
    q
  ) INTO result;
  RETURN result;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.exec_dml(q text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  EXECUTE q;
END;
$function$
;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.exec_dml(text) TO service_role;
