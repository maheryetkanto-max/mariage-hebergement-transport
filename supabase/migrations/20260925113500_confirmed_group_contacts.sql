-- Group emails are shared only with people holding their own confirmed booking code.
create or replace function public.reservation_provider_contact(p_reservation_id uuid, p_email_token text)
returns jsonb language sql security definer set search_path = '' as $$
  select (case r.offer_type
    when 'vehicle' then jsonb_build_object('name',v.conducteur,'phone',v.telephone,'email',v.email_conducteur,'address',v.lieu_depart)
    else jsonb_build_object('name',coalesce(a.propose_par,a.contact),'phone',a.telephone_proposant,'email',a.email_proposant,'address',a.adresse)
  end) || jsonb_build_object('members',coalesce((
    select jsonb_agg(jsonb_build_object('name',m.reserver_nom,'email',m.reserver_email))
    from public.reservations m
    where m.statut='confirmee' and m.id<>r.id
      and ((r.offer_type='vehicle' and m.vehicle_id=r.vehicle_id)
        or (r.offer_type='accommodation' and m.accommodation_id=r.accommodation_id))
  ),'[]'::jsonb))
  from public.reservations r
  left join public.vehicles v on v.id=r.vehicle_id
  left join public.accommodations a on a.id=r.accommodation_id
  where r.id=p_reservation_id and r.email_token::text=p_email_token and r.statut='confirmee'
  limit 1;
$$;
revoke all on function public.reservation_provider_contact(uuid,text) from public;
grant execute on function public.reservation_provider_contact(uuid,text) to anon,authenticated;
