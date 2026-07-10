create or replace function public.enforce_signup_email_domain()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or lower(new.email) !~ '@(lkslaw\.com|lakshmisri\.com)$' then
    raise exception 'Signup restricted to lkslaw.com and lakshmisri.com email addresses';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_signup_email_domain on auth.users;

create trigger enforce_signup_email_domain
before insert on auth.users
for each row execute function public.enforce_signup_email_domain();