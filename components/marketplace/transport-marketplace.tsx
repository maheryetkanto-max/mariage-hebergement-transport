"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Car, Clock3, ExternalLink, MapPin, MessageCircle, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"
import { reserveVehicle, saveVehicle, useVehicles, useOfferPeople } from "@/lib/data"
import { OUTBOUND_DATES, RETURN_DATES, type Gender, type TransportType, type Vehicle } from "@/lib/types"
import { NamedPeople, personLabel, type NamedPerson } from "@/components/marketplace/named-people"
import { AddressPicker } from "@/components/marketplace/address-picker"
import { FrenchPhone, isFrenchPhone } from "@/components/marketplace/french-phone"
import { InterestChoices, PeopleList } from "@/components/marketplace/people-and-interests"
import { CityPicker, isListedCity, normalizeCity } from "@/components/marketplace/city-picker"

const adultChoices = [1, 2, 3, 4, 5, 6, 7]
const CHURCH = "Église protestante Unie de Troyes"
const VENUE = "Clos Belair"

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

export function TransportMarketplace() {
  const { data: vehicles = [], isLoading } = useVehicles()
  const { data: offerPeople = [] } = useOfferPeople()
  const [showForm, setShowForm] = useState(false)
  const [manageUrl, setManageUrl] = useState("")
  const [offerSource, setOfferSource] = useState<"invite" | "admin">("invite")
  const [type, setType] = useState<"" | "church" | "venue" | "navette">("")
  const [date, setDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [city, setCity] = useState("")
  const [arrivalCity, setArrivalCity] = useState("")
  const [people, setPeople] = useState(1)
  const [gender, setGender] = useState<"" | Gender>("")
  const [freeOnly, setFreeOnly] = useState(false)
  const [petsOnly, setPetsOnly] = useState(false)
  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null)

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
    const q = normalizeCity(city)
    const returnQuery = normalizeCity(arrivalCity)
    return vehicles
      .filter((v) => v.actif !== false)
      .filter((v) => (v.places_disponibles ?? v.places) >= people)
      .filter((v) => !type || (type === "navette" ? v.type_trajet === "navette" : type === "church" ? normalizeCity(v.destination ?? "").includes("eglise") : normalizeCity(v.destination ?? "").includes("salle") || normalizeCity(v.destination ?? "").includes("clos belair")))
      .filter((v) => !date || v.date_depart === date)
      .filter((v) => !returnDate || v.date_retour === returnDate)
      .filter((v) => !gender || v.genre_conducteur === gender)
      .filter((v) => !freeOnly || v.gratuit)
      .filter((v) => !petsOnly || v.animaux_acceptes)
      .filter((v) => !q || normalizeCity((v.ville_depart ?? "") + " " + (v.lieu_depart ?? "")).includes(q))
      .filter((v) => !returnQuery || normalizeCity(v.retour_ville_arrivee ?? "").includes(returnQuery))
  }, [vehicles, type, date, returnDate, city, arrivalCity, people, gender, freeOnly, petsOnly])

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
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#6D1925]"><Search className="h-4 w-4" /> Trouver une place</div>
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <span className={label}>Destination de l’aller</span>
            <select className={field} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="">Tous</option>
              <option value="church">Île-de-France → Église</option>
              <option value="venue">Île-de-France → Clos Belair</option>
              <option value="navette">Navette locale</option>
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
            <span className={label}>Retour</span>
            <select className={field} value={returnDate} onChange={(e) => setReturnDate(e.target.value)}>
              <option value="">Peu importe</option>
              {RETURN_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Ville de départ (Île-de-France)</span>
            <CityPicker className={field} label="Chercher une ville de départ" area="idf" placeholder="Tapez une ville…" value={city} onChange={setCity} />
          </div>
          <div>
            <span className={label}>Places nécessaires (adultes et enfants)</span>
            <select className={field} value={people} onChange={(e) => setPeople(Number(e.target.value))}>
              {adultChoices.map((count) => <option key={count} value={count}>{count} personne{count > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>
        {returnDate && <div className="mt-3 max-w-sm"><span className={label}>Ville de dépose au retour (Île-de-France)</span><CityPicker className={field} label="Chercher la ville de dépose au retour" area="idf" placeholder="Tapez une ville…" value={arrivalCity} onChange={setArrivalCity} /></div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <select className="rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs" value={gender} onChange={(e) => setGender(e.target.value as "" | Gender)}>
            <option value="">👤 Propriétaire : peu importe</option>
            <option value="femme">👩 Femme</option>
            <option value="homme">👨 Homme</option>
            <option value="homme_et_femme">👫 Homme et femme</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> Gratuit uniquement
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs">
            <input type="checkbox" checked={petsOnly} onChange={(e) => setPetsOnly(e.target.checked)} /> 🐶 Animaux acceptés
          </label>
        </div>
      </section>

      {manageUrl && <div className="rounded-xl border border-[#6D1925]/15 bg-white p-4 text-sm"><strong>Votre lien personnel :</strong> <a className="underline text-[#6D1925]" href={manageUrl}>Créer ou suivre le groupe WhatsApp de votre fiche</a>. Conservez ce lien.</div>}

      {showForm && <TransportForm onClose={() => setShowForm(false)} onPublished={(url) => { setManageUrl(url); window.localStorage.setItem("last-offer-group-link", url); setShowForm(false); setType(""); setDate(""); setReturnDate(""); setCity(""); setArrivalCity(""); setPeople(1); setGender(""); setFreeOnly(false); setPetsOnly(false); window.setTimeout(() => document.getElementById("transport-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30) }} source={offerSource} />}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des transports…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#6D1925]/20 bg-white/45 px-5 py-12 text-center">
          <Car className="mx-auto mb-3 h-9 w-9 text-[#6D1925]/35" />
          <p className="font-medium text-[#4B242B]">Aucun transport ne correspond à ces critères.</p>
          <p className="mt-1 text-sm text-[#6D1925]/55">Essayez une autre date, ville ou zone.</p>
          <button type="button" onClick={() => { setType(""); setDate(""); setReturnDate(""); setCity(""); setArrivalCity(""); setPeople(1); setGender(""); setFreeOnly(false); setPetsOnly(false) }} className="mt-4 min-h-11 rounded-xl border border-[#6D1925]/25 bg-white px-4 text-sm font-semibold text-[#6D1925]">Afficher tous les transports</button>
        </div>
      ) : (
        <div id="transport-offers" className="grid scroll-mt-20 gap-4 lg:grid-cols-2">
          {filtered.map((veh) => {
            const places = veh.places_disponibles ?? veh.places
            const mapHref = veh.ville_depart ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(veh.ville_depart) : undefined
            return (
              <article key={veh.id} className="overflow-hidden rounded-2xl border border-[#6D1925]/10 bg-white shadow-[0_8px_30px_rgba(109,25,37,0.06)]">
                <div className="border-b border-[#6D1925]/8 bg-[#FFF7E9]/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">{genderEmoji(veh.genre_conducteur)} {veh.conducteur}</h2>
                        <span className="rounded-full border border-[#6D1925]/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6D1925]/70">{veh.type_trajet === "navette" ? "🚉 Navette locale" : "🚗 Covoiturage"}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#5B4549]">
                        {veh.gratuit ? <strong className="text-emerald-700">Gratuit</strong> : <strong>{Number(veh.participation || 0).toFixed(0)} € / personne</strong>}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-[#6D1925] px-3 py-2 text-center text-[#FFF7E9]">
                      <div className="text-xl font-bold">{places}</div>
                      <div className="text-[10px] uppercase tracking-wide">place{places > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Info icon={<CalendarDays className="h-4 w-4" />} text={dateLabel(veh.date_depart)} />
                    <Info icon={<Clock3 className="h-4 w-4" />} text={veh.heure_depart ? "Départ " + veh.heure_depart : "Heure à confirmer"} />
                  </div>

                  {veh.ville_depart && (
                    <a href={mapHref} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-xl bg-[#FFF7E9]/60 p-3 text-sm text-[#5B4549] transition hover:bg-[#FFF7E9]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6D1925]" />
                      <span className="min-w-0 flex-1">
                        <strong>{veh.ville_depart || "Départ"}</strong>
                        {veh.destination && <><br /><span className="text-xs">→ {veh.destination}</span></>}
                      </span>
                      {veh.ville_depart && <ExternalLink className="h-4 w-4 shrink-0" />}
                    </a>
                  )}

                  {veh.date_retour && (
                    <div className="rounded-xl bg-[#6D1925]/[0.035] px-3 py-2.5 text-sm text-[#5B4549]">
                      Retour : <strong>{dateLabel(veh.date_retour)}</strong>{veh.heure_retour ? " à " + veh.heure_retour : ""}
                      {(veh.retour_lieu_depart || veh.retour_ville_arrivee) && <p className="mt-1">{veh.retour_lieu_depart || VENUE} → {veh.retour_ville_arrivee || "Île-de-France"}</p>}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Sticker>{genderEmoji(veh.genre_conducteur)} {veh.genre_conducteur === "femme" ? "Conductrice" : veh.genre_conducteur === "homme_et_femme" ? "Propriétaires" : "Conducteur"}</Sticker>
                    <Sticker>{veh.animaux_acceptes ? "🐶 Animaux OK" : "🚫🐶 Sans animaux"}</Sticker>
                    <Sticker>{veh.gratuit ? "🎁 Gratuit" : "💶 " + Number(veh.participation || 0).toFixed(0) + " € / pers."}</Sticker>
                  </div>

                  <p className="border-t border-[#6D1925]/8 pt-4 text-xs text-[#6D1925]/65">Les coordonnées du conducteur s’affichent après confirmation de votre place.</p>

                  <button
                    type="button"
                    disabled={places < 1 || !veh.reservation_active}
                    onClick={() => setBookingVehicle(veh)}
                    className="min-h-11 w-full rounded-xl bg-[#6D1925] px-4 text-sm font-semibold text-[#FFF7E9] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {places < 1
                      ? "Complet"
                      : !veh.reservation_active
                        ? "Coordonnées indisponibles"
                        : "Confirmer ma place"}
                  </button>

                  <details className="rounded-xl border border-[#6D1925]/10 bg-[#FFF7E9]/50 p-3"><summary className="cursor-pointer font-semibold text-[#6D1925]">Voir les personnes et les détails</summary><div className="mt-3"><PeopleList people={offerPeople.find((group) => group.type === "vehicle" && group.id === veh.id)?.people ?? [{ name: veh.conducteur.split(" ")[0], origin: veh.ville_depart, interests: veh.centres_interet ?? [] }]} /><p className="mt-3 text-xs text-[#6D1925]/65">Téléphone, email et adresse précise disponibles après confirmation de la place.</p></div></details>
                  {veh.commentaires && <p className="rounded-xl bg-[#6D1925]/[0.035] p-3 text-xs leading-5 text-[#5B4549]">{veh.commentaires}</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-[#6D1925]/45">{filtered.length} transport{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>

      {bookingVehicle && (
        <TransportReservationDialog
          veh={bookingVehicle}
          initialPeople={people}
          onClose={() => setBookingVehicle(null)}
        />
      )}
    </div>
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
    gratuit: true,
    participation: 0,
    animaux_acceptes: false,
    commentaires: "",
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
    if (!isListedCity(form.ville_depart, "idf") || (form.date_retour && !isListedCity(form.retour_ville_arrivee, "idf"))) {
      toast.error("Choisissez une ville d’Île-de-France dans la liste pour l’aller et le retour.")
      return
    }
    if (form.date_retour && returnFromAccommodation && !isListedCity(form.retour_lieu_depart, "aube")) {
      toast.error("Choisissez la ville de l’hébergement dans l’Aube pour le retour.")
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
    setSaving(true)
    try {
      const groupToken = crypto.randomUUID()
      const offerId = await saveVehicle({ ...form, compagnons_prenoms: occupants.map(personLabel).join(", "), group_manage_token: groupToken, retour_lieu_depart: form.date_retour ? form.retour_lieu_depart : "", retour_ville_arrivee: form.date_retour ? form.retour_ville_arrivee : "", places: form.places_disponibles, source, actif: true })
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
              <option value="homme_et_femme">👫 Homme et femme</option>
            </select>
          </Field>
          <Field title="Téléphone français *"><FrenchPhone className={field} value={form.telephone} onChange={(value) => set("telephone", value)} /></Field>
          <Field title="Email *"><input className={field} type="email" value={form.email_conducteur} onChange={(e) => set("email_conducteur", e.target.value)} /></Field>
        </div>

        <NamedPeople title="Adultes et enfants qui voyagent déjà avec vous (prénom et nom)" value={occupants} onChange={setOccupants} />
        <InterestChoices value={form.centres_interet} onChange={(values) => set("centres_interet", values)} />
        <p className="text-sm font-medium text-[#6D1925]">🚗 Trajet d’Île-de-France vers le mariage</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div><span className={label}>Ville de départ (Île-de-France) *</span><CityPicker className={field} label="Ville de départ" area="idf" placeholder="Tapez une ville…" value={form.ville_depart} onChange={(value) => set("ville_depart", value)} /></div>
          <Field title="Lieu de départ précis *"><AddressPicker className={field} label="Lieu de prise en charge précis" city={form.ville_depart} value={form.lieu_depart} onChange={(value) => set("lieu_depart", value)} /></Field>
        </div>

        <Field title="Lieu de dépose à l’aller *"><select className={field} value={form.destination} onChange={(e) => set("destination", e.target.value)}><option value={CHURCH}>{CHURCH}</option><option value={VENUE}>{VENUE} (salle de réception)</option></select></Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field title="Départ *">
            <select className={field} value={form.date_depart} onChange={(e) => set("date_depart", e.target.value)}>
              {OUTBOUND_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Heure de départ *"><select className={field} value={form.heure_depart} onChange={(e) => set("heure_depart", e.target.value)}><option value="">Choisir une heure</option>{Array.from({ length: 96 }, (_, index) => { const value = `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`; return <option key={value} value={value}>{value}</option> })}</select></Field>
          <Field title="Places disponibles (adultes et enfants) *"><select className={field} value={form.places_disponibles} onChange={(e) => set("places_disponibles", Number(e.target.value))}>{adultChoices.map((count) => <option key={count} value={count}>{count} place{count > 1 ? "s" : ""}</option>)}</select></Field>
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

        {form.date_retour && <div className="grid gap-4 sm:grid-cols-2"><div><Field title="Départ du retour *"><select className={field} value={returnFromAccommodation ? "hebergement" : "salle"} onChange={(e) => { const fromAccommodation = e.target.value === "hebergement"; setReturnFromAccommodation(fromAccommodation); set("retour_lieu_depart", fromAccommodation ? "" : VENUE) }}><option value="salle">{VENUE} (salle)</option><option value="hebergement">Ville de l’hébergement</option></select></Field>{returnFromAccommodation && <div className="mt-3"><span className={label}>Ville de l’hébergement (Aube) *</span><CityPicker className={field} label="Ville de l’hébergement au retour" area="aube" placeholder="Tapez une ville…" value={form.retour_lieu_depart} onChange={(value) => set("retour_lieu_depart", value)} /></div>}</div><div><span className={label}>Ville de dépose au retour (Île-de-France) *</span><CityPicker className={field} label="Ville de dépose au retour" area="idf" placeholder="Tapez une ville…" value={form.retour_ville_arrivee} onChange={(value) => set("retour_ville_arrivee", value)} /></div></div>}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-white/60 px-4 py-3 text-sm"><span>Transport gratuit 🎁</span><input type="checkbox" checked={form.gratuit} onChange={(e) => set("gratuit", e.target.checked)} /></label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-white/60 px-4 py-3 text-sm"><span>Animaux acceptés 🐶</span><input type="checkbox" checked={form.animaux_acceptes} onChange={(e) => set("animaux_acceptes", e.target.checked)} /></label>
        </div>

        {!form.gratuit && <Field title="Participation demandée par personne (€)"><input className={field} type="number" min={0} step="0.01" value={form.participation} onChange={(e) => set("participation", Math.max(0, Number(e.target.value) || 0))} /></Field>}

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
  initialPeople,
  onClose,
}: {
  veh: Vehicle
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
    nbPersonnes: Math.min(Math.max(1, initialPeople), Math.max(1, veh.places_disponibles)),
    consentement: false,
    origin: "",
    companions: "",
    interests: [] as string[],
    luggage: "petit" as "petit" | "moyen" | "gros",
  })

  const total = veh.gratuit
    ? 0
    : form.nbPersonnes * Number(veh.participation || 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim() || !isFrenchPhone(form.telephone)) {
      toast.error("Merci de renseigner votre nom, email et téléphone.")
      return
    }
    if (bookedPeople.length !== form.nbPersonnes - 1 || bookedPeople.some((person) => !person.firstName.trim() || !person.lastName.trim())) {
      toast.error("Indiquez le prénom de chaque adulte pour lequel vous confirmez une place.")
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
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        genre: form.genre,
        nbPersonnes: form.nbPersonnes,
        profile: { origin: form.origin, companions: bookedPeople.map(personLabel), interests: form.interests, luggage: form.luggage },
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
              {veh.type_trajet === "navette" ? "Navette" : "Covoiturage"} avec {veh.conducteur}
            </h2>
            <p className="mt-1 text-sm text-[#5B4549]">
              {veh.places_disponibles} place{veh.places_disponibles > 1 ? "s" : ""} restante{veh.places_disponibles > 1 ? "s" : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#6D1925] hover:bg-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4 text-sm text-[#5B4549]">
          <strong>{dateLabel(veh.date_depart)}</strong>
          {veh.heure_depart ? " à " + veh.heure_depart : ""}
          <br />
          {veh.ville_depart || veh.lieu_depart || "Départ à confirmer"}
          {veh.destination ? " → " + veh.destination : ""}
          {veh.date_retour ? <><br />Retour : {dateLabel(veh.date_retour)}{veh.heure_retour ? " à " + veh.heure_retour : ""}</> : null}
        </div>

        {confirmation ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-[#6D1925]/10 bg-white/75 p-5">
            <h3 className="font-serif text-2xl font-semibold text-[#6D1925]">Réservation confirmée</h3>
            <p className="text-sm text-[#5B4549]">{confirmation.emailSent ? "Votre place est décomptée. Vous pouvez contacter la personne ci-dessous." : "Votre place est décomptée. Vous pouvez contacter la personne ci-dessous ; la notification par email a échoué."}</p>
            {confirmation.providerContact && <div className="rounded-xl bg-[#FFF7E9] p-4 text-sm text-[#4B242B]"><p className="font-semibold">Contact : {confirmation.providerContact.name}</p>{confirmation.providerContact.phone && <a className="block underline" href={`tel:${confirmation.providerContact.phone}`}>{confirmation.providerContact.phone}</a>}{confirmation.providerContact.email && <a className="block underline" href={`mailto:${confirmation.providerContact.email}`}>{confirmation.providerContact.email}</a>}{confirmation.providerContact.address && <a className="block underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(confirmation.providerContact.address)}`}>📍 Voir le lieu de prise en charge sur Google Maps : {confirmation.providerContact.address}</a>}{confirmation.providerContact.members?.length > 0 && <div className="mt-3 border-t border-[#6D1925]/10 pt-3"><p className="font-semibold">Autres participants confirmés</p>{confirmation.providerContact.members.map((member, i) => <p key={`${member.email}-${i}`}>{member.name} · <a className="underline" href={`mailto:${member.email}`}>{member.email}</a></p>)}</div>}</div>}
            <a href={confirmation.cancellationUrl} className="text-sm font-semibold underline text-[#6D1925]">Conserver mon lien pour annuler cette place si besoin</a>
            {!confirmation.whatsappUrl && <a href={confirmation.groupUrl} className="text-sm font-semibold underline text-[#6D1925]">Voir le groupe WhatsApp ou le créer à partir de trois personnes</a>}
            {confirmation.whatsappUrl && <a href={confirmation.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-[#10351d]"><MessageCircle className="h-5 w-5" /> Rejoindre le groupe WhatsApp</a>}
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">Fermer</button>
          </div>
        ) : <form onSubmit={submit} className="mt-5 grid gap-4">
          <p className="text-sm text-[#5B4549]">Vos prénom et nom sont nécessaires pour confirmer la place. Seuls vos prénoms et centres d’intérêt seront visibles par les autres invités ; vos coordonnées restent privées.</p>
          <Field title="Ville d’où vous venez (facultatif)"><input className={field} maxLength={80} value={form.origin} onChange={(e) => setForm((s) => ({ ...s, origin: e.target.value }))} /></Field>
          <NamedPeople title="Chaque autre adulte ou enfant qui prend une place avec vous (prénom et nom)" value={bookedPeople} onChange={setBookedPeople} />
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
              max={veh.places_disponibles}
              value={form.nbPersonnes}
              onChange={(e) => setForm((s) => ({ ...s, nbPersonnes: Math.min(veh.places_disponibles, Math.max(1, Number(e.target.value) || 1)) }))}
            />
          </Field>

          <div className="rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-wide text-[#6D1925]/55">Participation totale</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-[#6D1925]">
              {total === 0 ? "Gratuit" : total.toFixed(0) + " €"}
            </p>
            {!veh.gratuit && (
              <p className="mt-1 text-xs text-[#5B4549]">
                {form.nbPersonnes} place{form.nbPersonnes > 1 ? "s" : ""} × {Number(veh.participation || 0).toFixed(0)} €
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
        </form>}
      </div>
    </div>
  )
}
