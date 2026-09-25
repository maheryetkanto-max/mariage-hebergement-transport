"use client"

import Link from "next/link"
import { ArrowRight, BedDouble, Car, MapPin, Plus, Users } from "lucide-react"
import { useAccommodations, useVehicles } from "@/lib/data"

export default function HomePage() {
  const { data: accommodations = [] } = useAccommodations()
  const { data: vehicles = [] } = useVehicles()

  const activeAccommodations = accommodations.filter((a) => a.actif !== false)
  const activeVehicles = vehicles.filter((v) => v.actif !== false)
  const lodgingPlaces = activeAccommodations.reduce((sum, a) => sum + (a.places_disponibles ?? a.capacite ?? 0), 0)
  const transportPlaces = activeVehicles.reduce((sum, v) => sum + (v.places_disponibles ?? v.places ?? 0), 0)

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#6D1925]/10 bg-[#FFF7E9] px-5 py-10 shadow-[0_18px_60px_rgba(109,25,37,0.08)] sm:px-9 sm:py-14">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#6D1925]/5" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6D1925]/55">31 décembre 2026</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-[#6D1925] sm:text-6xl">
            Hébergement & transport
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5B4549] sm:text-lg">
            Trouvez rapidement une place chez un invité ou dans une voiture, ou partagez les places que vous avez encore disponibles autour de notre mariage.
          </p>
        </div>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#6D1925]/10 bg-white/75 p-4">
            <div className="flex items-center gap-2 text-[#6D1925]"><BedDouble className="h-5 w-5" /><span className="text-sm font-semibold">Hébergement</span></div>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-serif text-4xl font-semibold text-[#6D1925]">{lodgingPlaces}</span>
              <span className="pb-1 text-sm text-[#6D1925]/55">places disponibles</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#6D1925]/10 bg-white/75 p-4">
            <div className="flex items-center gap-2 text-[#6D1925]"><Car className="h-5 w-5" /><span className="text-sm font-semibold">Transport</span></div>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-serif text-4xl font-semibold text-[#6D1925]">{transportPlaces}</span>
              <span className="pb-1 text-sm text-[#6D1925]/55">places disponibles</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChoiceCard
          icon={<BedDouble className="h-7 w-7" />}
          title="Je cherche un hébergement"
          text="Comparez les logements, les dates, le prix par personne, la distance de la salle et les places restantes."
          href="/hebergements"
          addHref="/hebergements?action=add"
          addLabel="Proposer un logement"
        />
        <ChoiceCard
          icon={<Car className="h-7 w-7" />}
          title="Je cherche un transport"
          text="Trouvez un covoiturage depuis l’Île-de-France ou une navette locale vers une gare, l’église ou la salle."
          href="/transports"
          addHref="/transports?action=add"
          addLabel="Proposer un transport"
        />
      </section>

      <section className="grid gap-3 rounded-2xl border border-[#6D1925]/10 bg-white/55 p-5 sm:grid-cols-3">
        <Mini icon={<Users className="h-4 w-4" />} title="Entre invités" text="Les offres sont proposées directement par les personnes présentes au mariage." />
        <Mini icon={<MapPin className="h-4 w-4" />} title="Localisation rapide" text="Les adresses peuvent être ouvertes directement dans Maps." />
        <Mini icon={<ArrowRight className="h-4 w-4" />} title="Contact direct" text="Téléphonez à la personne qui propose l’offre pour finaliser l’organisation." />
      </section>
    </div>
  )
}

function ChoiceCard({
  icon,
  title,
  text,
  href,
  addHref,
  addLabel,
}: {
  icon: React.ReactNode
  title: string
  text: string
  href: string
  addHref: string
  addLabel: string
}) {
  return (
    <article className="rounded-3xl border border-[#6D1925]/10 bg-white p-5 shadow-[0_8px_35px_rgba(109,25,37,0.055)] sm:p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6D1925] text-[#FFF7E9]">{icon}</div>
      <h2 className="mt-5 font-serif text-2xl font-semibold text-[#6D1925]">{title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-[#5B4549]">{text}</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6D1925] px-4 text-sm font-semibold text-[#FFF7E9]">
          Voir les offres <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={addHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">
          <Plus className="h-4 w-4" /> {addLabel}
        </Link>
      </div>
    </article>
  )
}

function Mini({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-[#6D1925]">{icon}</div>
      <div><p className="text-sm font-semibold text-[#4B242B]">{title}</p><p className="mt-1 text-xs leading-5 text-[#6D1925]/55">{text}</p></div>
    </div>
  )
}
