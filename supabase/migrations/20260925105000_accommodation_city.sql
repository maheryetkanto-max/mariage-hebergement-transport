alter table public.accommodations add column if not exists ville_logement text;
grant select (ville_logement) on public.accommodations to anon, authenticated;
grant insert (ville_logement) on public.accommodations to anon, authenticated;

-- Older listings already have an address and can still be searched by address.
update public.accommodations set ville_logement = 'Troyes'
where ville_logement is null and adresse ilike '%Troyes%';

create or replace function public.admin_patch_accommodation(p_password text, p_id uuid, p_payload jsonb)
returns boolean language plpgsql security definer set search_path to 'public', 'extensions'
as $function$
begin
  if not public.verify_wedding_admin(p_password) then raise exception 'unauthorized'; end if;
  update public.accommodations set
    nom = case when p_payload ? 'nom' then p_payload->>'nom' else nom end,
    type = case when p_payload ? 'type' then p_payload->>'type' else type end,
    adresse = case when p_payload ? 'adresse' then nullif(p_payload->>'adresse','') else adresse end,
    ville_logement = case when p_payload ? 'ville_logement' then nullif(p_payload->>'ville_logement','') else ville_logement end,
    capacite = case when p_payload ? 'capacite' then (p_payload->>'capacite')::integer else capacite end,
    contact = case when p_payload ? 'contact' then nullif(p_payload->>'contact','') else contact end,
    commentaires = case when p_payload ? 'commentaires' then nullif(p_payload->>'commentaires','') else commentaires end,
    propose_par = case when p_payload ? 'propose_par' then nullif(p_payload->>'propose_par','') else propose_par end,
    genre_proposant = case when p_payload ? 'genre_proposant' then nullif(p_payload->>'genre_proposant','') else genre_proposant end,
    telephone_proposant = case when p_payload ? 'telephone_proposant' then nullif(p_payload->>'telephone_proposant','') else telephone_proposant end,
    email_proposant = case when p_payload ? 'email_proposant' then nullif(lower(trim(p_payload->>'email_proposant')),'') else email_proposant end,
    reservation_active = case when p_payload ? 'email_proposant' then nullif(lower(trim(p_payload->>'email_proposant')),'') is not null else reservation_active end,
    places_disponibles = case when p_payload ? 'places_disponibles' then (p_payload->>'places_disponibles')::integer else places_disponibles end,
    minutes_salle = case when p_payload ? 'minutes_salle' then nullif(p_payload->>'minutes_salle','')::integer else minutes_salle end,
    date_entree = case when p_payload ? 'date_entree' then nullif(p_payload->>'date_entree','')::date else date_entree end,
    date_sortie = case when p_payload ? 'date_sortie' then nullif(p_payload->>'date_sortie','')::date else date_sortie end,
    prix_personne_nuit = case when p_payload ? 'prix_personne_nuit' then (p_payload->>'prix_personne_nuit')::numeric else prix_personne_nuit end,
    enfants_acceptes = case when p_payload ? 'enfants_acceptes' then (p_payload->>'enfants_acceptes')::boolean else enfants_acceptes end,
    animaux_acceptes = case when p_payload ? 'animaux_acceptes' then (p_payload->>'animaux_acceptes')::boolean else animaux_acceptes end,
    actif = case when p_payload ? 'actif' then (p_payload->>'actif')::boolean else actif end,
    source = case when p_payload ? 'source' then p_payload->>'source' else source end
  where id = p_id;
  return found;
end;
$function$;
