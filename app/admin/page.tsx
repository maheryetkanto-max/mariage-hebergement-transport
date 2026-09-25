"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  BedDouble,
  Car,
  ChevronDown,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  adminDeleteAccommodation,
  adminDeleteVehicle,
  adminListReservations,
  adminOfferEmails,
  adminPatchAccommodation,
  adminPatchVehicle,
  organizerHasPassword,
  setupOrganizerPassword,
  useAccommodations,
  useVehicles,
  verifyWeddingAdmin,
} from "@/lib/data"
import {
  ACCOMMODATION_TYPES,
  OUTBOUND_DATES,
  RETURN_DATES,
  type Accommodation,
  type AccommodationType,
  type Gender,
  type Reservation,
  type TransportType,
  type Vehicle,
} from "@/lib/types"

const field =
  "w-full rounded-xl border border-[#6D1925]/15 bg-white px-3 py-2.5 text-sm text-[#34171C] outline-none focus:border-[#6D1925]/45 focus:ring-2 focus:ring-[#6D1925]/10"
const label =
  "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6D1925]/55"

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [authorized, setAuthorized] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    organizerHasPassword()
      .then(async (configured) => {
        setHasPassword(configured)
        if (!configured) return
        const saved = sessionStorage.getItem("mk-admin-pass")
        if (!saved) return
        setPassword(saved)
        const ok = await verifyWeddingAdmin(saved)
        setAuthorized(ok)
      })
      .catch(() => setHasPassword(true))
  }, [])

  async function createPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Choisissez au moins 8 caractères.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.")
      return
    }
    setChecking(true)
    try {
      const created = await setupOrganizerPassword(password)
      if (!created) {
        toast.error("Un mot de passe organisateur existe déjà.")
        setHasPassword(true)
        return
      }
      sessionStorage.setItem("mk-admin-pass", password)
      setHasPassword(true)
      setAuthorized(true)
      toast.success("Accès organisateur créé.")
    } catch {
      toast.error("Impossible de créer l’accès organisateur.")
    } finally {
      setChecking(false)
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    try {
      const ok = await verifyWeddingAdmin(password)
      if (!ok) {
        toast.error("Mot de passe incorrect.")
        return
      }
      sessionStorage.setItem("mk-admin-pass", password)
      setAuthorized(true)
    } catch {
      toast.error("Impossible de vérifier l’accès.")
    } finally {
      setChecking(false)
    }
  }

  function logout() {
    sessionStorage.removeItem("mk-admin-pass")
    setAuthorized(false)
    setPassword("")
  }

  if (hasPassword === null) {
    return <div className="py-20 text-center text-sm text-[#6D1925]/55">Préparation de l’espace organisateur…</div>
  }

  if (!authorized) {
    const firstSetup = !hasPassword
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-[#6D1925]/10 bg-[#FFF7E9] p-6 shadow-xl sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6D1925] text-[#FFF7E9]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#6D1925]/50">
            Espace privé
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#6D1925]">
            {firstSetup ? "Créer l’accès organisateur" : "Organisateurs"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#5B4549]">
            {firstSetup
              ? "Choisissez votre mot de passe. Il servira ensuite uniquement à Mahery et Kanto pour gérer les offres."
              : "Connectez-vous pour modifier, masquer ou supprimer les offres."}
          </p>

          <form onSubmit={firstSetup ? createPassword : login} className="mt-6 space-y-4">
            <PasswordField
              title={firstSetup ? "Nouveau mot de passe" : "Mot de passe"}
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
            {firstSetup && (
              <PasswordField
                title="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            )}
            <button
              disabled={checking}
              className="min-h-11 w-full rounded-xl bg-[#6D1925] px-4 text-sm font-semibold text-[#FFF7E9] disabled:opacity-60"
            >
              {checking
                ? "Vérification…"
                : firstSetup
                  ? "Créer mon accès"
                  : "Accéder au back-office"}
            </button>
          </form>
          <Link href="/" className="mt-4 block text-center text-xs font-medium text-[#6D1925]/55">
            ← Retour à l’application
          </Link>
        </div>
      </div>
    )
  }

  return <AdminDashboard password={password} onLogout={logout} />
}

function PasswordField({
  title,
  value,
  onChange,
  show,
  onToggle,
}: {
  title: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      <div className="relative">
        <input
          autoFocus
          type={show ? "text" : "password"}
          className={field + " pr-11"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#6D1925]/60"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  )
}

function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const { data: accommodations = [], isLoading: loadingAcc } = useAccommodations()
  const { data: vehicles = [], isLoading: loadingVeh } = useVehicles()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(true)
  const [accommodationEmails, setAccommodationEmails] = useState<Record<string, string>>({})
  const [vehicleEmails, setVehicleEmails] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([adminListReservations(password), adminOfferEmails(password)])
      .then(([reservationRows, contacts]) => {
        setReservations(reservationRows)
        setAccommodationEmails(
          Object.fromEntries(contacts.accommodations.map((item) => [item.id, item.email ?? ""])),
        )
        setVehicleEmails(
          Object.fromEntries(contacts.vehicles.map((item) => [item.id, item.email ?? ""])),
        )
      })
      .catch(() => toast.error("Impossible de charger toutes les données du back-office."))
      .finally(() => setLoadingReservations(false))
  }, [password])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-[#6D1925]/10 bg-[#FFF7E9] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6D1925]/50">
            Espace privé
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#6D1925]">
            Back-office organisateurs
          </h1>
          <p className="mt-2 text-sm text-[#5B4549]">
            Ajoutez une offre reçue par message, modifiez ses informations ou retirez-la de la vue invités.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/hebergements?action=add&source=admin"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#6D1925] px-3.5 text-xs font-semibold text-[#FFF7E9]"
          >
            <Plus className="h-4 w-4" /> Ajouter logement
          </Link>
          <Link
            href="/transports?action=add&source=admin"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#6D1925] px-3.5 text-xs font-semibold text-[#FFF7E9]"
          >
            <Plus className="h-4 w-4" /> Ajouter transport
          </Link>
          <button
            onClick={onLogout}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#6D1925]/20 px-3.5 text-xs font-semibold text-[#6D1925]"
          >
            <LogOut className="h-4 w-4" /> Quitter
          </button>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Réservations</h2>
            <p className="mt-1 text-xs text-[#6D1925]/50">Suivi des réservations confirmées et de l’envoi des emails.</p>
          </div>
          <span className="text-xs text-[#6D1925]/50">{reservations.length} réservation{reservations.length > 1 ? "s" : ""}</span>
        </div>
        {loadingReservations ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : reservations.length === 0 ? (
          <Empty text="Aucune réservation pour le moment." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-2xl border border-[#6D1925]/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#4B242B]">{reservation.reserver_nom}</p>
                    <p className="mt-1 text-xs text-[#6D1925]/55">
                      {reservation.offer_type === "accommodation" ? "Hébergement" : "Transport"} · {reservation.nb_personnes} personne{reservation.nb_personnes > 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={"rounded-full px-2.5 py-1 text-[10px] font-semibold " + (
                    reservation.email_status === "sent"
                      ? "bg-emerald-50 text-emerald-700"
                      : reservation.email_status === "failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  )}>
                    {reservation.email_status === "sent" ? "Emails envoyés" : reservation.email_status === "failed" ? "Échec email" : "Email en attente"}
                  </span>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-[#5B4549]">
                  <span>{reservation.reserver_email}</span>
                  <span>{reservation.reserver_telephone}</span>
                  {reservation.date_entree && reservation.date_sortie && (
                    <span>{reservation.date_entree} → {reservation.date_sortie}</span>
                  )}
                  <span className="font-semibold text-[#6D1925]">
                    Montant : {Number(reservation.montant_total || 0) === 0 ? "Gratuit" : Number(reservation.montant_total).toFixed(0) + " €"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-[#6D1925]" />
            <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Hébergements</h2>
          </div>
          <span className="text-xs text-[#6D1925]/50">{accommodations.length} offre{accommodations.length > 1 ? "s" : ""}</span>
        </div>
        {loadingAcc ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : accommodations.length === 0 ? (
          <Empty text="Aucun hébergement." />
        ) : (
          <div className="grid gap-3">
            {accommodations.map((acc) => (
              <AccommodationAdminRow
                key={acc.id}
                acc={acc}
                password={password}
                privateEmail={accommodationEmails[acc.id] ?? ""}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[#6D1925]" />
            <h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Transports</h2>
          </div>
          <span className="text-xs text-[#6D1925]/50">{vehicles.length} offre{vehicles.length > 1 ? "s" : ""}</span>
        </div>
        {loadingVeh ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : vehicles.length === 0 ? (
          <Empty text="Aucun transport." />
        ) : (
          <div className="grid gap-3">
            {vehicles.map((veh) => (
              <VehicleAdminRow
                key={veh.id}
                veh={veh}
                password={password}
                privateEmail={vehicleEmails[veh.id] ?? ""}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AccommodationAdminRow({
  acc,
  password,
  privateEmail,
}: {
  acc: Accommodation
  password: string
  privateEmail: string
}) {
  const [form, setForm] = useState({
    nom: acc.nom,
    type: acc.type,
    adresse: acc.adresse ?? "",
    propose_par: acc.propose_par ?? acc.contact ?? "",
    genre_proposant: (acc.genre_proposant ?? "femme") as Gender,
    telephone_proposant: acc.telephone_proposant ?? "",
    email_proposant: privateEmail,
    places_disponibles: acc.places_disponibles ?? acc.capacite,
    minutes_salle: acc.minutes_salle ?? 0,
    date_entree: acc.date_entree ?? "2026-12-30",
    date_sortie: acc.date_sortie ?? "2027-01-01",
    prix_personne_nuit: Number(acc.prix_personne_nuit || 0),
    enfants_acceptes: acc.enfants_acceptes,
    animaux_acceptes: acc.animaux_acceptes,
    commentaires: acc.commentaires ?? "",
    actif: acc.actif !== false,
  })
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [key]: value }))

  async function save() {
    setSaving(true)
    try {
      await adminPatchAccommodation(password, acc.id, {
        ...form,
        capacite: Math.max(acc.capacite || 0, form.places_disponibles),
        contact: form.propose_par,
        source: acc.source || "admin",
      })
      toast.success("Hébergement mis à jour.")
    } catch {
      toast.error("Modification impossible.")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement cet hébergement ?")) return
    try {
      await adminDeleteAccommodation(password, acc.id)
      toast.success("Hébergement supprimé.")
    } catch {
      toast.error("Suppression impossible.")
    }
  }

  return (
    <details className="group rounded-2xl border border-[#6D1925]/10 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#4B242B]">{form.nom}</p>
          <p className="mt-0.5 truncate text-xs text-[#6D1925]/55">
            {form.propose_par || "Sans contact"} · {form.places_disponibles} place{form.places_disponibles > 1 ? "s" : ""} · {form.actif ? "Visible" : "Masqué"}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-[#6D1925]/50 transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#6D1925]/8 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field title="Nom du logement">
            <input className={field} value={form.nom} onChange={(e) => set("nom", e.target.value)} />
          </Field>
          <Field title="Type">
            <select className={field} value={form.type} onChange={(e) => set("type", e.target.value as AccommodationType)}>
              {ACCOMMODATION_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field title="Proposé par">
            <input className={field} value={form.propose_par} onChange={(e) => set("propose_par", e.target.value)} />
          </Field>
          <Field title="Genre">
            <select className={field} value={form.genre_proposant} onChange={(e) => set("genre_proposant", e.target.value as Gender)}>
              <option value="femme">👩 Femme</option>
              <option value="homme">👨 Homme</option>
            </select>
          </Field>
          <Field title="Téléphone">
            <input className={field} value={form.telephone_proposant} onChange={(e) => set("telephone_proposant", e.target.value)} />
          </Field>
          <Field title="Email">
            <input className={field} type="email" value={form.email_proposant} onChange={(e) => set("email_proposant", e.target.value)} />
          </Field>
          <Field title="Places restantes">
            <input className={field} type="number" min={0} value={form.places_disponibles} onChange={(e) => set("places_disponibles", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field title="Adresse">
            <input className={field} value={form.adresse} onChange={(e) => set("adresse", e.target.value)} />
          </Field>
          <Field title="Minutes de la salle">
            <input className={field} type="number" min={0} value={form.minutes_salle} onChange={(e) => set("minutes_salle", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field title="Prix / pers. / nuit">
            <input className={field} type="number" min={0} step="0.01" value={form.prix_personne_nuit} onChange={(e) => set("prix_personne_nuit", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field title="Disponible dès">
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

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Toggle text="👶 Enfants acceptés" checked={form.enfants_acceptes} onChange={(v) => set("enfants_acceptes", v)} />
          <Toggle text="🐶 Animaux acceptés" checked={form.animaux_acceptes} onChange={(v) => set("animaux_acceptes", v)} />
          <Toggle text="Visible pour les invités" checked={form.actif} onChange={(v) => set("actif", v)} />
        </div>

        <Field title="Commentaires" className="mt-4">
          <textarea className={field} rows={2} value={form.commentaires} onChange={(e) => set("commentaires", e.target.value)} />
        </Field>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={remove} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3.5 text-xs font-semibold text-red-700">
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
          <button onClick={save} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#6D1925] px-4 text-xs font-semibold text-[#FFF7E9] disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </details>
  )
}

function VehicleAdminRow({
  veh,
  password,
  privateEmail,
}: {
  veh: Vehicle
  password: string
  privateEmail: string
}) {
  const [form, setForm] = useState({
    conducteur: veh.conducteur,
    genre_conducteur: (veh.genre_conducteur ?? "femme") as Gender,
    telephone: veh.telephone ?? "",
    email_conducteur: privateEmail,
    type_trajet: (veh.type_trajet ?? "trajet") as TransportType,
    ville_depart: veh.ville_depart ?? "",
    lieu_depart: veh.lieu_depart ?? "",
    destination: veh.destination ?? "",
    date_depart: veh.date_depart ?? "2026-12-31",
    heure_depart: veh.heure_depart ?? "",
    date_retour: veh.date_retour ?? "",
    heure_retour: veh.heure_retour ?? "",
    places_disponibles: veh.places_disponibles ?? veh.places,
    gratuit: veh.gratuit,
    participation: Number(veh.participation || 0),
    animaux_acceptes: veh.animaux_acceptes,
    commentaires: veh.commentaires ?? "",
    actif: veh.actif !== false,
  })
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [key]: value }))

  async function save() {
    setSaving(true)
    try {
      await adminPatchVehicle(password, veh.id, {
        ...form,
        places: Math.max(veh.places || 0, form.places_disponibles),
        participation: form.gratuit ? 0 : form.participation,
        source: veh.source || "admin",
      })
      toast.success("Transport mis à jour.")
    } catch {
      toast.error("Modification impossible.")
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm("Supprimer définitivement ce transport ?")) return
    try {
      await adminDeleteVehicle(password, veh.id)
      toast.success("Transport supprimé.")
    } catch {
      toast.error("Suppression impossible.")
    }
  }

  return (
    <details className="group rounded-2xl border border-[#6D1925]/10 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#4B242B]">{form.conducteur}</p>
          <p className="mt-0.5 truncate text-xs text-[#6D1925]/55">
            {form.type_trajet === "navette" ? "Navette locale" : "Covoiturage"} · {form.places_disponibles} place{form.places_disponibles > 1 ? "s" : ""} · {form.actif ? "Visible" : "Masqué"}
          </p>
        </div>
        <ChevronDown className="h-4 w-4 text-[#6D1925]/50 transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#6D1925]/8 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field title="Conducteur">
            <input className={field} value={form.conducteur} onChange={(e) => set("conducteur", e.target.value)} />
          </Field>
          <Field title="Genre">
            <select className={field} value={form.genre_conducteur} onChange={(e) => set("genre_conducteur", e.target.value as Gender)}>
              <option value="femme">👩 Femme</option>
              <option value="homme">👨 Homme</option>
            </select>
          </Field>
          <Field title="Téléphone">
            <input className={field} value={form.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </Field>
          <Field title="Email">
            <input className={field} type="email" value={form.email_conducteur} onChange={(e) => set("email_conducteur", e.target.value)} />
          </Field>
          <Field title="Type">
            <select className={field} value={form.type_trajet} onChange={(e) => set("type_trajet", e.target.value as TransportType)}>
              <option value="trajet">🚗 Covoiturage</option>
              <option value="navette">🚉 Navette locale</option>
            </select>
          </Field>
          <Field title="Ville / zone">
            <input className={field} value={form.ville_depart} onChange={(e) => set("ville_depart", e.target.value)} />
          </Field>
          <Field title="Adresse exacte">
            <input className={field} value={form.lieu_depart} onChange={(e) => set("lieu_depart", e.target.value)} />
          </Field>
          <Field title="Destination">
            <input className={field} value={form.destination} onChange={(e) => set("destination", e.target.value)} />
          </Field>
          <Field title="Date départ">
            <select className={field} value={form.date_depart} onChange={(e) => set("date_depart", e.target.value)}>
              {OUTBOUND_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Heure départ">
            <input className={field} type="time" value={form.heure_depart} onChange={(e) => set("heure_depart", e.target.value)} />
          </Field>
          <Field title="Retour">
            <select className={field} value={form.date_retour} onChange={(e) => set("date_retour", e.target.value)}>
              <option value="">Aucun retour</option>
              {RETURN_DATES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </Field>
          <Field title="Heure retour">
            <input className={field} type="time" value={form.heure_retour} onChange={(e) => set("heure_retour", e.target.value)} />
          </Field>
          <Field title="Places restantes">
            <input className={field} type="number" min={0} value={form.places_disponibles} onChange={(e) => set("places_disponibles", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
          <Field title="Participation / pers.">
            <input disabled={form.gratuit} className={field + " disabled:opacity-40"} type="number" min={0} step="0.01" value={form.participation} onChange={(e) => set("participation", Math.max(0, Number(e.target.value) || 0))} />
          </Field>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Toggle text="🎁 Gratuit" checked={form.gratuit} onChange={(v) => set("gratuit", v)} />
          <Toggle text="🐶 Animaux acceptés" checked={form.animaux_acceptes} onChange={(v) => set("animaux_acceptes", v)} />
          <Toggle text="Visible pour les invités" checked={form.actif} onChange={(v) => set("actif", v)} />
        </div>

        <Field title="Commentaires" className="mt-4">
          <textarea className={field} rows={2} value={form.commentaires} onChange={(e) => set("commentaires", e.target.value)} />
        </Field>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={remove} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3.5 text-xs font-semibold text-red-700">
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
          <button onClick={save} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#6D1925] px-4 text-xs font-semibold text-[#FFF7E9] disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </details>
  )
}

function Field({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={"block " + className}>
      <span className={label}>{title}</span>
      {children}
    </label>
  )
}

function Toggle({
  text,
  checked,
  onChange,
}: {
  text: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#6D1925]/10 bg-[#FFF7E9]/55 px-3 py-2.5 text-xs font-medium text-[#4B242B]">
      <span>{text}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#6D1925]/15 bg-white/45 p-8 text-center text-sm text-[#6D1925]/50">
      {text}
    </div>
  )
}
