"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { BedDouble, Car, Eye, EyeOff, LogOut, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  adminDeleteAccommodation,
  adminDeleteVehicle,
  adminPatchAccommodation,
  adminPatchVehicle,
  useAccommodations,
  useVehicles,
  verifyWeddingAdmin,
} from "@/lib/data"
import type { Accommodation, Vehicle } from "@/lib/types"

const field = "w-full rounded-lg border border-[#6D1925]/15 bg-white px-2.5 py-2 text-sm outline-none focus:border-[#6D1925]/40"

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem("mk-admin-pass")
    if (saved) {
      setPassword(saved)
      verifyWeddingAdmin(saved).then((ok) => setAuthorized(ok)).catch(() => setAuthorized(false))
    }
  }, [])

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

  if (!authorized) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-[#6D1925]/10 bg-[#FFF7E9] p-6 shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6D1925]/50">Espace privé</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-[#6D1925]">Organisateurs</h1>
          <p className="mt-2 text-sm leading-6 text-[#5B4549]">
            Cet espace permet de modifier les offres et d’ajouter manuellement les informations reçues des invités.
          </p>
          <form onSubmit={login} className="mt-6 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6D1925]/65">Mot de passe</label>
            <div className="relative">
              <input
                autoFocus
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-[#6D1925]/15 bg-white px-3 py-3 pr-11 text-sm outline-none focus:border-[#6D1925]/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#6D1925]/60">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button disabled={checking} className="min-h-11 w-full rounded-xl bg-[#6D1925] px-4 text-sm font-semibold text-[#FFF7E9] disabled:opacity-60">
              {checking ? "Vérification…" : "Accéder au back-office"}
            </button>
          </form>
          <Link href="/" className="mt-4 block text-center text-xs font-medium text-[#6D1925]/55">← Retour à l’application</Link>
        </div>
      </div>
    )
  }

  return <AdminDashboard password={password} onLogout={logout} />
}

function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const { data: accommodations = [], isLoading: loadingAcc } = useAccommodations()
  const { data: vehicles = [], isLoading: loadingVeh } = useVehicles()

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 rounded-3xl border border-[#6D1925]/10 bg-[#FFF7E9] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6D1925]/50">Espace privé</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#6D1925]">Back-office organisateurs</h1>
          <p className="mt-2 text-sm text-[#5B4549]">Ajoutez une offre au nom d’un invité, corrigez le nombre de places ou masquez une annonce.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/hebergements?action=add" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#6D1925] px-3.5 text-xs font-semibold text-[#FFF7E9]"><Plus className="h-4 w-4" /> Ajouter logement</Link>
          <Link href="/transports?action=add" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#6D1925] px-3.5 text-xs font-semibold text-[#FFF7E9]"><Plus className="h-4 w-4" /> Ajouter transport</Link>
          <button onClick={onLogout} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#6D1925]/20 px-3.5 text-xs font-semibold text-[#6D1925]"><LogOut className="h-4 w-4" /> Quitter</button>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center gap-2"><BedDouble className="h-5 w-5 text-[#6D1925]" /><h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Hébergements</h2></div>
        {loadingAcc ? <p className="text-sm text-muted-foreground">Chargement…</p> : accommodations.length === 0 ? <Empty text="Aucun hébergement." /> : (
          <div className="grid gap-3">
            {accommodations.map((acc) => <AccommodationAdminRow key={acc.id} acc={acc} password={password} />)}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Car className="h-5 w-5 text-[#6D1925]" /><h2 className="font-serif text-2xl font-semibold text-[#6D1925]">Transports</h2></div>
        {loadingVeh ? <p className="text-sm text-muted-foreground">Chargement…</p> : vehicles.length === 0 ? <Empty text="Aucun transport." /> : (
          <div className="grid gap-3">
            {vehicles.map((veh) => <VehicleAdminRow key={veh.id} veh={veh} password={password} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function AccommodationAdminRow({ acc, password }: { acc: Accommodation; password: string }) {
  const [places, setPlaces] = useState(acc.places_disponibles ?? acc.capacite)
  const [price, setPrice] = useState(Number(acc.prix_personne_nuit || 0))
  const [active, setActive] = useState(acc.actif !== false)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await adminPatchAccommodation(password, acc.id, {
        places_disponibles: places,
        capacite: Math.max(acc.capacite || 0, places),
        prix_personne_nuit: price,
        actif: active,
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
    <div className="rounded-2xl border border-[#6D1925]/10 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#4B242B]">{acc.nom}</p>
          <p className="mt-0.5 text-xs text-[#6D1925]/55">{acc.propose_par || acc.contact || "Sans contact"} · {acc.adresse || "Adresse non renseignée"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <SmallField title="Places"><input className={field + " w-24"} type="number" min={0} value={places} onChange={(e) => setPlaces(Math.max(0, Number(e.target.value) || 0))} /></SmallField>
          <SmallField title="€ / pers. / nuit"><input className={field + " w-28"} type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} /></SmallField>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#6D1925]/10 px-3 text-xs font-medium"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Visible</label>
          <button onClick={save} disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#6D1925] px-3 text-xs font-semibold text-[#FFF7E9]"><Save className="h-3.5 w-3.5" /> {saving ? "…" : "Enregistrer"}</button>
          <button onClick={remove} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-red-700"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  )
}

function VehicleAdminRow({ veh, password }: { veh: Vehicle; password: string }) {
  const [places, setPlaces] = useState(veh.places_disponibles ?? veh.places)
  const [price, setPrice] = useState(Number(veh.participation || 0))
  const [free, setFree] = useState(veh.gratuit)
  const [active, setActive] = useState(veh.actif !== false)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await adminPatchVehicle(password, veh.id, {
        places_disponibles: places,
        places: Math.max(veh.places || 0, places),
        gratuit: free,
        participation: free ? 0 : price,
        actif: active,
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
    <div className="rounded-2xl border border-[#6D1925]/10 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#4B242B]">{veh.conducteur}</p>
          <p className="mt-0.5 text-xs text-[#6D1925]/55">{veh.type_trajet === "navette" ? "Navette locale" : "Covoiturage"} · {veh.ville_depart || veh.lieu_depart || "Départ non renseigné"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <SmallField title="Places"><input className={field + " w-24"} type="number" min={0} value={places} onChange={(e) => setPlaces(Math.max(0, Number(e.target.value) || 0))} /></SmallField>
          <SmallField title="Participation €"><input disabled={free} className={field + " w-28 disabled:opacity-40"} type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))} /></SmallField>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#6D1925]/10 px-3 text-xs font-medium"><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> Gratuit</label>
          <label className="flex min-h-10 items-center gap-2 rounded-lg border border-[#6D1925]/10 px-3 text-xs font-medium"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Visible</label>
          <button onClick={save} disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#6D1925] px-3 text-xs font-semibold text-[#FFF7E9]"><Save className="h-3.5 w-3.5" /> {saving ? "…" : "Enregistrer"}</button>
          <button onClick={remove} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-red-700"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  )
}

function SmallField({ title, children }: { title: string; children: React.ReactNode }) {
  return <label><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6D1925]/55">{title}</span>{children}</label>
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#6D1925]/15 bg-white/45 p-8 text-center text-sm text-[#6D1925]/50">{text}</div>
}
