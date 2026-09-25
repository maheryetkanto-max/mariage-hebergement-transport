export type AccommodationType = "Airbnb" | "Hôtel" | "Maison" | "Appartement" | "Autre"
export type Gender = "homme" | "femme"
export type TransportType = "trajet" | "navette"

export const ACCOMMODATION_TYPES: AccommodationType[] = [
  "Airbnb",
  "Hôtel",
  "Maison",
  "Appartement",
  "Autre",
]

export const OUTBOUND_DATES = [
  { value: "2026-12-29", label: "29 décembre" },
  { value: "2026-12-30", label: "30 décembre" },
  { value: "2026-12-31", label: "31 décembre" },
] as const

export const RETURN_DATES = [
  { value: "2026-12-31", label: "31 décembre" },
  { value: "2027-01-01", label: "1er janvier" },
  { value: "2027-01-02", label: "2 janvier" },
] as const

export interface Accommodation {
  id: string
  nom: string
  type: AccommodationType
  adresse: string | null
  capacite: number
  contact: string | null
  commentaires: string | null
  propose_par: string | null
  genre_proposant: Gender | null
  telephone_proposant: string | null
  places_disponibles: number
  minutes_salle: number | null
  date_entree: string | null
  date_sortie: string | null
  prix_personne_nuit: number
  enfants_acceptes: boolean
  animaux_acceptes: boolean
  actif: boolean
  source: string
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
  genre_conducteur: Gender | null
  type_trajet: TransportType
  ville_depart: string | null
  destination: string | null
  date_depart: string | null
  date_retour: string | null
  heure_retour: string | null
  places_disponibles: number
  gratuit: boolean
  participation: number
  animaux_acceptes: boolean
  actif: boolean
  source: string
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

export interface GuestWithRelations extends Guest {
  accommodation: Accommodation | null
  vehicle: Vehicle | null
}

export interface Occupancy {
  occupied: number
  remaining: number
}
