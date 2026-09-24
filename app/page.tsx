"use client"

import Link from "next/link"
import {
  AlertTriangle,
  BedDouble,
  Car,
  CheckCircle2,
  Users,
} from "lucide-react"
import {
  accommodationOccupancy,
  useAccommodations,
  useGuests,
  useVehicles,
  vehicleOccupancy,
} from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { data: guests = [], isLoading: gl } = useGuests()
  const { data: accommodations = [], isLoading: al } = useAccommodations()
  const { data: vehicles = [], isLoading: vl } = useVehicles()

  const loading = gl || al || vl

  const persons = (list: typeof guests) => list.reduce((s, g) => s + g.nb_personnes, 0)

  const totalPersons = persons(guests)
  const needLodgingList = guests.filter((g) => g.besoin_hebergement)
  const lodgedList = needLodgingList.filter((g) => g.accommodation_id)
  const notLodgedList = needLodgingList.filter((g) => !g.accommodation_id)

  const needTransportList = guests.filter((g) => g.besoin_transport)
  const transportedList = needTransportList.filter((g) => g.vehicle_id)
  const notTransportedList = needTransportList.filter((g) => !g.vehicle_id)

  const lodgingPlacesAvailable = accommodations.reduce(
    (s, a) => s + accommodationOccupancy(a, guests).remaining,
    0,
  )
  const carPlacesAvailable = vehicles.reduce(
    (s, v) => s + vehicleOccupancy(v, guests).remaining,
    0,
  )

  const fullAccommodations = accommodations.filter(
    (a) => accommodationOccupancy(a, guests).remaining === 0 && a.capacite > 0,
  )
  const fullVehicles = vehicles.filter(
    (v) => vehicleOccupancy(v, guests).remaining === 0 && v.places > 0,
  )

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'hébergement et du transport des invités."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des données…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              <Users className="h-4 w-4" /> Invités
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Total invités"
                value={totalPersons}
                icon={Users}
                tone="primary"
                hint={`${guests.length} entrée${guests.length > 1 ? "s" : ""}`}
              />
              <StatCard
                label="Besoin d'hébergement"
                value={persons(needLodgingList)}
                icon={BedDouble}
              />
              <StatCard
                label="Déjà hébergés"
                value={persons(lodgedList)}
                icon={CheckCircle2}
                tone="success"
              />
              <StatCard
                label="Reste à héberger"
                value={persons(notLodgedList)}
                icon={AlertTriangle}
                tone={notLodgedList.length ? "warning" : "success"}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              <Car className="h-4 w-4" /> Transport
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Besoin de transport"
                value={persons(needTransportList)}
                icon={Car}
              />
              <StatCard
                label="Déjà transportés"
                value={persons(transportedList)}
                icon={CheckCircle2}
                tone="success"
              />
              <StatCard
                label="Reste à transporter"
                value={persons(notTransportedList)}
                icon={AlertTriangle}
                tone={notTransportedList.length ? "warning" : "success"}
              />
              <StatCard
                label="Places voitures dispo."
                value={carPlacesAvailable}
                icon={Car}
                tone="primary"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              <BedDouble className="h-4 w-4" /> Capacités disponibles
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Places d'hébergement dispo."
                value={lodgingPlacesAvailable}
                icon={BedDouble}
                tone="primary"
                hint={`${accommodations.length} hébergement${accommodations.length > 1 ? "s" : ""}`}
              />
              <StatCard
                label="Places voitures dispo."
                value={carPlacesAvailable}
                icon={Car}
                tone="primary"
                hint={`${vehicles.length} voiture${vehicles.length > 1 ? "s" : ""}`}
              />
            </div>
          </section>

          <AlertsSection
            notLodged={notLodgedList}
            notTransported={notTransportedList}
            fullAccommodations={fullAccommodations.map((a) => a.nom)}
            fullVehicles={fullVehicles.map((v) => v.conducteur)}
          />
        </div>
      )}
    </div>
  )
}

function AlertsSection({
  notLodged,
  notTransported,
  fullAccommodations,
  fullVehicles,
}: {
  notLodged: { id: string; nom: string; prenom: string | null }[]
  notTransported: { id: string; nom: string; prenom: string | null }[]
  fullAccommodations: string[]
  fullVehicles: string[]
}) {
  const name = (g: { nom: string; prenom: string | null }) =>
    [g.prenom, g.nom].filter(Boolean).join(" ")

  const nothing =
    !notLodged.length && !notTransported.length && !fullAccommodations.length && !fullVehicles.length

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        <AlertTriangle className="h-4 w-4" /> Alertes
      </h2>
      {nothing ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center gap-3 py-4 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm">Tout est sous contrôle : aucune alerte pour le moment.</span>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <AlertCard
            title="Invités sans hébergement"
            tone="warning"
            items={notLodged.map((g) => name(g))}
            empty="Tous les invités concernés sont hébergés."
            href="/invites"
          />
          <AlertCard
            title="Invités sans transport"
            tone="warning"
            items={notTransported.map((g) => name(g))}
            empty="Tous les invités concernés ont un transport."
            href="/invites"
          />
          <AlertCard
            title="Hébergements complets"
            tone="muted"
            items={fullAccommodations}
            empty="Aucun hébergement complet."
            href="/hebergements"
          />
          <AlertCard
            title="Voitures complètes"
            tone="muted"
            items={fullVehicles}
            empty="Aucune voiture complète."
            href="/transports"
          />
        </div>
      )}
    </section>
  )
}

function AlertCard({
  title,
  items,
  empty,
  tone,
  href,
}: {
  title: string
  items: string[]
  empty: string
  tone: "warning" | "muted"
  href: string
}) {
  return (
    <Card className={tone === "warning" && items.length ? "border-amber-200 bg-amber-50/60" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant={items.length ? "default" : "secondary"}>{items.length}</Badge>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <Link key={`${item}-${i}`} href={href}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {item}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
