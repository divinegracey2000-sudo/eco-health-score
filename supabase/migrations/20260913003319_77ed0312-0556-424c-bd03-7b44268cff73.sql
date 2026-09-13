grant select on public.merchant_toolkit_sync_state to authenticated;
create policy "Admins can read toolkit sync state" on public.merchant_toolkit_sync_state
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

revoke execute on function public.publish_due_audits() from public;
revoke execute on function public.publish_due_audits() from anon;
revoke execute on function public.publish_due_audits() from authenticated;
revoke execute on function public.grant_admin_for_designated_email() from public, anon, authenticated;
revoke execute on function public.handle_admin_override_command() from public, anon, authenticated;
