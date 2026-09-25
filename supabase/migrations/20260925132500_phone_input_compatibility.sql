-- Older deployed forms submit 06…; normalize to the canonical +33 format before constraints run.
create or replace function public.normalize_fr_phone(p_phone text)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_phone is null then null
    when regexp_replace(p_phone,'[ .()-]','','g') ~ '^0[1-9][0-9]{8}$'
      then '+33'||substring(regexp_replace(p_phone,'[ .()-]','','g') from 2)
    when regexp_replace(p_phone,'[ .()-]','','g') ~ '^0033[1-9][0-9]{8}$'
      then '+'||substring(regexp_replace(p_phone,'[ .()-]','','g') from 3)
    else regexp_replace(p_phone,'[ .()-]','','g')
  end;
$$;
create or replace function public.normalize_vehicle_phone()
returns trigger language plpgsql set search_path = '' as $$
begin new.telephone:=public.normalize_fr_phone(new.telephone); return new; end; $$;
create or replace function public.normalize_accommodation_phone()
returns trigger language plpgsql set search_path = '' as $$
begin new.telephone_proposant:=public.normalize_fr_phone(new.telephone_proposant); return new; end; $$;
create or replace function public.normalize_reservation_phone()
returns trigger language plpgsql set search_path = '' as $$
begin new.reserver_telephone:=public.normalize_fr_phone(new.reserver_telephone); return new; end; $$;
create trigger normalize_vehicle_phone_before_write before insert or update of telephone on public.vehicles for each row execute function public.normalize_vehicle_phone();
create trigger normalize_accommodation_phone_before_write before insert or update of telephone_proposant on public.accommodations for each row execute function public.normalize_accommodation_phone();
create trigger normalize_reservation_phone_before_write before insert or update of reserver_telephone on public.reservations for each row execute function public.normalize_reservation_phone();
