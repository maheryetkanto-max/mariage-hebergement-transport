"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { saveVehicle } from "@/lib/data"
import type { Vehicle } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FormState {
  conducteur: string
  telephone: string
  lieu_depart: string
  heure_depart: string
  places: number
  commentaires: string
}

const empty: FormState = {
  conducteur: "",
  telephone: "",
  lieu_depart: "",
  heure_depart: "",
  places: 4,
  commentaires: "",
}

export function VehicleDialog({
  open,
  onOpenChange,
  vehicle,
  minPlaces = 0,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle: Vehicle | null
  minPlaces?: number
}) {
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        vehicle
          ? {
              conducteur: vehicle.conducteur,
              telephone: vehicle.telephone ?? "",
              lieu_depart: vehicle.lieu_depart ?? "",
              heure_depart: vehicle.heure_depart ?? "",
              places: vehicle.places,
              commentaires: vehicle.commentaires ?? "",
            }
          : empty,
      )
    }
  }, [open, vehicle])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.conducteur.trim()) {
      toast.error("Le nom du conducteur est obligatoire.")
      return
    }
    if (form.places < minPlaces) {
      toast.error(`Le nombre de places ne peut pas être inférieur à ${minPlaces} (déjà occupées).`)
      return
    }
    setSaving(true)
    try {
      await saveVehicle({ id: vehicle?.id, ...form })
      toast.success(vehicle ? "Voiture modifiée." : "Voiture ajoutée.")
      onOpenChange(false)
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement.")
      console.error("[v0] saveVehicle error:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Modifier la voiture" : "Ajouter une voiture"}</DialogTitle>
          <DialogDescription>Renseignez le conducteur et le trajet proposé.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="conducteur">Conducteur *</Label>
              <Input
                id="conducteur"
                value={form.conducteur}
                onChange={(e) => update("conducteur", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tel">Téléphone</Label>
              <Input
                id="tel"
                type="tel"
                value={form.telephone}
                onChange={(e) => update("telephone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="depart">Lieu de départ</Label>
              <Input
                id="depart"
                value={form.lieu_depart}
                onChange={(e) => update("lieu_depart", e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="heure">Heure de départ</Label>
              <Input
                id="heure"
                type="time"
                value={form.heure_depart}
                onChange={(e) => update("heure_depart", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="places">Nombre de places passagers</Label>
            <Input
              id="places"
              type="number"
              min={minPlaces}
              value={form.places}
              onChange={(e) => update("places", Number.parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="comm">Commentaires</Label>
            <Textarea
              id="comm"
              value={form.commentaires}
              onChange={(e) => update("commentaires", e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
