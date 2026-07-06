GRANT EXECUTE ON FUNCTION public.admin_upsert_store_override(text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_store_overrides(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_store_override(text, text) TO anon, authenticated;