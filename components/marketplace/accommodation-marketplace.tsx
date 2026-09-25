"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Baby,
  BedDouble,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { reserveAccommodation, saveAccommodation, useAccommodations } from "@/lib/data"
import { CityPicker, isListedCity, normalizeCity } from "@/components/marketplace/city-picker"

const adultChoices = [1, 2, 3, 4, 5, 6, 7]
import {
  ACCOMMODATION_TYPES,
  OUTBOUND_DATES,
  RETURN_DATES,
  type Accommodation,
  type AccommodationType,
  type Gender,
} from "@/lib/types"

const field =
  "w-full rounded-xl border border-[#6D1925]/15 bg-white/75 px-3 py-2.5 text-sm text-[#34171C] outline-none transition focus:border-[#6D1925]/45 focus:ring-2 focus:ring-[#6D1925]/10"
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#6D1925]/70"

function dateLabel(value: string | null) {
  if (!value) return "—"
  const found = [...OUTBOUND_DATES, ...RETURN_DATES].find((d) => d.value === value)
  return found?.label ?? value
}

function nightsBetween(start: string, end: string) {
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = end.split("-").map(Number)
  const diff =
    (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.round(diff))
}

function genderEmoji(gender: Gender | null) {
  return gender === "femme" ? "👩" : gender === "homme" ? "👨" : "🙂"
}

