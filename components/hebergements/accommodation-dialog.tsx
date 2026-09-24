"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { saveAccommodation } from "@/lib/data"
import { ACCOMMODATION_TYPES, type Accommodation, type AccommodationType } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FormState {
  nom: string
  type: AccommodationType
  adresse: string
  capacite: number
  contact: string
  commentaires: string
}

const empty: FormState = {
  nom: "",
  type: "Autre",
  adresse: "",
  capacite: 1,
  contact: "",
  commentaires: "",
}

export function AccommodationDialog({
  open,
  onOpenChange,
  accommodation,
  minCapacite = 0,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  accommodation: Accommodation | null
  minCapacite?: number
}) {
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        accommodation
          ? {
              nom: accommodation.nom,
              type: accommodation.type,
              adresse: accommodation.adresse ?? "",
              capacite: accommodation.capacite,
              contact: accommodation.contact ?? "",
              commentaires: accommodation.commentaires ?? "",
            }
          : empty,
      )
    }
  }, [open, accommodation])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire.")
      return
    }
    if (form.capacite < minCapacite) {
      toast.error(`La capacité ne peut pas être inférieure à ${minCapacite} (places déjà occupées).`)
      return
    }
    setSaving(true)
    try {
      await saveAccommodation({ id: accommodation?.id, ...form })
      toast.success(accommodation ? "Hébergement modifié." : "Hébergement ajouté.")
      onOpenChange(false)
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement.")
      console.error("[v0] saveAccommodation error:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {accommodation ? "Modifier l'hébergement" : "Ajouter un hébergement"}
          </DialogTitle>
          <DialogDescription>Renseignez les détails du logement disponible.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nom">Nom de l&apos;hébergement *</Label>
            <Input id="nom" value={form.nom} onChange={(e) => update("nom", e.target.value)} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: unknown) => update("type", v as AccommodationType)}
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOMMODATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="capacite">Capacité totale</Label>
              <Input
                id="capacite"
                type="number"
                min={minCapacite}
                value={form.capacite}
                onChange={(e) => update("capacite", Number.parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={form.adresse}
              onChange={(e) => update("adresse", e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="contact">Contact / responsable</Label>
            <Input
              id="contact"
              value={form.contact}
              onChange={(e) => update("contact", e.target.value)}
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
