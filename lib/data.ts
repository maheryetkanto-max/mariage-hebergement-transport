"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Accommodation, Guest, GuestWithRelations, Occupancy, Vehicle } from "@/lib/types"

const KEYS = {
  guests: "guests",
  accommodations: "accommodations",
  vehicles: "vehicles",
}

const supabase = createClient()

async function fetchGuests(): Promise<Guest[]> {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as Guest[]
}

async function fetchAccommodations(): Promise<Accommodation[]> {
  const { data, error } = await supabase
    .from("accommodations")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Accommodation[]
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Vehicle[]
}

export function useGuests() {
  return useSWR<Guest[]>(KEYS.guests, fetchGuests)
}

export function useAccommodations() {
  return useSWR<Accommodation[]>(KEYS.accommodations, fetchAccommodations)
}

export function useVehicles() {
  return useSWR<Vehicle[]>(KEYS.vehicles, fetchVehicles)
}

export function revalidateAll() {
  globalMutate(KEYS.guests)
  globalMutate(KEYS.accommodations)
  globalMutate(KEYS.vehicles)
}

export function accommodationOccupancy(acc: Accommodation, guests: Guest[]): Occupancy {
  const occupied = guests
    .filter((g) => g.accommodation_id === acc.id)
    .reduce((sum, g) => sum + g.nb_personnes, 0)
  return { occupied, remaining: Math.max(0, acc.capacite - occupied) }
}

export function vehicleOccupancy(vehicle: Vehicle, guests: Guest[]): Occupancy {
  const occupied = guests
    .filter((g) => g.vehicle_id === vehicle.id)
    .reduce((sum, g) => sum + g.nb_personnes, 0)
  return { occupied, remaining: Math.max(0, vehicle.places - occupied) }
}

export function guestsForAccommodation(accId: string, guests: Guest[]): Guest[] {
  return guests.filter((g) => g.accommodation_id === accId)
}

export function guestsForVehicle(vehicleId: string, guests: Guest[]): Guest[] {
  return guests.filter((g) => g.vehicle_id === vehicleId)
}

export function withRelations(
  guest: Guest,
  accommodations: Accommodation[],
  vehicles: Vehicle[],
): GuestWithRelations {
  return {
    ...guest,
    accommodation: accommodations.find((a) => a.id === guest.accommodation_id) ?? null,
    vehicle: vehicles.find((v) => v.id === guest.vehicle_id) ?? null,
  }
}