export function AccommodationMarketplace() {
  const { data: accommodations = [], isLoading } = useAccommodations()
  const [showForm, setShowForm] = useState(false)
  const [offerSource, setOfferSource] = useState<"invite" | "admin">("invite")
  const [arrival, setArrival] = useState("")
  const [departure, setDeparture] = useState("")
  const [people, setPeople] = useState(1)
  const [city, setCity] = useState("")
  const [childrenOnly, setChildrenOnly] = useState(false)
  const [petsOnly, setPetsOnly] = useState(false)
  const [bookingAcc, setBookingAcc] = useState<Accommodation | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("action") === "add") setShowForm(true)
    if (params.get("source") === "admin") setOfferSource("admin")
  }, [])

  useEffect(() => {
    if (showForm) document.getElementById("proposer")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [showForm])

  const filtered = useMemo(
    () =>
      accommodations
        .filter((a) => a.actif !== false)
        .filter((a) => (a.places_disponibles ?? a.capacite) >= people)
        .filter((a) => !city || normalizeCity((a.ville_logement ?? "") + " " + (a.adresse ?? "")).includes(normalizeCity(city)))
        .filter((a) => !childrenOnly || a.enfants_acceptes)
        .filter((a) => !petsOnly || a.animaux_acceptes)
        .filter((a) => !arrival || !a.date_entree || a.date_entree <= arrival)
        .filter((a) => !departure || !a.date_sortie || a.date_sortie >= departure),
    [accommodations, arrival, departure, people, city, childrenOnly, petsOnly],
  )

  const selectedNights =
    arrival && departure && departure > arrival ? nightsBetween(arrival, departure) : 0

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#6D1925]/10 bg-[#FFF9F0] p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6D1925]/55">
              Mariage M & K
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-[#6D1925] sm:text-4xl">
              Hébergements disponibles
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5B4549]">
              Consultez les logements proposés par les invités et contactez directement la personne
              qui a réservé le bien.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6D1925] px-4 py-2.5 text-sm font-semibold text-[#FFF7E9] shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Proposer un logement
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#6D1925]/10 bg-white/65 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#6D1925]">
          <Search className="h-4 w-4" />
          Trouver ce qui me convient
        </div>
        <div className="grid gap-3 md:grid-cols-6">
          <div>
            <span className={label}>Arrivée</span>
            <select className={field} value={arrival} onChange={(e) => setArrival(e.target.value)}>
              <option value="">Peu importe</option>
              {OUTBOUND_DATES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>Départ</span>
            <select className={field} value={departure} onChange={(e) => setDeparture(e.target.value)}>
              <option value="">Peu importe</option>
              {RETURN_DATES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>Ville du logement</span>
            <CityPicker className={field} label="Chercher la ville du logement" area="idf-aube" placeholder="Troyes, Massy…" value={city} onChange={setCity} />
          </div>
          <div>
            <span className={label}>Places adultes nécessaires</span>
            <select className={field} value={people} onChange={(e) => setPeople(Number(e.target.value))}>
              {adultChoices.map((count) => <option key={count} value={count}>{count} adulte{count > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#6D1925]/10 bg-[#FFF7E9]/60 px-3 py-2.5 text-sm">
            <input type="checkbox" checked={childrenOnly} onChange={(e) => setChildrenOnly(e.target.checked)} />
            <span>👶 Enfants acceptés</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#6D1925]/10 bg-[#FFF7E9]/60 px-3 py-2.5 text-sm">
            <input type="checkbox" checked={petsOnly} onChange={(e) => setPetsOnly(e.target.checked)} />
            <span>🐶 Animaux acceptés</span>
          </label>
        </div>
      </section>

      {showForm && <AccommodationForm onClose={() => setShowForm(false)} onPublished={() => { setShowForm(false); setArrival(""); setDeparture(""); setCity(""); setPeople(1); setChildrenOnly(false); setPetsOnly(false); window.setTimeout(() => document.getElementById("accommodation-offers")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30) }} source={offerSource} />}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des logements…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#6D1925]/20 bg-white/45 px-5 py-12 text-center">
          <BedDouble className="mx-auto mb-3 h-9 w-9 text-[#6D1925]/35" />
          <p className="font-medium text-[#4B242B]">Aucun logement ne correspond à ces critères.</p>
          <p className="mt-1 text-sm text-[#6D1925]/55">Essayez d’élargir vos filtres.</p>
          <button type="button" onClick={() => { setArrival(""); setDeparture(""); setCity(""); setPeople(1); setChildrenOnly(false); setPetsOnly(false) }} className="mt-4 min-h-11 rounded-xl border border-[#6D1925]/25 bg-white px-4 text-sm font-semibold text-[#6D1925]">Afficher tous les logements</button>
        </div>
      ) : (
        <div id="accommodation-offers" className="grid scroll-mt-20 gap-4 lg:grid-cols-2">
          {filtered.map((acc) => {
            const places = acc.places_disponibles ?? acc.capacite
            const total = selectedNights > 0 ? selectedNights * Number(acc.prix_personne_nuit || 0) : null
            return (
              <article
                key={acc.id}
                className="overflow-hidden rounded-2xl border border-[#6D1925]/10 bg-white shadow-[0_8px_30px_rgba(109,25,37,0.06)]"
              >
                <div className="border-b border-[#6D1925]/8 bg-[#FFF7E9]/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">{acc.nom}</h2>
                        <span className="rounded-full border border-[#6D1925]/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6D1925]/70">
                          {acc.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#5B4549]">
                        Proposé par <strong>{genderEmoji(acc.genre_proposant)} {acc.propose_par || acc.contact || "Un invité"}</strong>
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
                    <Info icon={<CalendarDays className="h-4 w-4" />} text={`${dateLabel(acc.date_entree)} → ${dateLabel(acc.date_sortie)}`} />
                    <Info icon={<Clock3 className="h-4 w-4" />} text={acc.minutes_salle != null ? `${acc.minutes_salle} min de la salle` : "Distance non précisée"} />
                  </div>

                  {acc.ville_logement && <p className="text-sm font-semibold text-[#6D1925]">📍 {acc.ville_logement}</p>}


                  <div className="flex flex-wrap gap-2">
                    <Sticker>{acc.enfants_acceptes ? "👶 Enfants OK" : "🚫👶 Sans enfants"}</Sticker>
                    <Sticker>{acc.animaux_acceptes ? "🐶 Animaux OK" : "🚫🐶 Sans animaux"}</Sticker>
                    <Sticker>{genderEmoji(acc.genre_proposant)} {acc.genre_proposant === "femme" ? "Proposée par une femme" : acc.genre_proposant === "homme" ? "Proposé par un homme" : "Hôte"}</Sticker>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-[#6D1925]/8 pt-4">
                    <div>
                      <p className="text-xs text-[#6D1925]/55">Prix par personne / nuit</p>
                      <p className="font-serif text-2xl font-semibold text-[#6D1925]">
                        {Number(acc.prix_personne_nuit || 0) === 0
                          ? "Gratuit"
                          : Number(acc.prix_personne_nuit || 0).toFixed(0) + " €"}
                      </p>
                      {total != null && (
                        <p className="text-xs font-semibold text-[#6D1925]">
                          Pour votre séjour : {total.toFixed(0)} € / personne
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={places < 1 || !acc.reservation_active}
                    onClick={() => setBookingAcc(acc)}
                    className="min-h-11 w-full rounded-xl bg-[#6D1925] px-4 text-sm font-semibold text-[#FFF7E9] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {places < 1
                      ? "Complet"
                      : !acc.reservation_active
                        ? "Coordonnées indisponibles"
                        : "Confirmer ma place"}
                  </button>

                  {acc.commentaires && (
                    <p className="rounded-xl bg-[#6D1925]/[0.035] p-3 text-xs leading-5 text-[#5B4549]">
                      {acc.commentaires}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-[#6D1925]/45">
        {filtered.length} logement{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
      </p>

      {bookingAcc && (
        <AccommodationReservationDialog
          acc={bookingAcc}
          initialArrival={arrival || bookingAcc.date_entree || "2026-12-30"}
          initialDeparture={departure || bookingAcc.date_sortie || "2027-01-01"}
          initialPeople={people}
          onClose={() => setBookingAcc(null)}
        />
      )}
    </div>
  )
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#6D1925]/[0.035] px-3 py-2.5 text-[#5B4549]">
      <span className="text-[#6D1925]">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function Sticker({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-2.5 py-1 text-xs font-medium text-[#5B3037]">
      {children}
    </span>
  )
}

function AccommodationForm({
  onClose,
  onPublished,
  source,
}: {
  onClose: () => void
  onPublished: () => void
  source: "invite" | "admin"
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    propose_par: "",
    genre_proposant: "femme" as Gender,
    telephone_proposant: "",
    email_proposant: "",
    whatsapp_group_url: "",
    nom: "",
    type: "Airbnb" as AccommodationType,
    adresse: "",
    ville_logement: "",
    places_disponibles: 1,
    minutes_salle: 10,
    date_entree: "2026-12-30",
    date_sortie: "2027-01-01",
    prix_personne_nuit: 0,
    enfants_acceptes: true,
    animaux_acceptes: false,
    commentaires: "",
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.propose_par.trim() || !form.telephone_proposant.trim() || !form.email_proposant.trim() || !form.nom.trim() || !form.adresse.trim()) {
      toast.error("Merci de compléter le nom, le téléphone, l’email, le logement et l’adresse.")
      return
    }
    if (!isListedCity(form.ville_logement, "idf-aube")) {
      toast.error("Choisissez la ville du logement dans la liste (Aube ou Île-de-France).")
      return
    }
    if (form.date_sortie <= form.date_entree) {
      toast.error("La date de sortie doit être après la date d’entrée.")
      return
    }
    if (form.whatsapp_group_url && !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(form.whatsapp_group_url.trim())) {
      toast.error("Collez le lien d’invitation du groupe WhatsApp (chat.whatsapp.com/…).")
      return
    }
    setSaving(true)
    try {
      await saveAccommodation({
        ...form,
        whatsapp_group_url: form.whatsapp_group_url.trim(),
        capacite: form.places_disponibles,
        contact: form.propose_par,
        source,
        actif: true,
      })
      toast.success("Votre logement a bien été ajouté.")
      onPublished()
    } catch (error) {
      console.error(error)
      toast.error("Impossible d’ajouter le logement pour le moment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="proposer" className="scroll-mt-20 rounded-3xl border border-[#6D1925]/15 bg-[#FFF7E9] p-5 shadow-lg sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D1925]/55">Partager une place</p>
          <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Proposer un hébergement</h2>
          <p className="mt-1 text-sm text-[#5B4549]">Une seule fiche, avec toutes les informations utiles aux autres invités.</p>
        </div>
        <button onClick={onClose} aria-label="Fermer" className="rounded-full p-2 text-[#6D1925] hover:bg-white/70">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field title="Votre prénom / nom *">
            <input className={field} value={form.propose_par} onChange={(e) => set("propose_par", e.target.value)} />
          </Field>
          <Field title="Vous êtes *">
            <select className={field} value={form.genre_proposant} onChange={(e) => set("genre_proposant", e.target.value as Gender)}>
              <option value="femme">👩 Femme</option>
              <option value="homme">👨 Homme</option>
            </select>
          </Field>
          <Field title="Téléphone *">
            <input className={field} type="tel" value={form.telephone_proposant} onChange={(e) => set("telephone_proposant", e.target.value)} />
          </Field>
          <Field title="Email *">
            <input className={field} type="email" value={form.email_proposant} onChange={(e) => set("email_proposant", e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Nom du logement *">
            <input className={field} placeholder="Ex. Maison de Michel" value={form.nom} onChange={(e) => set("nom", e.target.value)} />
          </Field>
          <Field title="Type">
            <select className={field} value={form.type} onChange={(e) => set("type", e.target.value as AccommodationType)}>
              {ACCOMMODATION_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
        </div>

        <Field title="Adresse exacte *">
          <input className={field} placeholder="Rue, ville, code postal" value={form.adresse} onChange={(e) => set("adresse", e.target.value)} />
        </Field>

        <div><span className={label}>Ville du logement (Aube ou Île-de-France) *</span><CityPicker className={field} label="Ville du logement" area="idf-aube" placeholder="Tapez une ville…" value={form.ville_logement} onChange={(value) => set("ville_logement", value)} /></div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field title="Places adultes disponibles *">
            <input className={field} type="number" min={1} value={form.places_disponibles} onChange={(e) => set("places_disponibles", Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field title="Minutes de la salle">
            <input className={field} type="number" min={0} value={form.minutes_salle} onChange={(e) => set("minutes_salle", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field title="Prix / pers. / nuit (€) · 0 = gratuit">
            <input className={field} type="number" min={0} step="0.01" value={form.prix_personne_nuit} onChange={(e) => set("prix_personne_nuit", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Disponible à partir du">
            <select className={field} value={form.date_entree} onChange={(e) => set("date_entree", e.target.value)}>
              {OUTBOUND_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Disponible jusqu’au">
            <select className={field} value={form.date_sortie} onChange={(e) => set("date_sortie", e.target.value)}>
              {RETURN_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-white/60 px-4 py-3 text-sm">
            <span className="flex items-center gap-2"><Baby className="h-4 w-4 text-[#6D1925]" /> Enfants acceptés 👶</span>
            <input type="checkbox" checked={form.enfants_acceptes} onChange={(e) => set("enfants_acceptes", e.target.checked)} />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-white/60 px-4 py-3 text-sm">
            <span>Animaux acceptés 🐶</span>
            <input type="checkbox" checked={form.animaux_acceptes} onChange={(e) => set("animaux_acceptes", e.target.checked)} />
          </label>
        </div>

        <Field title="Informations complémentaires">
          <textarea className={field} rows={3} placeholder="Ex. pas de chat, linge fourni, chambre à l’étage…" value={form.commentaires} onChange={(e) => set("commentaires", e.target.value)} />
        </Field>

        <div className="rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#6D1925]"><MessageCircle className="h-4 w-4" /> Groupe WhatsApp (facultatif)</p>
          <p className="mt-1 text-xs leading-5 text-[#5B4549]">Créez votre groupe dans WhatsApp, puis copiez son lien d’invitation. Il sera transmis uniquement aux personnes ayant confirmé une réservation.</p>
          <a href="https://faq.whatsapp.com/3242937609289432/" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#6D1925] underline">Comment copier le lien du groupe ↗</a>
          <input className={`${field} mt-3`} type="url" inputMode="url" placeholder="https://chat.whatsapp.com/…" aria-label="Lien d’invitation au groupe WhatsApp" value={form.whatsapp_group_url} onChange={(e) => set("whatsapp_group_url", e.target.value)} />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">
            Annuler
          </button>
          <button disabled={saving} type="submit" className="min-h-11 rounded-xl bg-[#6D1925] px-5 text-sm font-semibold text-[#FFF7E9] disabled:opacity-60">
            {saving ? "Enregistrement…" : "Publier le logement"}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      {children}
    </label>
  )
}


function AccommodationReservationDialog({
  acc,
  initialArrival,
  initialDeparture,
  initialPeople,
  onClose,
}: {
  acc: Accommodation
  initialArrival: string
  initialDeparture: string
  initialPeople: number
  onClose: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [confirmation, setConfirmation] = useState<{ emailSent: boolean; cancellationUrl: string; whatsappUrl: string | null; providerContact: { name: string | null; phone: string | null; email: string | null; address: string | null } | null } | null>(null)
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    genre: "femme" as Gender,
    nbPersonnes: Math.min(Math.max(1, initialPeople), Math.max(1, acc.places_disponibles)),
    dateEntree: initialArrival,
    dateSortie: initialDeparture,
    consentement: false,
  })

  const nights =
    form.dateEntree && form.dateSortie && form.dateSortie > form.dateEntree
      ? nightsBetween(form.dateEntree, form.dateSortie)
      : 0
  const total =
    nights * form.nbPersonnes * Number(acc.prix_personne_nuit || 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim()) {
      toast.error("Merci de renseigner votre nom, email et téléphone.")
      return
    }
    if (!form.consentement) {
      toast.error("Le partage des coordonnées est nécessaire pour confirmer la réservation.")
      return
    }
    if (form.dateSortie <= form.dateEntree) {
      toast.error("Vérifiez les dates de séjour.")
      return
    }

    setSaving(true)
    try {
      const result = await reserveAccommodation({
        accommodationId: acc.id,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        genre: form.genre,
        nbPersonnes: form.nbPersonnes,
        dateEntree: form.dateEntree,
        dateSortie: form.dateSortie,
        consentement: form.consentement,
      })
      if (result.emailSent) {
        toast.success("Place confirmée : le nombre de places disponibles a été mis à jour.")
      } else {
        toast.warning("Place confirmée. La notification par email n’a pas abouti.")
      }
      setConfirmation({ emailSent: result.emailSent, cancellationUrl: `/annuler?reservation=${encodeURIComponent(result.reservationId)}&code=${encodeURIComponent(result.emailToken)}`, whatsappUrl: result.whatsappUrl, providerContact: result.providerContact })
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : ""
      if (message.includes("not_enough_places")) toast.error("Il ne reste plus assez de places.")
      else if (message.includes("dates_unavailable")) toast.error("Ces dates ne sont plus disponibles.")
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
            <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">{acc.nom}</h2>
            <p className="mt-1 text-sm text-[#5B4549]">
              {acc.places_disponibles} place{acc.places_disponibles > 1 ? "s" : ""} restante{acc.places_disponibles > 1 ? "s" : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#6D1925] hover:bg-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmation ? (
          <div className="mt-5 grid gap-4 rounded-2xl border border-[#6D1925]/10 bg-white/75 p-5">
            <h3 className="font-serif text-2xl font-semibold text-[#6D1925]">Réservation confirmée</h3>
            <p className="text-sm text-[#5B4549]">{confirmation.emailSent ? "Votre place est décomptée. Vous pouvez contacter la personne ci-dessous." : "Votre place est décomptée. Vous pouvez contacter la personne ci-dessous ; la notification par email a échoué."}</p>
            {confirmation.providerContact && <div className="rounded-xl bg-[#FFF7E9] p-4 text-sm text-[#4B242B]"><p className="font-semibold">Contact : {confirmation.providerContact.name}</p>{confirmation.providerContact.phone && <a className="block underline" href={`tel:${confirmation.providerContact.phone}`}>{confirmation.providerContact.phone}</a>}{confirmation.providerContact.email && <a className="block underline" href={`mailto:${confirmation.providerContact.email}`}>{confirmation.providerContact.email}</a>}{confirmation.providerContact.address && <p>{confirmation.providerContact.address}</p>}</div>}
            <a href={confirmation.cancellationUrl} className="text-sm font-semibold underline text-[#6D1925]">Conserver mon lien pour annuler cette place si besoin</a>
            {confirmation.whatsappUrl && <a href={confirmation.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-[#10351d]"><MessageCircle className="h-5 w-5" /> Rejoindre le groupe WhatsApp</a>}
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">Fermer</button>
          </div>
        ) : <form onSubmit={submit} className="mt-5 grid gap-4">
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
              <input className={field} type="tel" value={form.telephone} onChange={(e) => setForm((s) => ({ ...s, telephone: e.target.value }))} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field title="Arrivée">
              <select className={field} value={form.dateEntree} onChange={(e) => setForm((s) => ({ ...s, dateEntree: e.target.value }))}>
                {OUTBOUND_DATES.filter((d) => !acc.date_entree || d.value >= acc.date_entree).map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field title="Départ">
              <select className={field} value={form.dateSortie} onChange={(e) => setForm((s) => ({ ...s, dateSortie: e.target.value }))}>
                {RETURN_DATES.filter((d) => !acc.date_sortie || d.value <= acc.date_sortie).map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </Field>
            <Field title="Nombre de personnes">
              <input
                className={field}
                type="number"
                min={1}
                max={acc.places_disponibles}
                value={form.nbPersonnes}
                onChange={(e) => setForm((s) => ({ ...s, nbPersonnes: Math.min(acc.places_disponibles, Math.max(1, Number(e.target.value) || 1)) }))}
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-wide text-[#6D1925]/55">Montant calculé automatiquement</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-[#6D1925]">
              {total === 0 ? "Gratuit" : total.toFixed(0) + " €"}
            </p>
            <p className="mt-1 text-xs text-[#5B4549]">
              {form.nbPersonnes} personne{form.nbPersonnes > 1 ? "s" : ""} × {nights} nuit{nights > 1 ? "s" : ""} × {Number(acc.prix_personne_nuit || 0).toFixed(0)} €
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#6D1925]/10 bg-white/60 p-3 text-xs leading-5 text-[#5B4549]">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.consentement}
              onChange={(e) => setForm((s) => ({ ...s, consentement: e.target.checked }))}
            />
            <span>
              J’accepte que mes coordonnées (nom, email et téléphone) soient transmises à la personne qui propose ce logement, et de recevoir ses coordonnées par email afin d’organiser la réservation.
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
