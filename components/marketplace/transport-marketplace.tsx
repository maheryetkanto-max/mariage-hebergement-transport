"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Car, Clock3, ExternalLink, MapPin, MessageCircle, Phone, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"
import { reserveVehicle, saveVehicle, useVehicles, useOfferPeople } from "@/lib/data"
import { OUTBOUND_DATES, RETURN_DATES, type Gender, type TransportType, type Vehicle } from "@/lib/types"
import { NamedPeople, personLabel, type NamedPerson } from "@/components/marketplace/named-people"
import { AddressPicker } from "@/components/marketplace/address-picker"
import { FrenchPhone, isFrenchPhone } from "@/components/marketplace/french-phone"
import { InterestChoices, PeopleList } from "@/components/marketplace/people-and-interests"
import { CityPicker, idfDepartment, isListedCity, normalizeCity } from "@/components/marketplace/city-picker"

const adultChoices = [1, 2, 3, 4, 5, 6, 7]
const CHURCH = "Église protestante Unie de Troyes"
const VENUE = "Clos Belair"
const STATIONS = ["Troyes", "Vendeuvre-sur-Barse", "Bar-sur-Aube", "Romilly-sur-Seine", "Nogent-sur-Seine"] as const
const DEPARTMENTS = [["75", "Paris"], ["77", "Seine-et-Marne"], ["78", "Yvelines"], ["91", "Essonne"], ["92", "Hauts-de-Seine"], ["93", "Seine-Saint-Denis"], ["94", "Val-de-Marne"], ["95", "Val-d’Oise"]] as const

const field = "w-full rounded-xl border border-[#6D1925]/15 bg-white/75 px-3 py-2.5 text-sm text-[#34171C] outline-none transition focus:border-[#6D1925]/45 focus:ring-2 focus:ring-[#6D1925]/10"
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#6D1925]/70"

function dateLabel(value: string | null) {
  if (!value) return "—"
  const found = [...OUTBOUND_DATES, ...RETURN_DATES].find((d) => d.value === value)
  return found?.label ?? value
}

function genderEmoji(gender: Gender | null) {
  return gender === "femme" ? "👩" : gender === "homme" ? "👨" : gender === "homme_et_femme" ? "👫" : "🙂"
}

function parseMoney(value: string | number) {
  const amount = Number(String(value).trim().replace(",", "."))
  return Number.isFinite(amount) && amount >= 0 ? amount : NaN
}

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function externalLinkFromComments(value: string | null) {
  return value?.match(/https?:\/\/[^\s]+/)?.[0] ?? null
}

function commentsWithoutLink(value: string | null) {
  return value?.replace(/(?:Lien\s*:\s*)?https?:\/\/[^\s]+/g, "").trim() ?? ""
}

function whatsappNumber(phone: string) {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = "33" + digits.slice(1)
  return digits
}

function transportQuestionLink(veh: Vehicle) {
  if (!veh.telephone) return null
  const text = `Bonjour ${veh.conducteur}, j’ai une question concernant votre offre de ${veh.type_trajet === "navette" ? "navette" : "covoiturage"} pour le mariage de Mahery & Kanto.`
  return `https://wa.me/${whatsappNumber(veh.telephone)}?text=${encodeURIComponent(text)}`
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || value
}

function ownerDisplayName(veh: Vehicle) {
  const main = firstName(veh.conducteur)
  if (veh.genre_conducteur !== "homme_et_femme" || !veh.compagnons_prenoms) return main
  const companion = veh.compagnons_prenoms.split(",")[0]?.replace(/\s*\([^)]*\)\s*$/, "").trim()
  return companion ? `${main} & ${firstName(companion)}` : main
}

function cityWithDepartment(city: string | null) {
  if (!city) return "À préciser"
  const department = idfDepartment(city)
  return department ? `${city} (${department})` : city
}

function uniqueReturnPeople(
  outboundPeople: { name: string; origin: string | null; interests: string[]; luggage?: string | null }[],
  returnPeople: { name: string; origin: string | null; interests: string[]; luggage?: string | null }[],
) {
  const outboundNames = new Set(outboundPeople.map((person) => normalizeCity(person.name)))
  return returnPeople.map((person) =>
    outboundNames.has(normalizeCity(person.name))
      ? { ...person, interests: [] }
      : person,
  )
}