export async function saveGuest(guest: Partial<Guest> & { id?: string }) {
  const payload = {
    nom: guest.nom,
    prenom: guest.prenom || null,
    nb_personnes: guest.nb_personnes ?? 1,
    telephone: guest.telephone || null,
    besoin_hebergement: guest.besoin_hebergement ?? false,
    besoin_transport: guest.besoin_transport ?? false,
    point_depart: guest.point_depart || null,
    commentaires: guest.commentaires || null,
    accommodation_id: guest.accommodation_id ?? null,
    vehicle_id: guest.vehicle_id ?? null,
  }
  if (guest.id) {
    const { error } = await supabase.from("guests").update(payload).eq("id", guest.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from("guests").insert(payload)
    if (error) throw error
  }
  globalMutate(KEYS.guests)
}

export async function deleteGuest(id: string) {
  const { error } = await supabase.from("guests").delete().eq("id", id)
  if (error) throw error
  globalMutate(KEYS.guests)
}

export async function assignGuestAccommodation(guestId: string, accommodationId: string | null) {
  const { error } = await supabase
    .from("guests")
    .update({ accommodation_id: accommodationId })
    .eq("id", guestId)
  if (error) throw error
  globalMutate(KEYS.guests)
}

export async function assignGuestVehicle(guestId: string, vehicleId: string | null) {
  const { error } = await supabase
    .from("guests")
    .update({ vehicle_id: vehicleId })
    .eq("id", guestId)
  if (error) throw error
  globalMutate(KEYS.guests)
}

export async function saveAccommodation(acc: Partial<Accommodation> & { id?: string }) {
  const payload = {
    nom: acc.nom,
    type: acc.type ?? "Autre",
    adresse: acc.adresse || null,
    capacite: acc.capacite ?? acc.places_disponibles ?? 0,
    contact: acc.contact || acc.propose_par || null,
    commentaires: acc.commentaires || null,
    propose_par: acc.propose_par || acc.contact || null,
    genre_proposant: acc.genre_proposant || null,
    telephone_proposant: acc.telephone_proposant || null,
    places_disponibles: acc.places_disponibles ?? acc.capacite ?? 0,
    minutes_salle: acc.minutes_salle ?? null,
    date_entree: acc.date_entree || null,
    date_sortie: acc.date_sortie || null,
    prix_personne_nuit: acc.prix_personne_nuit ?? 0,
    enfants_acceptes: acc.enfants_acceptes ?? true,
    animaux_acceptes: acc.animaux_acceptes ?? false,
    actif: acc.actif ?? true,
    source: acc.source ?? "invite",
  }
  if (acc.id) {
    const { error } = await supabase.from("accommodations").update(payload).eq("id", acc.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from("accommodations").insert(payload)
    if (error) throw error
  }
  globalMutate(KEYS.accommodations)
}

export async function deleteAccommodation(id: string) {
  const { error } = await supabase.from("accommodations").delete().eq("id", id)
  if (error) throw error
  globalMutate(KEYS.accommodations)
  globalMutate(KEYS.guests)
}

export async function saveVehicle(vehicle: Partial<Vehicle> & { id?: string }) {
  const gratuit = vehicle.gratuit ?? true
  const payload = {
    conducteur: vehicle.conducteur,
    telephone: vehicle.telephone || null,
    lieu_depart: vehicle.lieu_depart || null,
    heure_depart: vehicle.heure_depart || null,
    places: vehicle.places ?? vehicle.places_disponibles ?? 0,
    commentaires: vehicle.commentaires || null,
    genre_conducteur: vehicle.genre_conducteur || null,
    type_trajet: vehicle.type_trajet ?? "trajet",
    ville_depart: vehicle.ville_depart || null,
    destination: vehicle.destination || null,
    date_depart: vehicle.date_depart || null,
    date_retour: vehicle.date_retour || null,
    heure_retour: vehicle.heure_retour || null,
    places_disponibles: vehicle.places_disponibles ?? vehicle.places ?? 0,
    gratuit,
    participation: gratuit ? 0 : (vehicle.participation ?? 0),
    animaux_acceptes: vehicle.animaux_acceptes ?? false,
    actif: vehicle.actif ?? true,
    source: vehicle.source ?? "invite",
  }
  if (vehicle.id) {
    const { error } = await supabase.from("vehicles").update(payload).eq("id", vehicle.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from("vehicles").insert(payload)
    if (error) throw error
  }
  globalMutate(KEYS.vehicles)
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id)
  if (error) throw error
  globalMutate(KEYS.vehicles)
  globalMutate(KEYS.guests)
}


export async function organizerHasPassword() {
  const { data, error } = await supabase.rpc("organizer_has_password")
  if (error) throw error
  return Boolean(data)
}

export async function setupOrganizerPassword(password: string) {
  const { data, error } = await supabase.rpc("setup_organizer_password", { p_password: password })
  if (error) throw error
  return Boolean(data)
}

export async function verifyWeddingAdmin(password: string) {
  const { data, error } = await supabase.rpc("verify_wedding_admin", { p_password: password })
  if (error) throw error
  return Boolean(data)
}

export async function adminPatchAccommodation(password: string, id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.rpc("admin_patch_accommodation", {
    p_password: password,
    p_id: id,
    p_payload: payload,
  })
  if (error) throw error
  globalMutate(KEYS.accommodations)
  return Boolean(data)
}

export async function adminDeleteAccommodation(password: string, id: string) {
  const { data, error } = await supabase.rpc("admin_delete_accommodation", {
    p_password: password,
    p_id: id,
  })
  if (error) throw error
  globalMutate(KEYS.accommodations)
  return Boolean(data)
}

export async function adminPatchVehicle(password: string, id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.rpc("admin_patch_vehicle", {
    p_password: password,
    p_id: id,
    p_payload: payload,
  })
  if (error) throw error
  globalMutate(KEYS.vehicles)
  return Boolean(data)
}

export async function adminDeleteVehicle(password: string, id: string) {
  const { data, error } = await supabase.rpc("admin_delete_vehicle", {
    p_password: password,
    p_id: id,
  })
  if (error) throw error
  globalMutate(KEYS.vehicles)
  return Boolean(data)
}
