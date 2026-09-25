-- Invite links are supplied with an offer but never selected by anonymous visitors.
alter table public.accommodations add column if not exists whatsapp_group_url text;
alter table public.vehicles add column if not exists whatsapp_group_url text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'accommodations_whatsapp_group_url_format') then
    alter table public.accommodations add constraint accommodations_whatsapp_group_url_format
      check (whatsapp_group_url is null or whatsapp_group_url ~ '^https://chat[.]whatsapp[.]com/[A-Za-z0-9]+$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'vehicles_whatsapp_group_url_format') then
    alter table public.vehicles add constraint vehicles_whatsapp_group_url_format
      check (whatsapp_group_url is null or whatsapp_group_url ~ '^https://chat[.]whatsapp[.]com/[A-Za-z0-9]+$');
  end if;
end $$;

revoke select (whatsapp_group_url) on public.accommodations from anon, authenticated;
revoke select (whatsapp_group_url) on public.vehicles from anon, authenticated;
grant insert (whatsapp_group_url) on public.accommodations to anon, authenticated;
grant insert (whatsapp_group_url) on public.vehicles to anon, authenticated;

-- A valid reservation token, returned only to the booking client, unlocks its group link.
create or replace function public.reservation_whatsapp_link(p_reservation_id uuid, p_email_token text)
returns text
language sql
security definer
set search_path = ''
as $$
  select case r.offer_type
    when 'accommodation' then a.whatsapp_group_url
    when 'vehicle' then v.whatsapp_group_url
  end
  from public.reservations r
  left join public.accommodations a on a.id = r.accommodation_id
  left join public.vehicles v on v.id = r.vehicle_id
  where r.id = p_reservation_id and r.email_token::text = p_email_token
    and r.statut = 'confirmee'
  limit 1;
$$;

revoke all on function public.reservation_whatsapp_link(uuid, text) from public;
grant execute on function public.reservation_whatsapp_link(uuid, text) to anon, authenticated;
