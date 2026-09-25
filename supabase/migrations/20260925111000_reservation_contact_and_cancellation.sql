-- Keep private contact details out of anonymous table reads.
revoke select (telephone, lieu_depart) on public.vehicles from anon, authenticated;
revoke select (telephone_proposant, adresse, contact) on public.accommodations from anon, authenticated;

create or replace function public.reservation_provider_contact(p_reservation_id uuid, p_email_token text)
returns jsonb language sql security definer set search_path = '' as $$
  select case r.offer_type
    when 'vehicle' then jsonb_build_object('name',v.conducteur,'phone',v.telephone,'email',v.email_conducteur,'address',v.lieu_depart)
    else jsonb_build_object('name',coalesce(a.propose_par,a.contact),'phone',a.telephone_proposant,'email',a.email_proposant,'address',a.adresse)
  end
  from public.reservations r
  left join public.vehicles v on v.id=r.vehicle_id
  left join public.accommodations a on a.id=r.accommodation_id
  where r.id=p_reservation_id and r.email_token::text=p_email_token and r.statut='confirmee'
  limit 1;
$$;
revoke all on function public.reservation_provider_contact(uuid,text) from public;
grant execute on function public.reservation_provider_contact(uuid,text) to anon, authenticated;

create or replace function public.cancel_own_reservation(p_reservation_id uuid, p_email_token text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_res public.reservations%rowtype;
begin
  select * into v_res from public.reservations
  where id=p_reservation_id and email_token::text=p_email_token for update;
  if not found then raise exception 'reservation_not_found'; end if;
  if v_res.statut='annulee' then return false; end if;
  if v_res.statut<>'confirmee' then raise exception 'invalid_status'; end if;
  if v_res.offer_type='vehicle' then
    update public.vehicles set places_disponibles=places_disponibles+v_res.nb_personnes where id=v_res.vehicle_id;
  else
    update public.accommodations set places_disponibles=places_disponibles+v_res.nb_personnes where id=v_res.accommodation_id;
  end if;
  update public.reservations set statut='annulee' where id=v_res.id;
  return true;
end; $$;
revoke all on function public.cancel_own_reservation(uuid,text) from public;
grant execute on function public.cancel_own_reservation(uuid,text) to anon, authenticated;
