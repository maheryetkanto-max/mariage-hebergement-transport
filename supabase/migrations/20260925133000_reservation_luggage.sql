-- Persist the size indicated by the person joining a vehicle.
do $$ declare func record; definition text; begin
  for func in select oid from pg_proc where proname in ('reserve_vehicle_with_profile','reserve_accommodation_with_profile') and pronamespace='public'::regnamespace loop
    definition:=pg_get_functiondef(func.oid);
    definition:=replace(definition, '''origin'',left(coalesce(p_profile->>''origin'',''''),80),',
      '''luggage'',case when p_profile->>''luggage'' in (''petit'',''moyen'',''gros'') then p_profile->>''luggage'' else null end, ''origin'',left(coalesce(p_profile->>''origin'',''''),80),');
    if definition=pg_get_functiondef(func.oid) then raise exception 'reservation profile function format changed'; end if;
    execute definition;
  end loop;
end $$;
