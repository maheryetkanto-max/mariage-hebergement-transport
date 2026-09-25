alter table public.vehicles add column if not exists group_manage_token uuid not null default gen_random_uuid();
alter table public.accommodations add column if not exists group_manage_token uuid not null default gen_random_uuid();
revoke select (group_manage_token) on public.vehicles from anon,authenticated;
revoke select (group_manage_token) on public.accommodations from anon,authenticated;
grant insert (group_manage_token) on public.vehicles to anon,authenticated;
grant insert (group_manage_token) on public.accommodations to anon,authenticated;
alter table public.vehicles add constraint vehicles_french_phone check (telephone is null or telephone ~ '^\+33[1-9][0-9]{8}$') not valid;
alter table public.accommodations add constraint accommodations_french_phone check (telephone_proposant is null or telephone_proposant ~ '^\+33[1-9][0-9]{8}$') not valid;
alter table public.reservations add constraint reservations_french_phone check (reserver_telephone ~ '^\+33[1-9][0-9]{8}$') not valid;

-- A confirmed attendee or the offer creator can read the phone list for setting up the group.
create or replace function public.offer_group_status(p_offer_type text,p_offer_id uuid,p_reservation_id uuid default null,p_email_token text default null,p_owner_token text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare valid_access boolean; owner_access boolean; group_link text; provider_phone text; companions_count integer; booked_count integer; contacts jsonb;
begin
 if p_offer_type='vehicle' then
   select v.group_manage_token::text=p_owner_token,v.whatsapp_group_url,v.telephone,
     (select count(*) from regexp_split_to_table(coalesce(v.compagnons_prenoms,''),',') part where trim(part)<>''),
     (select coalesce(sum(r.nb_personnes),0) from public.reservations r where r.vehicle_id=v.id and r.statut='confirmee')
   into owner_access,group_link,provider_phone,companions_count,booked_count
   from public.vehicles v where v.id=p_offer_id and v.actif;
 elsif p_offer_type='accommodation' then
   select a.group_manage_token::text=p_owner_token,a.whatsapp_group_url,a.telephone_proposant,
     (select count(*) from regexp_split_to_table(coalesce(a.compagnons_prenoms,''),',') part where trim(part)<>''),
     (select coalesce(sum(r.nb_personnes),0) from public.reservations r where r.accommodation_id=a.id and r.statut='confirmee')
   into owner_access,group_link,provider_phone,companions_count,booked_count
   from public.accommodations a where a.id=p_offer_id and a.actif;
 else raise exception 'invalid_offer_type'; end if;
 if provider_phone is null then raise exception 'offer_not_found'; end if;
 select exists(select 1 from public.reservations r where r.id=p_reservation_id and r.email_token::text=p_email_token and r.statut='confirmee' and ((p_offer_type='vehicle' and r.vehicle_id=p_offer_id) or (p_offer_type='accommodation' and r.accommodation_id=p_offer_id))) into valid_access;
 if not coalesce(owner_access,false) and not valid_access then raise exception 'invalid_group_access'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('name',r.reserver_nom,'phone',r.reserver_telephone)),'[]'::jsonb) into contacts from public.reservations r where r.statut='confirmee' and ((p_offer_type='vehicle' and r.vehicle_id=p_offer_id) or (p_offer_type='accommodation' and r.accommodation_id=p_offer_id));
 return jsonb_build_object('count',1+companions_count+booked_count,'url',group_link,'phones',jsonb_build_array(provider_phone) || contacts);
end; $$;
revoke all on function public.offer_group_status(text,uuid,uuid,text,text) from public;
grant execute on function public.offer_group_status(text,uuid,uuid,text,text) to anon,authenticated;

create or replace function public.set_offer_group_link(p_offer_type text,p_offer_id uuid,p_url text,p_reservation_id uuid default null,p_email_token text default null,p_owner_token text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare status jsonb; old_url text;
begin
 if p_url !~ '^https://chat[.]whatsapp[.]com/[A-Za-z0-9]+$' then raise exception 'invalid_group_link'; end if;
 status:=public.offer_group_status(p_offer_type,p_offer_id,p_reservation_id,p_email_token,p_owner_token);
 if (status->>'count')::integer < 3 then raise exception 'at_least_three_people_required'; end if;
 old_url:=status->>'url';
 if old_url is not null and old_url<>'' then raise exception 'group_already_exists'; end if;
 if p_offer_type='vehicle' then update public.vehicles set whatsapp_group_url=p_url where id=p_offer_id and whatsapp_group_url is null;
 else update public.accommodations set whatsapp_group_url=p_url where id=p_offer_id and whatsapp_group_url is null; end if;
 if not found then raise exception 'group_already_exists'; end if;
 return p_url;
end; $$;
revoke all on function public.set_offer_group_link(text,uuid,text,uuid,text,text) from public;
grant execute on function public.set_offer_group_link(text,uuid,text,uuid,text,text) to anon,authenticated;
