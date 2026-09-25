do $$ declare definition text; begin
  select pg_get_functiondef(oid) into definition from pg_proc where proname='public_offer_people' and pronamespace='public'::regnamespace;
  definition:=replace(definition, '''interests'',coalesce(r.profil_public->''interests''',
    '''luggage'',r.profil_public->>''luggage'',''interests'',coalesce(r.profil_public->''interests''');
  if definition=(select pg_get_functiondef(oid) from pg_proc where proname='public_offer_people' and pronamespace='public'::regnamespace) then raise exception 'offer people format changed'; end if;
  execute definition;
end $$;