export function TransportMarketplace() {
  const { data: vehicles = [], isLoading } = useVehicles()
  const { data: offerPeople = [] } = useOfferPeople()
  const [showForm, setShowForm] = useState(false)
  const [manageUrl, setManageUrl] = useState("")
  const [offerSource, setOfferSource] = useState<"invite" | "admin">("invite")
  const [searchLeg, setSearchLeg] = useState<"aller" | "retour">("aller")
  const [type, setType] = useState<"" | "church" | "venue" | "navette">("")
  const [date, setDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [department, setDepartment] = useState("")
  const [returnCity, setReturnCity] = useState("")
  const [people, setPeople] = useState(1)
  const [gender, setGender] = useState<"" | Gender>("")
  const [petsOnly, setPetsOnly] = useState(false)
  const [bookingVehicle, setBookingVehicle] = useState<{ vehicle: Vehicle; leg: "aller" | "retour" } | null>(null)

  useEffect(() => { setManageUrl(window.localStorage.getItem("last-offer-group-link") ?? "") }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("action") === "add") setShowForm(true)
    if (params.get("source") === "admin") setOfferSource("admin")
  }, [])

  useEffect(() => {
    if (showForm) document.getElementById("proposer")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [showForm])

  const filtered = useMemo(() => {
    const cityQuery = normalizeCity(returnCity)
    return vehicles
      .filter((v) => v.actif !== false)
      .filter((v) => {
        const remaining = searchLeg === "aller"
          ? (v.places_disponibles ?? v.places)
          : (v.date_retour ? (v.places_retour_disponibles ?? v.places) : 0)
        return remaining === 0 || remaining >= people
      })
      .filter((v) => searchLeg === "retour" || !type || (type === "navette" ? v.type_trajet === "navette" : type === "church" ? normalizeCity(v.destination ?? "").includes("eglise") : normalizeCity(v.destination ?? "").includes("salle") || normalizeCity(v.destination ?? "").includes("clos belair")))
      .filter((v) => searchLeg === "retour" || !date || v.date_depart === date)
      .filter((v) => searchLeg === "aller" || !returnDate || v.date_retour === returnDate)
      .filter((v) => !gender || v.genre_conducteur === gender)
      .filter((v) => !petsOnly || v.animaux_acceptes)
      .filter((v) => searchLeg === "retour" || !department || idfDepartment(v.ville_depart ?? "") === department)
      .filter((v) => searchLeg === "aller" || !cityQuery || normalizeCity(v.retour_lieu_depart ?? "").includes(cityQuery))
      .sort((a, b) => {
        const left = searchLeg === "aller" ? (a.ville_depart ?? "") : (a.retour_lieu_depart ?? "")
        const right = searchLeg === "aller" ? (b.ville_depart ?? "") : (b.retour_lieu_depart ?? "")
        return left.localeCompare(right, "fr", { sensitivity: "base" })
      })
  }, [vehicles, searchLeg, type, date, returnDate, department, returnCity, people, gender, petsOnly])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#6D1925]/10 bg-[#FFF9F0] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6D1925]/55">Mariage M & K</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-[#6D1925] sm:text-4xl">Transports disponibles</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5B4549]">
              Covoiturages depuis l’Île-de-France et navettes locales autour de la salle, de l’église ou des gares.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6D1925] px-4 py-2.5 text-sm font-semibold text-[#FFF7E9] shadow-sm transition hover:opacity-90">
            <Plus className="h-4 w-4" /> Proposer un transport
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#6D1925]/10 bg-white/65 p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#6D1925]"><Search className="h-4 w-4" /> Trouver une place</div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#FFF7E9] p-1.5">
          <button
            type="button"
            onClick={() => { setSearchLeg("aller"); setReturnDate(""); setReturnCity("") }}
            className={`min-h-11 rounded-xl px-4 text-sm font-bold transition ${searchLeg === "aller" ? "bg-[#6D1925] text-[#FFF7E9] shadow-sm" : "bg-transparent text-[#6D1925]"}`}
          >
            Chercher un aller
          </button>
          <button
            type="button"
            onClick={() => { setSearchLeg("retour"); setType(""); setDate(""); setDepartment("") }}
            className={`min-h-11 rounded-xl px-4 text-sm font-bold transition ${searchLeg === "retour" ? "bg-[#6D1925] text-[#FFF7E9] shadow-sm" : "bg-transparent text-[#6D1925]"}`}
          >
            Chercher un retour
          </button>
        </div>

        {searchLeg === "aller" ? (
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <span className={label}>Destination de l’aller</span>
              <select className={field} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                <option value="">Toutes</option>
                <option value="church">Île-de-France → Église</option>
                <option value="venue">Île-de-France → Salle de réception</option>
                <option value="navette">Navette locale depuis une gare autour de Troyes</option>
              </select>
            </div>
            <div>
              <span className={label}>Date de départ</span>
              <select className={field} value={date} onChange={(e) => setDate(e.target.value)}>
                <option value="">Toutes</option>
                {OUTBOUND_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <span className={label}>Département de départ</span>
              <select className={field} value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">Tous les départements</option>
                {DEPARTMENTS.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}
              </select>
            </div>
            <div>
              <span className={label}>Places nécessaires (adultes et enfants)</span>
              <select className={field} value={people} onChange={(e) => setPeople(Number(e.target.value))}>
                {adultChoices.map((count) => <option key={count} value={count}>{count} personne{count > 1 ? "s" : ""}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <span className={label}>Date de retour</span>
              <select className={field} value={returnDate} onChange={(e) => setReturnDate(e.target.value)}>
                <option value="">Toutes</option>
                {RETURN_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <span className={label}>Ville de retour (autour de Troyes)</span>
              <CityPicker className={field} label="Chercher une ville de retour autour de Troyes" area="troyes-2h" placeholder="Tapez une ville…" value={returnCity} onChange={setReturnCity} />
            </div>
            <div>
              <span className={label}>Places nécessaires (adultes et enfants)</span>
              <select className={field} value={people} onChange={(e) => setPeople(Number(e.target.value))}>
                {adultChoices.map((count) => <option key={count} value={count}>{count} personne{count > 1 ? "s" : ""}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <select className="rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs" value={gender} onChange={(e) => setGender(e.target.value as "" | Gender)}>
            <option value="">👤 Peu importe</option>
            <option value="femme">👩 Femme</option>
            <option value="homme">👨 Homme</option>
            <option value="homme_et_femme">👫 Couple</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs">
            <input type="checkbox" checked={petsOnly} onChange={(e) => setPetsOnly(e.target.checked)} /> 🐶 Animaux acceptés
          </label>
        </div>
      </section>
      {manageUrl && <div className="rounded-xl border border-[#6D1925]/15 bg-white p-4 text-sm"><strong>Votre lien personnel :</strong> <a className="underline text-[#6D1925]" href={manageUrl}>Créer ou suivre le groupe WhatsApp de votre fiche</a>. Conservez ce lien.</div>}

      {showForm && <TransportForm onClose={() => setShowForm(false)} onPublished={(url) => { setManageUrl(url); window.localStorage.setItem("last-offer-group-link", url); setShowForm(false); setType(""); setDate(""); setReturnDate(""); setDepartment(""); setReturnCity(""); setPeople(1); setGender(""); setPetsOnly(false); window.setTimeout(() => document.getElementById("transport-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30) }} source={offerSource} />}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des transports…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#6D1925]/20 bg-white/45 px-5 py-12 text-center">
          <Car className="mx-auto mb-3 h-9 w-9 text-[#6D1925]/35" />
          <p className="font-medium text-[#4B242B]">Aucun transport ne correspond à ces critères.</p>
          <p className="mt-1 text-sm text-[#6D1925]/55">Essayez une autre date ou affichez tous les départements.</p>
          <button type="button" onClick={() => { setType(""); setDate(""); setReturnDate(""); setDepartment(""); setReturnCity(""); setPeople(1); setGender(""); setPetsOnly(false) }} className="mt-4 min-h-11 rounded-xl border border-[#6D1925]/25 bg-white px-4 text-sm font-semibold text-[#6D1925]">Afficher tous les transports</button>
        </div>
      ) : (
        <div id="transport-offers" className="grid scroll-mt-20 gap-3 lg:grid-cols-2">
          {filtered.map((veh) => (
            <TransportOfferCard
              key={veh.id}
              veh={veh}
              outboundPeople={offerPeople.find((group) => group.type === "vehicle" && group.id === veh.id && group.leg === "aller")?.people ?? [{ name: veh.conducteur.split(" ")[0], origin: veh.ville_depart, interests: veh.centres_interet ?? [] }]}
              returnPeople={offerPeople.find((group) => group.type === "vehicle" && group.id === veh.id && group.leg === "retour")?.people ?? []}
              onBook={(leg) => setBookingVehicle({ vehicle: veh, leg })}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-[#6D1925]/45">{filtered.length} transport{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>

      {bookingVehicle && (
        <TransportReservationDialog
          veh={bookingVehicle.vehicle}
          trajetSens={bookingVehicle.leg}
          initialPeople={people}
          onClose={() => setBookingVehicle(null)}
        />
      )}
    </div>
  )
}

function TransportOfferCard({
  veh,
  outboundPeople,
  returnPeople,
  onBook,
}: {
  veh: Vehicle
  outboundPeople: { name: string; origin: string | null; interests: string[]; luggage?: string | null }[]
  returnPeople: { name: string; origin: string | null; interests: string[]; luggage?: string | null }[]
  onBook: (leg: "aller" | "retour") => void
}) {
  const outboundPlaces = veh.places_disponibles ?? veh.places
  const returnPlaces = veh.date_retour ? (veh.places_retour_disponibles ?? veh.places) : 0
  const outboundAvailable = outboundPlaces > 0
  const returnAvailable = Boolean(veh.date_retour) && returnPlaces > 0
  const destination = veh.type_trajet === "navette"
    ? "Navette locale"
    : normalizeCity(veh.destination ?? "").includes("eglise")
      ? "Église"
      : "Salle de réception"

  return (
    <article className="overflow-hidden rounded-2xl border border-[#6D1925]/10 bg-white shadow-[0_6px_22px_rgba(109,25,37,0.05)]">
      <div className="flex items-start justify-between gap-3 bg-[#FFF7E9]/55 p-4">
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-semibold text-[#6D1925]">{genderEmoji(veh.genre_conducteur)} {ownerDisplayName(veh)}</h2>
          <p className="mt-1 text-xs text-[#6D1925]/65">{veh.type_trajet === "navette" ? "🚉 Navette locale depuis une gare" : "🚗 Covoiturage"}</p>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#FFF7E9]/45 p-3 text-xs text-[#5B4549]">
          <div>
            <p className="font-bold uppercase tracking-wide text-[#6D1925]/55">Aller</p>
            <p className="mt-1 font-semibold text-[#4B242B]">{dateLabel(veh.date_depart)}{veh.heure_depart ? ` · ${veh.heure_depart}` : ""}</p>
            <p className="mt-1">{veh.type_trajet === "navette" ? `Gare de ${veh.ville_depart || "à préciser"}` : cityWithDepartment(veh.ville_depart)} → {destination}</p>
            <div className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 font-bold ${outboundAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              <span className={`mr-1.5 h-2 w-2 animate-pulse rounded-full ${outboundAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
              {outboundAvailable ? (outboundPlaces === 1 ? "Disponible · 1 place" : `Disponible · ${outboundPlaces} places`) : "Victime de son succès ✨"}
            </div>
            <button
              type="button"
              disabled={!outboundAvailable || !veh.reservation_active}
              onClick={() => onBook("aller")}
              className="mt-2 min-h-9 w-full rounded-lg bg-[#6D1925] px-3 text-xs font-semibold text-[#FFF7E9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Réserver l’aller
            </button>
          </div>
          <div className="border-l border-[#6D1925]/10 pl-3">
            <p className="font-bold uppercase tracking-wide text-[#6D1925]/55">Retour</p>
            {veh.date_retour ? <>
              <p className="mt-1 font-semibold text-[#4B242B]">{dateLabel(veh.date_retour)}{veh.heure_retour ? ` · ${veh.heure_retour}` : ""}</p>
              <p className="mt-1">{veh.retour_lieu_depart || "Départ à préciser"} → {cityWithDepartment(veh.retour_ville_arrivee)}</p>
              <div className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 font-bold ${returnAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                <span className={`mr-1.5 h-2 w-2 animate-pulse rounded-full ${returnAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
                {returnAvailable ? (returnPlaces === 1 ? "Disponible · 1 place" : `Disponible · ${returnPlaces} places`) : "Victime de son succès ✨"}
              </div>
              <button
                type="button"
                disabled={!returnAvailable || !veh.reservation_active}
                onClick={() => onBook("retour")}
                className="mt-2 min-h-9 w-full rounded-lg bg-[#6D1925] px-3 text-xs font-semibold text-[#FFF7E9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Réserver le retour
              </button>
            </> : <p className="mt-1 text-[#6D1925]/55">Pas de retour proposé</p>}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#6D1925]/50">Montant / personne</p>
          <p className="font-serif text-2xl font-bold text-[#6D1925]">{money(Number(veh.participation || 0))} €</p>
        </div>

        <details className="mt-3 rounded-xl border border-[#6D1925]/10 bg-[#FFF7E9]/35 p-3">
          <summary className="cursor-pointer rounded-xl bg-[#6D1925] px-4 py-3 text-center text-sm font-bold text-[#FFF7E9] shadow-sm">Voir les détails</summary>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Sticker>{genderEmoji(veh.genre_conducteur)} {veh.genre_conducteur === "femme" ? "Conductrice" : veh.genre_conducteur === "homme_et_femme" ? "Couple" : "Conducteur"}</Sticker>
              <Sticker>{veh.animaux_acceptes ? "🐶 Animaux OK" : "🚫🐶 Sans animaux"}</Sticker>
              <Sticker>💶 {money(Number(veh.participation || 0))} € / pers.</Sticker>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/70 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6D1925]/55">Personnes confirmées · Aller</p>
                <PeopleList people={outboundPeople} />
              </div>
              {veh.date_retour && <div className="rounded-xl bg-white/70 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#6D1925]/55">Personnes confirmées · Retour</p>
                {returnPeople.length ? <PeopleList people={uniqueReturnPeople(outboundPeople, returnPeople)} /> : <p className="text-xs text-[#6D1925]/55">Aucune réservation confirmée pour le retour.</p>}
              </div>}
            </div>

            {veh.telephone && <div className="rounded-xl border border-[#6D1925]/10 bg-white/70 p-3">
              <p className="text-sm font-bold text-[#6D1925]">Une question avant de réserver ?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <a href={transportQuestionLink(veh) || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-[#10351d]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                <a href={`tel:${veh.telephone.replace(/\s/g, "")}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#6D1925]/20 bg-white px-3 text-xs font-semibold text-[#6D1925]"><Phone className="h-4 w-4" /> Appeler</a>
                <a href={`sms:${veh.telephone.replace(/\s/g, "")}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#6D1925]/20 bg-white px-3 text-xs font-semibold text-[#6D1925]"><MessageCircle className="h-4 w-4" /> Message</a>
              </div>
            </div>}

            {externalLinkFromComments(veh.commentaires) && <a href={externalLinkFromComments(veh.commentaires) || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#6D1925]/20 bg-white px-3 text-xs font-semibold text-[#6D1925]"><ExternalLink className="h-4 w-4" /> Ouvrir le lien de l’offre</a>}
            {commentsWithoutLink(veh.commentaires) && <p className="rounded-xl bg-white/65 p-3 text-xs leading-5 text-[#5B4549]">{commentsWithoutLink(veh.commentaires)}</p>}
          </div>
        </details>
      </div>
    </article>
  )
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2 rounded-xl bg-[#6D1925]/[0.035] px-3 py-2.5 text-[#5B4549]"><span className="text-[#6D1925]">{icon}</span><span>{text}</span></div>
}

function Sticker({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-2.5 py-1 text-xs font-medium text-[#5B3037]">{children}</span>
}

function TransportForm({
  onClose,
  onPublished,
  source,
}: {
  onClose: () => void
  onPublished: (url: string) => void
  source: "invite" | "admin"
}) {
  const [saving, setSaving] = useState(false)
  const [occupants, setOccupants] = useState<NamedPerson[]>([])
  const [returnFromAccommodation, setReturnFromAccommodation] = useState(false)
  const [fromStation, setFromStation] = useState(false)
  const [form, setForm] = useState({
    conducteur: "",
    genre_conducteur: "femme" as Gender,
    telephone: "+33",
    email_conducteur: "",

    type_trajet: "trajet" as TransportType,
    ville_depart: "",
    lieu_depart: "",
    destination: VENUE,
    date_depart: "2026-12-31",
    heure_depart: "",
    date_retour: "",
    heure_retour: "",
    retour_lieu_depart: VENUE,
    retour_ville_arrivee: "",
    places_disponibles: 1,
    gratuit: false,
    participation: "0",
    animaux_acceptes: false,
    commentaires: "",
    external_url: "",
    compagnons_prenoms: "",
    centres_interet: [] as string[],
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.conducteur.trim() || !isFrenchPhone(form.telephone) || !form.email_conducteur.trim() || !form.ville_depart.trim() || !form.lieu_depart.trim() || !form.heure_depart) {
      toast.error("Merci de compléter le nom, le téléphone, l’email, la ville, le lieu et l’heure de départ.")
      return
    }
    if (!(fromStation ? STATIONS.includes(form.ville_depart as typeof STATIONS[number]) : isListedCity(form.ville_depart, "idf")) || (form.date_retour && !isListedCity(form.retour_ville_arrivee, "idf"))) {
      toast.error("Choisissez une ville d’Île-de-France ou une gare proposée, ainsi que la ville de retour.")
      return
    }
    if (form.date_retour && returnFromAccommodation && !isListedCity(form.retour_lieu_depart, "troyes-2h")) {
      toast.error("Choisissez la ville de l’hébergement autour de Troyes pour le retour.")
      return
    }
    if (form.heure_depart && !/^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/.test(form.heure_depart)) {
      toast.error("Choisissez une heure de départ par tranche de 15 minutes.")
      return
    }
    if (form.heure_retour && !/^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/.test(form.heure_retour)) {
      toast.error("Choisissez une heure de retour par tranche de 15 minutes.")
      return
    }
    if (occupants.some((person) => !person.firstName.trim() || !person.lastName.trim())) { toast.error("Indiquez le prénom et le nom de chaque adulte ou enfant avec vous."); return }
    const parsedParticipation = parseMoney(form.participation)
    if (Number.isNaN(parsedParticipation)) {
      toast.error("Indiquez un montant valide, par exemple 0, 15 ou 15,50.")
      return
    }
    setSaving(true)
    try {
      const groupToken = crypto.randomUUID()
      const offerId = await saveVehicle({ ...form, gratuit: parsedParticipation === 0, participation: parsedParticipation, commentaires: [form.commentaires.trim(), form.external_url.trim() ? "Lien : " + form.external_url.trim() : ""].filter(Boolean).join("\n"), compagnons_prenoms: occupants.map(personLabel).join(", "), group_manage_token: groupToken, retour_lieu_depart: form.date_retour ? form.retour_lieu_depart : "", retour_ville_arrivee: form.date_retour ? form.retour_ville_arrivee : "", places: form.places_disponibles, source, actif: true })
      toast.success("Votre transport a bien été ajouté.")
      onPublished(`/groupe?type=vehicle&offre=${offerId}&gestion=${groupToken}`)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error && error.message.includes("vehicles_french_phone") ? "Vérifiez le numéro français (+33 suivi de 9 chiffres)." : "Impossible d’ajouter le transport. Vérifiez les champs et réessayez.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="proposer" className="scroll-mt-20 rounded-3xl border border-[#6D1925]/15 bg-[#FFF7E9] p-5 shadow-lg sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D1925]/55">Partager une place</p>
          <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Proposer un transport</h2>
          <p className="mt-1 text-sm text-[#5B4549]">Covoiturage depuis votre ville ou disponibilité locale pour une gare / la salle.</p>
        </div>
        <button onClick={onClose} aria-label="Fermer" className="rounded-full p-2 text-[#6D1925] hover:bg-white/70"><X className="h-5 w-5" /></button>
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field title="Nom du conducteur / des propriétaires *"><input className={field} value={form.conducteur} onChange={(e) => set("conducteur", e.target.value)} /></Field>
          <Field title="Propriétaire(s) du véhicule *">
            <select className={field} value={form.genre_conducteur} onChange={(e) => set("genre_conducteur", e.target.value as Gender)}>
              <option value="femme">👩 Femme</option><option value="homme">👨 Homme</option>
              <option value="homme_et_femme">👫 Couple</option>
            </select>
          </Field>
          <Field title="Téléphone français * · visible pour les questions"><FrenchPhone className={field} value={form.telephone} onChange={(value) => set("telephone", value)} /></Field>
          <Field title="Email *"><input className={field} type="email" value={form.email_conducteur} onChange={(e) => set("email_conducteur", e.target.value)} /></Field>
        </div>

        <NamedPeople title="Adultes et enfants qui voyagent déjà avec vous (prénom et nom)" value={occupants} onChange={setOccupants} />
        <InterestChoices value={form.centres_interet} onChange={(values) => set("centres_interet", values)} />
        <div><span className={label}>Type de départ *</span><select className={field} value={fromStation ? "station" : "idf"} onChange={(e) => { const station = e.target.value === "station"; setFromStation(station); set("ville_depart", ""); set("lieu_depart", ""); set("type_trajet", station ? "navette" : "trajet") }}><option value="idf">🚗 Depuis une ville d’Île-de-France</option><option value="station">🚉 Prise en charge à une gare autour de Troyes</option></select></div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className={label}>{fromStation ? "Gare de prise en charge *" : "Ville de départ (Île-de-France) *"}</span>{fromStation ? <select className={field} value={form.ville_depart} onChange={(e) => { set("ville_depart", e.target.value); set("lieu_depart", e.target.value ? `Gare de ${e.target.value}` : "") }}><option value="">Choisir une gare</option>{STATIONS.map((station) => <option key={station} value={station}>Gare de {station}</option>)}</select> : <CityPicker className={field} label="Ville de départ" area="idf" placeholder="Tapez une ville…" value={form.ville_depart} onChange={(value) => set("ville_depart", value)} />}</div>
          <Field title={fromStation ? "Adresse / point de rendez-vous exact à la gare *" : "Adresse précise de départ *"}><AddressPicker className={field} label="Lieu de prise en charge précis" city={form.ville_depart} value={form.lieu_depart} onChange={(value) => set("lieu_depart", value)} /></Field>
        </div>

        <Field title="Lieu de dépose à l’aller *"><select className={field} value={form.destination} onChange={(e) => set("destination", e.target.value)}><option value={CHURCH}>{CHURCH}</option><option value={VENUE}>{VENUE} (salle de réception)</option></select></Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field title="Départ *">
            <select className={field} value={form.date_depart} onChange={(e) => set("date_depart", e.target.value)}>
              {OUTBOUND_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Heure de départ *"><select className={field} value={form.heure_depart} onChange={(e) => set("heure_depart", e.target.value)}><option value="">Choisir une heure</option>{Array.from({ length: 96 }, (_, index) => { const value = `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`; return <option key={value} value={value}>{value}</option> })}</select></Field>
          <Field title="Places disponibles (adultes et enfants) *"><select className={field} value={form.places_disponibles} onChange={(e) => set("places_disponibles", Number(e.target.value))}>{adultChoices.map((count) => <option key={count} value={count}>{count} place{count > 1 ? "s" : ""}</option>)}</select><span className="mt-1 block text-xs text-[#6D1925]/65">Chaque enfant occupe une place. L’adresse exacte ne sera communiquée qu’après réservation.</span></Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Retour (facultatif)">
            <select className={field} value={form.date_retour} onChange={(e) => set("date_retour", e.target.value)}>
              <option value="">Pas de retour proposé</option>
              {RETURN_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Heure de retour"><select className={field} value={form.heure_retour} onChange={(e) => set("heure_retour", e.target.value)} disabled={!form.date_retour}><option value="">À préciser</option>{Array.from({ length: 96 }, (_, index) => { const value = `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`; return <option key={value} value={value}>{value}</option> })}</select></Field>
        </div>

        {form.date_retour && <div className="grid gap-4 sm:grid-cols-2"><div><Field title="Départ du retour *"><select className={field} value={returnFromAccommodation ? "hebergement" : "salle"} onChange={(e) => { const fromAccommodation = e.target.value === "hebergement"; setReturnFromAccommodation(fromAccommodation); set("retour_lieu_depart", fromAccommodation ? "" : VENUE) }}><option value="salle">{VENUE} (salle)</option><option value="hebergement">Ville de l’hébergement</option></select></Field>{returnFromAccommodation && <div className="mt-3"><span className={label}>Ville de l’hébergement autour de Troyes *</span><CityPicker className={field} label="Ville de l’hébergement au retour" area="troyes-2h" placeholder="Tapez une ville…" value={form.retour_lieu_depart} onChange={(value) => set("retour_lieu_depart", value)} /></div>}</div><div><span className={label}>Ville de dépose au retour (Île-de-France) *</span><CityPicker className={field} label="Ville de dépose au retour" area="idf" placeholder="Tapez une ville…" value={form.retour_ville_arrivee} onChange={(value) => set("retour_ville_arrivee", value)} /></div></div>}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field title="Montant par personne (€) · 0 € accepté">
            <input
              className={field}
              type="text"
              inputMode="decimal"
              placeholder="Ex. 0, 15 ou 15,50"
              value={form.participation}
              onChange={(e) => set("participation", e.target.value.replace(/[^0-9,.]/g, ""))}
            />
          </Field>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-white/60 px-4 py-3 text-sm"><span>Animaux acceptés 🐶</span><input type="checkbox" checked={form.animaux_acceptes} onChange={(e) => set("animaux_acceptes", e.target.checked)} /></label>
        </div>

        <Field title="Lien utile (facultatif)">
          <input
            className={field}
            type="url"
            inputMode="url"
            placeholder="https://..."
            value={form.external_url}
            onChange={(e) => set("external_url", e.target.value)}
          />
          <span className="mt-1 block text-xs text-[#6D1925]/65">Par exemple une page avec davantage d’informations sur le trajet, le véhicule ou le point de rendez-vous.</span>
        </Field>

        <Field title="Informations complémentaires"><textarea className={field} rows={3} placeholder="Ex. petit bagage uniquement, passage par telle gare…" value={form.commentaires} onChange={(e) => set("commentaires", e.target.value)} /></Field>

        <p className="rounded-xl bg-white/70 p-3 text-sm text-[#5B4549]">Un lien personnel pour créer le groupe WhatsApp vous sera donné après publication, dès que trois personnes seront présentes.</p>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">Annuler</button>
          <button disabled={saving} type="submit" className="min-h-11 rounded-xl bg-[#6D1925] px-5 text-sm font-semibold text-[#FFF7E9] disabled:opacity-60">{saving ? "Enregistrement…" : "Publier le transport"}</button>
        </div>
      </form>
    </section>
  )
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <label className="block"><span className={label}>{title}</span>{children}</label>
}


function TransportReservationDialog({
  veh,
  trajetSens,
  initialPeople,
  onClose,
}: {
  veh: Vehicle
  trajetSens: "aller" | "retour"
  initialPeople: number
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [confirmation, setConfirmation] = useState<{ emailSent: boolean; cancellationUrl: string; groupUrl: string; whatsappUrl: string | null; providerContact: { name: string | null; phone: string | null; email: string | null; address: string | null; members: { name: string; email: string }[] } | null } | null>(null)
  const [bookedPeople, setBookedPeople] = useState<NamedPerson[]>([])
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "+33",
    genre: "femme" as Gender,
    nbPersonnes: Math.min(Math.max(1, initialPeople), Math.max(1, trajetSens === "retour" ? (veh.places_retour_disponibles ?? veh.places) : veh.places_disponibles)),
    consentement: false,
    origin: "",
    companions: "",
    interests: [] as string[],
    luggage: "petit" as "petit" | "moyen" | "gros",
  })

  const total = form.nbPersonnes * Number(veh.participation || 0)

  useEffect(() => {
    const target = Math.max(0, form.nbPersonnes - 1)
    setBookedPeople((current) => {
      if (current.length === target) return current
      if (current.length > target) return current.slice(0, target)
      return [
        ...current,
        ...Array.from({ length: target - current.length }, () => ({
          firstName: "",
          lastName: "",
          kind: "adult" as const,
          gender: undefined,
          phone: "+33",
        })),
      ]
    })
  }, [form.nbPersonnes])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim() || !isFrenchPhone(form.telephone)) {
      toast.error("Merci de renseigner votre nom, email et téléphone.")
      return
    }
    if (
      bookedPeople.length !== form.nbPersonnes - 1 ||
      bookedPeople.some((person) =>
        !person.firstName.trim() ||
        !person.lastName.trim() ||
        !person.gender ||
        !isFrenchPhone(person.phone ?? "")
      )
    ) {
      toast.error("Pour chaque personne ajoutée, indiquez prénom, nom, sexe et téléphone.")
      return
    }
    if (!form.consentement) {
      toast.error("Le partage des coordonnées est nécessaire pour confirmer la réservation.")
      return
    }

    setSaving(true)
    try {
      const result = await reserveVehicle({
        vehicleId: veh.id,
        trajetSens,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        genre: form.genre,
        nbPersonnes: form.nbPersonnes,
        profile: {
          origin: form.origin,
          companions: bookedPeople.map(personLabel),
          companionContacts: bookedPeople.map((person) => ({
            name: `${person.firstName.trim()} ${person.lastName.trim()}`,
            gender: person.gender!,
            phone: person.phone!,
            kind: person.kind,
          })),
          interests: form.interests,
          luggage: form.luggage,
        },
        consentement: form.consentement,
      })
      if (result.emailSent) {
        toast.success("Place confirmée : le nombre de places disponibles a été mis à jour.")
      } else {
        toast.warning("Place confirmée. La notification par email n’a pas abouti.")
      }
      setConfirmation({ emailSent: result.emailSent, cancellationUrl: `/annuler?reservation=${encodeURIComponent(result.reservationId)}&code=${encodeURIComponent(result.emailToken)}`, groupUrl: `/groupe?type=vehicle&offre=${veh.id}&reservation=${encodeURIComponent(result.reservationId)}&code=${encodeURIComponent(result.emailToken)}`, whatsappUrl: result.whatsappUrl, providerContact: result.providerContact })
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : ""
      if (message.includes("not_enough_places")) toast.error("Il ne reste plus assez de places.")
      else toast.error("La réservation n’a pas pu être confirmée.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-[#FFF7E9] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D1925]/55">Réservation</p>
            <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">
              {trajetSens === "aller" ? "Aller" : "Retour"} avec {ownerDisplayName(veh)}
            </h2>
            <p className="mt-1 text-sm text-[#5B4549]">
              {(trajetSens === "retour" ? (veh.places_retour_disponibles ?? veh.places) : veh.places_disponibles)} place{(trajetSens === "retour" ? (veh.places_retour_disponibles ?? veh.places) : veh.places_disponibles) > 1 ? "s" : ""} restante{(trajetSens === "retour" ? (veh.places_retour_disponibles ?? veh.places) : veh.places_disponibles) > 1 ? "s" : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#6D1925] hover:bg-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4 text-sm text-[#5B4549]">
          {trajetSens === "aller" ? <>
            <strong>{dateLabel(veh.date_depart)}</strong>{veh.heure_depart ? " à " + veh.heure_depart : ""}
            <br />{cityWithDepartment(veh.ville_depart)}{veh.destination ? " → " + veh.destination : ""}
          </> : <>
            <strong>{dateLabel(veh.date_retour)}</strong>{veh.heure_retour ? " à " + veh.heure_retour : ""}
            <br />{veh.retour_lieu_depart || "Départ à confirmer"} → {cityWithDepartment(veh.retour_ville_arrivee)}
          </>}
        </div>

        {confirmation ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-[#6D1925]/10 bg-white/75 p-5">
            <h3 className="animate-pulse font-serif text-2xl font-semibold text-[#6D1925]">Félicitations 🎉</h3>
            <p className="rounded-xl bg-[#FFF7E9] p-4 text-sm font-semibold leading-6 text-[#6D1925]">
              Tu as bien réservé ton {trajetSens === "aller" ? "aller" : "retour"} avec {ownerDisplayName(veh)}. Maintenant, contacte directement le conducteur pour finaliser le trajet.
            </p>
            {!confirmation.emailSent && (
              <p className="text-xs text-[#6D1925]/65">La réservation est bien enregistrée ; seule la notification automatique par email n’a pas abouti.</p>
            )}
            {confirmation.providerContact && <div className="rounded-xl bg-[#FFF7E9] p-4 text-sm text-[#4B242B]">
              <p className="font-semibold">Contact : {confirmation.providerContact.name}</p>
              {confirmation.providerContact.phone && <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsappNumber(confirmation.providerContact.phone)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 font-semibold text-[#10351d]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                <a href={`tel:${confirmation.providerContact.phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#6D1925]/20 bg-white px-3 font-semibold text-[#6D1925]"><Phone className="h-4 w-4" /> Appeler</a>
                <a href={`sms:${confirmation.providerContact.phone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#6D1925]/20 bg-white px-3 font-semibold text-[#6D1925]"><MessageCircle className="h-4 w-4" /> Message</a>
              </div>}
              {confirmation.providerContact.email && <a className="mt-3 block underline" href={`mailto:${confirmation.providerContact.email}`}>{confirmation.providerContact.email}</a>}
              {confirmation.providerContact.address && <div className="mt-3"><p className="font-semibold">Lieu exact de départ :</p><a className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#6D1925]/20 bg-white px-3 font-semibold text-[#6D1925]" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(confirmation.providerContact.address)}`}>📍 Ouvrir dans Google Maps</a></div>}
              {confirmation.providerContact.members?.length > 0 && <div className="mt-3 border-t border-[#6D1925]/10 pt-3"><p className="font-semibold">Autres participants confirmés</p>{confirmation.providerContact.members.map((member, i) => <p key={`${member.email}-${i}`}>{member.name} · <a className="underline" href={`mailto:${member.email}`}>{member.email}</a></p>)}</div>}
            </div>}
            <a href={confirmation.cancellationUrl} className="text-sm font-semibold underline text-[#6D1925]">Conserver mon lien pour annuler cette place si besoin</a>
            {!confirmation.whatsappUrl && <a href={confirmation.groupUrl} className="text-sm font-semibold underline text-[#6D1925]">Voir le groupe WhatsApp ou le créer à partir de trois personnes</a>}
            {confirmation.whatsappUrl && <a href={confirmation.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-[#10351d]"><MessageCircle className="h-5 w-5" /> Rejoindre le groupe WhatsApp</a>}
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">Fermer</button>
          </div>
        ) : <form onSubmit={submit} className="mt-5 grid gap-4">
          <p className="text-sm text-[#5B4549]">Vos prénom et nom sont nécessaires pour confirmer la place. Seuls vos prénoms et centres d’intérêt seront visibles par les autres invités ; vos coordonnées restent privées.</p>
          <Field title="Ville d’où vous venez (facultatif)"><input className={field} maxLength={80} value={form.origin} onChange={(e) => setForm((s) => ({ ...s, origin: e.target.value }))} /></Field>
          {form.nbPersonnes > 1 && <NamedPeople collectContact title="Informations obligatoires pour chaque autre personne réservée" value={bookedPeople} onChange={setBookedPeople} />}
          <Field title="Taille de votre bagage"><select className={field} value={form.luggage} onChange={(e) => setForm((s) => ({ ...s, luggage: e.target.value as typeof s.luggage }))}><option value="petit">👜 Petit</option><option value="moyen">🧳 Moyen</option><option value="gros">🧳 Gros</option></select></Field>
          <InterestChoices value={form.interests} onChange={(interests) => setForm((s) => ({ ...s, interests }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field title="Prénom / nom *">
              <input className={field} value={form.nom} onChange={(e) => setForm((s) => ({ ...s, nom: e.target.value }))} />
            </Field>
            <Field title="Vous êtes *">
              <select className={field} value={form.genre} onChange={(e) => setForm((s) => ({ ...s, genre: e.target.value as Gender }))}>
                <option value="femme">👩 Femme</option>
                <option value="homme">👨 Homme</option>
              </select>
            </Field>
            <Field title="Email *">
              <input className={field} type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </Field>
            <Field title="Téléphone *">
              <FrenchPhone className={field} value={form.telephone} onChange={(value) => setForm((s) => ({ ...s, telephone: value }))} />
            </Field>
          </div>

          <Field title="Nombre de places (adultes et enfants)">
            <input
              className={field}
              type="number"
              min={1}
              max={trajetSens === "retour" ? (veh.places_retour_disponibles ?? veh.places) : veh.places_disponibles}
              value={form.nbPersonnes}
              onChange={(e) => {
                const maxPlaces = trajetSens === "retour" ? (veh.places_retour_disponibles ?? veh.places) : veh.places_disponibles
                setForm((s) => ({ ...s, nbPersonnes: Math.min(maxPlaces, Math.max(1, Number(e.target.value) || 1)) }))
              }}
            />
          </Field>

          <div className="rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-wide text-[#6D1925]/55">Participation totale</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-[#6D1925]">
              {money(total) + " €"}
            </p>
            {(
              <p className="mt-1 text-xs text-[#5B4549]">
                {form.nbPersonnes} place{form.nbPersonnes > 1 ? "s" : ""} × {money(Number(veh.participation || 0))} €
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#6D1925]/10 bg-white/60 p-3 text-xs leading-5 text-[#5B4549]">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.consentement}
              onChange={(e) => setForm((s) => ({ ...s, consentement: e.target.checked }))}
            />
            <span>
              J’accepte que mes coordonnées (nom, email et téléphone) soient transmises au conducteur. Mon prénom, ma ville et mes goûts seront visibles sur la fiche. Les autres participants confirmés pourront voir mon email. Je recevrai les coordonnées du contact après confirmation.
            </span>
          </label>

          <button
            disabled={saving}
            className="min-h-12 rounded-xl bg-[#6D1925] px-5 text-sm font-semibold text-[#FFF7E9] disabled:opacity-60"
          >
            {saving ? "Confirmation…" : "Confirmer la réservation"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-[#6D1925]/20 bg-white px-5 text-sm font-semibold text-[#6D1925]"
          >
            Annuler
          </button>
        </form>}
      </div>
    </div>
  )
}
