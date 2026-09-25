"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Car, Clock3, ExternalLink, MapPin, Phone, Plus, Search, X } from "lucide-react"
import { toast } from "sonner"
import { saveVehicle, useVehicles } from "@/lib/data"
import { OUTBOUND_DATES, RETURN_DATES, type Gender, type TransportType } from "@/lib/types"

const field = "w-full rounded-xl border border-[#6D1925]/15 bg-white/75 px-3 py-2.5 text-sm text-[#34171C] outline-none transition focus:border-[#6D1925]/45 focus:ring-2 focus:ring-[#6D1925]/10"
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#6D1925]/70"

function dateLabel(value: string | null) {
  if (!value) return "—"
  const found = [...OUTBOUND_DATES, ...RETURN_DATES].find((d) => d.value === value)
  return found?.label ?? value
}

function genderEmoji(gender: Gender | null) {
  return gender === "femme" ? "👩" : gender === "homme" ? "👨" : "🙂"
}

export function TransportMarketplace() {
  const { data: vehicles = [], isLoading } = useVehicles()
  const [showForm, setShowForm] = useState(false)
  const [offerSource, setOfferSource] = useState<"invite" | "admin">("invite")
  const [type, setType] = useState<"" | TransportType>("")
  const [date, setDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [city, setCity] = useState("")
  const [people, setPeople] = useState(1)
  const [gender, setGender] = useState<"" | Gender>("")
  const [freeOnly, setFreeOnly] = useState(false)
  const [petsOnly, setPetsOnly] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("action") === "add") setShowForm(true)
    if (params.get("source") === "admin") setOfferSource("admin")
  }, [])

  const filtered = useMemo(() => {
    const q = city.trim().toLowerCase()
    return vehicles
      .filter((v) => v.actif !== false)
      .filter((v) => (v.places_disponibles ?? v.places) >= people)
      .filter((v) => !type || v.type_trajet === type)
      .filter((v) => !date || v.date_depart === date)
      .filter((v) => !returnDate || v.date_retour === returnDate)
      .filter((v) => !gender || v.genre_conducteur === gender)
      .filter((v) => !freeOnly || v.gratuit)
      .filter((v) => !petsOnly || v.animaux_acceptes)
      .filter((v) => !q || ((v.ville_depart ?? "") + " " + (v.lieu_depart ?? "")).toLowerCase().includes(q))
  }, [vehicles, type, date, returnDate, city, people, gender, freeOnly, petsOnly])

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
            <span className={label}>Type</span>
            <select className={field} value={type} onChange={(e) => setType(e.target.value as "" | TransportType)}>
              <option value="">Tous</option>
              <option value="trajet">🚗 Trajet vers le mariage</option>
              <option value="navette">🚉 Navette locale / gare</option>
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
            <span className={label}>Ville / zone</span>
            <input className={field} placeholder="Ex. Massy, Paris, Troyes…" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <span className={label}>Places nécessaires</span>
            <input className={field} type="number" min={1} value={people} onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select className="rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs" value={gender} onChange={(e) => setGender(e.target.value as "" | Gender)}>
            <option value="">👤 Conducteur : peu importe</option>
            <option value="femme">👩 Femme</option>
            <option value="homme">👨 Homme</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> Gratuit uniquement
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-[#6D1925]/10 bg-[#FFF7E9] px-3 py-1.5 text-xs">
            <input type="checkbox" checked={petsOnly} onChange={(e) => setPetsOnly(e.target.checked)} /> 🐶 Animaux acceptés
          </label>
        </div>
      </section>

      {showForm && <TransportForm onClose={() => setShowForm(false)} source={offerSource} />}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des transports…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#6D1925]/20 bg-white/45 px-5 py-12 text-center">
          <Car className="mx-auto mb-3 h-9 w-9 text-[#6D1925]/35" />
          <p className="font-medium text-[#4B242B]">Aucun transport ne correspond à ces critères.</p>
          <p className="mt-1 text-sm text-[#6D1925]/55">Essayez une autre date, ville ou zone.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((veh) => {
            const places = veh.places_disponibles ?? veh.places
            const mapHref = veh.lieu_depart ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(veh.lieu_depart) : undefined
            const phoneHref = veh.telephone ? "tel:" + veh.telephone.replace(/\s/g, "") : undefined
            return (
              <article key={veh.id} className="overflow-hidden rounded-2xl border border-[#6D1925]/10 bg-white shadow-[0_8px_30px_rgba(109,25,37,0.06)]">
                <div className="border-b border-[#6D1925]/8 bg-[#FFF7E9]/55 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">{genderEmoji(veh.genre_conducteur)} {veh.conducteur}</h2>
                        <span className="rounded-full border border-[#6D1925]/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6D1925]/70">
                          {veh.type_trajet === "navette" ? "🚉 Navette locale" : "🚗 Covoiturage"}
                        </span>
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

                  {(veh.ville_depart || veh.lieu_depart) && (
                    <a href={mapHref} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-xl bg-[#FFF7E9]/60 p-3 text-sm text-[#5B4549] transition hover:bg-[#FFF7E9]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6D1925]" />
                      <span className="min-w-0 flex-1">
                        <strong>{veh.ville_depart || "Départ"}</strong>
                        {veh.lieu_depart && <><br />{veh.lieu_depart}</>}
                        {veh.destination && <><br /><span className="text-xs">→ {veh.destination}</span></>}
                      </span>
                      {veh.lieu_depart && <ExternalLink className="h-4 w-4 shrink-0" />}
                    </a>
                  )}

                  {veh.date_retour && (
                    <div className="rounded-xl bg-[#6D1925]/[0.035] px-3 py-2.5 text-sm text-[#5B4549]">
                      Retour : <strong>{dateLabel(veh.date_retour)}</strong>{veh.heure_retour ? " à " + veh.heure_retour : ""}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Sticker>{genderEmoji(veh.genre_conducteur)} {veh.genre_conducteur === "femme" ? "Conductrice" : "Conducteur"}</Sticker>
                    <Sticker>{veh.animaux_acceptes ? "🐶 Animaux OK" : "🚫🐶 Sans animaux"}</Sticker>
                    <Sticker>{veh.gratuit ? "🎁 Gratuit" : "💶 " + Number(veh.participation || 0).toFixed(0) + " € / pers."}</Sticker>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-[#6D1925]/8 pt-4">
                    <p className="text-xs text-[#6D1925]/55">Contactez directement {veh.conducteur} pour vous organiser.</p>
                    {veh.telephone && (
                      <a href={phoneHref} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#6D1925]/20 px-3.5 py-2 text-sm font-semibold text-[#6D1925]">
                        <Phone className="h-4 w-4" /> {veh.telephone}
                      </a>
                    )}
                  </div>

                  {veh.commentaires && <p className="rounded-xl bg-[#6D1925]/[0.035] p-3 text-xs leading-5 text-[#5B4549]">{veh.commentaires}</p>}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-[#6D1925]/45">{filtered.length} transport{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>
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
  source,
}: {
  onClose: () => void
  source: "invite" | "admin"
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    conducteur: "",
    genre_conducteur: "femme" as Gender,
    telephone: "",
    type_trajet: "trajet" as TransportType,
    ville_depart: "",
    lieu_depart: "",
    destination: "Salle de réception",
    date_depart: "2026-12-31",
    heure_depart: "",
    date_retour: "",
    heure_retour: "",
    places_disponibles: 1,
    gratuit: true,
    participation: 0,
    animaux_acceptes: false,
    commentaires: "",
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.conducteur.trim() || !form.telephone.trim() || !form.lieu_depart.trim() || !form.heure_depart) {
      toast.error("Merci de compléter le conducteur, le téléphone, l’adresse et l’heure de départ.")
      return
    }
    setSaving(true)
    try {
      await saveVehicle({ ...form, places: form.places_disponibles, source, actif: true })
      toast.success("Votre transport a bien été ajouté.")
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Impossible d’ajouter le transport pour le moment.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="proposer" className="rounded-3xl border border-[#6D1925]/15 bg-[#FFF7E9] p-5 shadow-lg sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D1925]/55">Partager une place</p>
          <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Proposer un transport</h2>
          <p className="mt-1 text-sm text-[#5B4549]">Covoiturage depuis votre ville ou disponibilité locale pour une gare / la salle.</p>
        </div>
        <button onClick={onClose} aria-label="Fermer" className="rounded-full p-2 text-[#6D1925] hover:bg-white/70"><X className="h-5 w-5" /></button>
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field title="Prénom / nom *"><input className={field} value={form.conducteur} onChange={(e) => set("conducteur", e.target.value)} /></Field>
          <Field title="Vous êtes *">
            <select className={field} value={form.genre_conducteur} onChange={(e) => set("genre_conducteur", e.target.value as Gender)}>
              <option value="femme">👩 Femme</option><option value="homme">👨 Homme</option>
            </select>
          </Field>
          <Field title="Téléphone *"><input className={field} type="tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} /></Field>
        </div>

        <Field title="Type de transport">
          <select className={field} value={form.type_trajet} onChange={(e) => set("type_trajet", e.target.value as TransportType)}>
            <option value="trajet">🚗 Trajet vers le mariage / retour</option>
            <option value="navette">🚉 Navette locale : gare, église, salle</option>
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Ville / zone de départ"><input className={field} placeholder="Ex. Massy, Paris, Troyes…" value={form.ville_depart} onChange={(e) => set("ville_depart", e.target.value)} /></Field>
          <Field title="Adresse exacte de prise en charge *"><input className={field} placeholder="Adresse ou gare précise" value={form.lieu_depart} onChange={(e) => set("lieu_depart", e.target.value)} /></Field>
        </div>

        <Field title="Destination / zone desservie"><input className={field} placeholder="Salle, église, gare de Troyes…" value={form.destination} onChange={(e) => set("destination", e.target.value)} /></Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field title="Départ *">
            <select className={field} value={form.date_depart} onChange={(e) => set("date_depart", e.target.value)}>
              {OUTBOUND_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Heure de départ *"><input className={field} type="time" value={form.heure_depart} onChange={(e) => set("heure_depart", e.target.value)} /></Field>
          <Field title="Places disponibles *"><input className={field} type="number" min={1} value={form.places_disponibles} onChange={(e) => set("places_disponibles", Math.max(1, Number(e.target.value) || 1))} /></Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Retour (facultatif)">
            <select className={field} value={form.date_retour} onChange={(e) => set("date_retour", e.target.value)}>
              <option value="">Pas de retour proposé</option>
              {RETURN_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Heure de retour"><input className={field} type="time" value={form.heure_retour} onChange={(e) => set("heure_retour", e.target.value)} disabled={!form.date_retour} /></Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-white/60 px-4 py-3 text-sm"><span>Transport gratuit 🎁</span><input type="checkbox" checked={form.gratuit} onChange={(e) => set("gratuit", e.target.checked)} /></label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-white/60 px-4 py-3 text-sm"><span>Animaux acceptés 🐶</span><input type="checkbox" checked={form.animaux_acceptes} onChange={(e) => set("animaux_acceptes", e.target.checked)} /></label>
        </div>

        {!form.gratuit && <Field title="Participation demandée par personne (€)"><input className={field} type="number" min={0} step="0.01" value={form.participation} onChange={(e) => set("participation", Math.max(0, Number(e.target.value) || 0))} /></Field>}

        <Field title="Informations complémentaires"><textarea className={field} rows={3} placeholder="Ex. petit bagage uniquement, passage par telle gare…" value={form.commentaires} onChange={(e) => set("commentaires", e.target.value)} /></Field>

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
