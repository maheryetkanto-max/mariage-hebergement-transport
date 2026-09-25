alter table public.vehicles add column if not exists retour_lieu_depart text;
alter table public.vehicles add column if not exists retour_ville_arrivee text;

alter table public.vehicles drop constraint if exists vehicles_genre_conducteur_check;
alter table public.vehicles add constraint vehicles_genre_conducteur_check
  check (genre_conducteur is null or genre_conducteur in ('homme', 'femme', 'homme_et_femme'));

grant select (retour_lieu_depart, retour_ville_arrivee) on public.vehicles to anon, authenticated;
grant insert (retour_lieu_depart, retour_ville_arrivee) on public.vehicles to anon, authenticated;

-- Keep the organizer's edit path compatible with the two new return fields.
create or replace function public.admin_patch_vehicle(p_password text, p_id uuid, p_payload jsonb)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  if not public.verify_wedding_admin(p_password) then
    raise exception 'unauthorized';
  end if;

  update public.vehicles set
    conducteur = case when p_payload ? 'conducteur' then p_payload->>'conducteur' else conducteur end,
    telephone = case when p_payload ? 'telephone' then nullif(p_payload->>'telephone','') else telephone end,
    email_conducteur = case when p_payload ? 'email_conducteur' then nullif(lower(trim(p_payload->>'email_conducteur')),'') else email_conducteur end,
    lieu_depart = case when p_payload ? 'lieu_depart' then nullif(p_payload->>'lieu_depart','') else lieu_depart end,
    heure_depart = case when p_payload ? 'heure_depart' then nullif(p_payload->>'heure_depart','') else heure_depart end,
    places = case when p_payload ? 'places' then (p_payload->>'places')::integer else places end,
    commentaires = case when p_payload ? 'commentaires' then nullif(p_payload->>'commentaires','') else commentaires end,
    genre_conducteur = case when p_payload ? 'genre_conducteur' then nullif(p_payload->>'genre_conducteur','') else genre_conducteur end,
    type_trajet = case when p_payload ? 'type_trajet' then p_payload->>'type_trajet' else type_trajet end,
    ville_depart = case when p_payload ? 'ville_depart' then nullif(p_payload->>'ville_depart','') else ville_depart end,
    destination = case when p_payload ? 'destination' then nullif(p_payload->>'destination','') else destination end,
    date_depart = case when p_payload ? 'date_depart' then nullif(p_payload->>'date_depart','')::date else date_depart end,
    date_retour = case when p_payload ? 'date_retour' then nullif(p_payload->>'date_retour','')::date else date_retour end,
    heure_retour = case when p_payload ? 'heure_retour' then nullif(p_payload->>'heure_retour','') else heure_retour end,
    retour_lieu_depart = case when p_payload ? 'retour_lieu_depart' then nullif(p_payload->>'retour_lieu_depart','') else retour_lieu_depart end,
    retour_ville_arrivee = case when p_payload ? 'retour_ville_arrivee' then nullif(p_payload->>'retour_ville_arrivee','') else retour_ville_arrivee end,
    places_disponibles = case when p_payload ? 'places_disponibles' then (p_payload->>'places_disponibles')::integer else places_disponibles end,
    gratuit = case when p_payload ? 'gratuit' then (p_payload->>'gratuit')::boolean else gratuit end,
    participation = case when p_payload ? 'participation' then (p_payload->>'participation')::numeric else participation end,
    animaux_acceptes = case when p_payload ? 'animaux_acceptes' then (p_payload->>'animaux_acceptes')::boolean else animaux_acceptes end,
    reservation_active = case when p_payload ? 'email_conducteur' then nullif(lower(trim(p_payload->>'email_conducteur')),'') is not null else reservation_active end,
    actif = case when p_payload ? 'actif' then (p_payload->>'actif')::boolean else actif end,
    source = case when p_payload ? 'source' then p_payload->>'source' else source end
  where id = p_id;

  return found;
end;
$function$;
