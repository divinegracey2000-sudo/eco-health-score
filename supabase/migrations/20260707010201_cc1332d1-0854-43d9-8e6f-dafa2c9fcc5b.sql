
-- Update admin-grant function to include the designated admin email(s)
CREATE OR REPLACE FUNCTION public.grant_admin_for_designated_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if new.email_confirmed_at is not null
     and lower(new.email) in ('divinegracey2000@gmail.com','swisdom279@gmail.com') then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$function$;

-- Attach the trigger so newly-confirmed matching users get admin automatically
DROP TRIGGER IF EXISTS grant_admin_on_confirm ON auth.users;
CREATE TRIGGER grant_admin_on_confirm
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.grant_admin_for_designated_email();
