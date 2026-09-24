export type AccommodationType = "Airbnb" | "Hôtel" | "Maison" | "Appartement" | "Autre"

export const ACCOMMODATION_TYPES: AccommodationType[] = [
  "Airbnb",
  "Hôtel",
  "Maison",
  "Appartement",
  "Autre",
]

export interface Accommodation {
  id: string
  nom: string
  type: AccommodationType
  adresse: string | null
  capacite: number
  contact: string | null
  commentaires: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  conducteur: string
  telephone: string | null
  lieu_depart: string | null
  heure_depart: string | null
  places: number
  commentaires: string | null
  created_at: string
}

export interface Guest {
  id: string
  nom: string
  prenom: string | null
  nb_personnes: number
  telephone: string | null
  besoin_hebergement: boolean
  besoin_transport: boolean
  point_depart: string | null
  commentaires: string | null
  accommodation_id: string | null
  vehicle_id: string | null
  created_at: string
}

/** A guest with its resolved relations, used across the UI. */
export interface GuestWithRelations extends Guest {
  accommodation: Accommodation | null
  vehicle: Vehicle | null
}

/** Occupancy computed from guests for an accommodation or vehicle. */
export interface Occupancy {
  occupied: number
  remaining: number
}
