"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Baby,
  BedDouble,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Phone,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { saveAccommodation, useAccommodations } from "@/lib/data"
import {
  ACCOMMODATION_TYPES,
  OUTBOUND_DATES,
  RETURN_DATES,
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
  const [childrenOnly, setChildrenOnly] = useState(false)
  const [petsOnly, setPetsOnly] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("action") === "add") setShowForm(true)
    if (params.get("source") === "admin") setOfferSource("admin")
  }, [])

  const filtered = useMemo(
    () =>
      accommodations
        .filter((a) => a.actif !== false)
        .filter((a) => (a.places_disponibles ?? a.capacite) >= people)
        .filter((a) => !childrenOnly || a.enfants_acceptes)
        .filter((a) => !petsOnly || a.animaux_acceptes)
        .filter((a) => !arrival || !a.date_entree || a.date_entree <= arrival)
        .filter((a) => !departure || !a.date_sortie || a.date_sortie >= departure),
    [accommodations, arrival, departure, people, childrenOnly, petsOnly],
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
        <div className="grid gap-3 md:grid-cols-5">
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
            <span className={label}>Places nécessaires</span>
            <input
              className={field}
              type="number"
              min={1}
              value={people}
              onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
            />
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

      {showForm && <AccommodationForm onClose={() => setShowForm(false)} source={offerSource} />}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des logements…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#6D1925]/20 bg-white/45 px-5 py-12 text-center">
          <BedDouble className="mx-auto mb-3 h-9 w-9 text-[#6D1925]/35" />
          <p className="font-medium text-[#4B242B]">Aucun logement ne correspond à ces critères.</p>
          <p className="mt-1 text-sm text-[#6D1925]/55">Essayez d’élargir vos filtres.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
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

                  {acc.adresse && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(acc.adresse)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 rounded-xl bg-[#FFF7E9]/60 p-3 text-sm text-[#5B4549] transition hover:bg-[#FFF7E9]"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6D1925]" />
                      <span className="min-w-0 flex-1">{acc.adresse}</span>
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                  )}

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
                    {acc.telephone_proposant && (
                      <a
                        href={`tel:${acc.telephone_proposant.replace(/\s/g, "")}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#6D1925]/20 px-3.5 py-2 text-sm font-semibold text-[#6D1925]"
                      >
                        <Phone className="h-4 w-4" />
                        {acc.telephone_proposant}
                      </a>
                    )}
                  </div>

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
  source,
}: {
  onClose: () => void
  source: "invite" | "admin"
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    propose_par: "",
    genre_proposant: "femme" as Gender,
    telephone_proposant: "",
    nom: "",
    type: "Airbnb" as AccommodationType,
    adresse: "",
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
    if (!form.propose_par.trim() || !form.telephone_proposant.trim() || !form.nom.trim() || !form.adresse.trim()) {
      toast.error("Merci de compléter le nom, le téléphone, le logement et l’adresse.")
      return
    }
    if (form.date_sortie <= form.date_entree) {
      toast.error("La date de sortie doit être après la date d’entrée.")
      return
    }
    setSaving(true)
    try {
      await saveAccommodation({
        ...form,
        capacite: form.places_disponibles,
        contact: form.propose_par,
        source,
        actif: true,
      })
      toast.success("Votre logement a bien été ajouté.")
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Impossible d’ajouter le logement pour le moment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="proposer" className="rounded-3xl border border-[#6D1925]/15 bg-[#FFF7E9] p-5 shadow-lg sm:p-7">
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
        <div className="grid gap-4 sm:grid-cols-3">
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

        <div className="grid gap-4 sm:grid-cols-3">
          <Field title="Places encore disponibles *">
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
