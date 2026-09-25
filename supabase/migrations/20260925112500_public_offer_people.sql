alter table public.vehicles add column if not exists compagnons_prenoms text;
alter table public.vehicles add column if not exists centres_interet text[] not null default '{}';
alter table public.accommodations add column if not exists compagnons_prenoms text;
alter table public.accommodations add column if not exists centres_interet text[] not null default '{}';
alter table public.reservations add column if not exists profil_public jsonb not null default '{}'::jsonb;
grant select (compagnons_prenoms,centres_interet) on public.vehicles to anon,authenticated;
grant insert (compagnons_prenoms,centres_interet) on public.vehicles to anon,authenticated;
grant select (compagnons_prenoms,centres_interet) on public.accommodations to anon,authenticated;
grant insert (compagnons_prenoms,centres_interet) on public.accommodations to anon,authenticated;

-- One transaction reserves places and attaches the names/preferences shown to fellow guests.
create or replace function public.reserve_vehicle_with_profile(p_vehicle_id uuid,p_reserver_nom text,p_reserver_email text,p_reserver_telephone text,p_reserver_genre text,p_nb_personnes integer,p_consentement_coordonnees boolean,p_profile jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
 if length(p_profile::text)>1500 then raise exception 'profile_too_long'; end if;
 v_result:=public.reserve_vehicle(p_vehicle_id,p_reserver_nom,p_reserver_email,p_reserver_telephone,p_reserver_genre,p_nb_personnes,p_consentement_coordonnees);
 update public.reservations set profil_public=jsonb_build_object(
   'origin',left(coalesce(p_profile->>'origin',''),80),
   'interests',coalesce((select jsonb_agg(left(value,30)) from jsonb_array_elements_text(case when jsonb_typeof(p_profile->'interests')='array' then p_profile->'interests' else '[]'::jsonb end) t(value)), '[]'::jsonb),
   'companions',coalesce((select jsonb_agg(left(value,60)) from jsonb_array_elements_text(case when jsonb_typeof(p_profile->'companions')='array' then p_profile->'companions' else '[]'::jsonb end) t(value)), '[]'::jsonb)
 ) where id=(v_result->>'reservation_id')::uuid;
 return v_result;
end; $$;
create or replace function public.reserve_accommodation_with_profile(p_accommodation_id uuid,p_reserver_nom text,p_reserver_email text,p_reserver_telephone text,p_reserver_genre text,p_nb_personnes integer,p_date_entree date,p_date_sortie date,p_consentement_coordonnees boolean,p_profile jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
 if length(p_profile::text)>1500 then raise exception 'profile_too_long'; end if;
 v_result:=public.reserve_accommodation(p_accommodation_id,p_reserver_nom,p_reserver_email,p_reserver_telephone,p_reserver_genre,p_nb_personnes,p_date_entree,p_date_sortie,p_consentement_coordonnees);
 update public.reservations set profil_public=jsonb_build_object(
   'origin',left(coalesce(p_profile->>'origin',''),80),
   'interests',coalesce((select jsonb_agg(left(value,30)) from jsonb_array_elements_text(case when jsonb_typeof(p_profile->'interests')='array' then p_profile->'interests' else '[]'::jsonb end) t(value)), '[]'::jsonb),
   'companions',coalesce((select jsonb_agg(left(value,60)) from jsonb_array_elements_text(case when jsonb_typeof(p_profile->'companions')='array' then p_profile->'companions' else '[]'::jsonb end) t(value)), '[]'::jsonb)
 ) where id=(v_result->>'reservation_id')::uuid;
 return v_result;
end; $$;
revoke all on function public.reserve_vehicle_with_profile(uuid,text,text,text,text,integer,boolean,jsonb) from public;
grant execute on function public.reserve_vehicle_with_profile(uuid,text,text,text,text,integer,boolean,jsonb) to anon,authenticated;
revoke all on function public.reserve_accommodation_with_profile(uuid,text,text,text,text,integer,date,date,boolean,jsonb) from public;
grant execute on function public.reserve_accommodation_with_profile(uuid,text,text,text,text,integer,date,date,boolean,jsonb) to anon,authenticated;

-- Only first names, city and selected interests are visible before a booking.
create or replace function public.public_offer_people()
returns jsonb language sql security definer set search_path = '' as $$
 select coalesce(jsonb_agg(row_data), '[]'::jsonb) from (
   select jsonb_build_object('type','vehicle','id',v.id,'people',jsonb_build_array(jsonb_build_object('name',split_part(trim(v.conducteur),' ',1),'interests',to_jsonb(v.centres_interet),'origin',v.ville_depart)) ||
     coalesce((select jsonb_agg(jsonb_build_object('name',trim(value),'interests','[]'::jsonb,'origin',v.ville_depart)) from regexp_split_to_table(coalesce(v.compagnons_prenoms,''),',') value where trim(value)<>''),'[]'::jsonb) ||
     coalesce((select jsonb_agg(person) from (select jsonb_build_object('name',split_part(trim(r.reserver_nom),' ',1),'interests',coalesce(r.profil_public->'interests','[]'::jsonb),'origin',r.profil_public->>'origin') person from public.reservations r where r.vehicle_id=v.id and r.statut='confirmee' union all select jsonb_build_object('name',trim(companion.value),'interests','[]'::jsonb,'origin',r.profil_public->>'origin') from public.reservations r cross join lateral jsonb_array_elements_text(coalesce(r.profil_public->'companions','[]'::jsonb)) companion(value) where r.vehicle_id=v.id and r.statut='confirmee') people),'[]'::jsonb)
   ) row_data from public.vehicles v where v.actif
   union all
   select jsonb_build_object('type','accommodation','id',a.id,'people',jsonb_build_array(jsonb_build_object('name',split_part(trim(coalesce(a.propose_par,a.contact,'Hôte')),' ',1),'interests',to_jsonb(a.centres_interet),'origin',a.ville_logement)) ||
     coalesce((select jsonb_agg(jsonb_build_object('name',trim(value),'interests','[]'::jsonb,'origin',a.ville_logement)) from regexp_split_to_table(coalesce(a.compagnons_prenoms,''),',') value where trim(value)<>''),'[]'::jsonb) ||
     coalesce((select jsonb_agg(person) from (select jsonb_build_object('name',split_part(trim(r.reserver_nom),' ',1),'interests',coalesce(r.profil_public->'interests','[]'::jsonb),'origin',r.profil_public->>'origin') person from public.reservations r where r.accommodation_id=a.id and r.statut='confirmee' union all select jsonb_build_object('name',trim(companion.value),'interests','[]'::jsonb,'origin',r.profil_public->>'origin') from public.reservations r cross join lateral jsonb_array_elements_text(coalesce(r.profil_public->'companions','[]'::jsonb)) companion(value) where r.accommodation_id=a.id and r.statut='confirmee') people),'[]'::jsonb)
   ) row_data from public.accommodations a where a.actif
 ) x;
$$;
revoke all on function public.public_offer_people() from public;
grant execute on function public.public_offer_people() to anon,authenticated;
