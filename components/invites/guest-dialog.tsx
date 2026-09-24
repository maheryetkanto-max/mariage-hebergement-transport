"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { saveGuest } from "@/lib/data"
import type { Guest } from "@/lib/types"
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
import { Switch } from "@/components/ui/switch"

interface FormState {
  nom: string
  prenom: string
  nb_personnes: number
  telephone: string
  besoin_hebergement: boolean
  besoin_transport: boolean
  point_depart: string
  commentaires: string
}

const empty: FormState = {
  nom: "",
  prenom: "",
  nb_personnes: 1,
  telephone: "",
  besoin_hebergement: false,
  besoin_transport: false,
  point_depart: "",
  commentaires: "",
}

export function GuestDialog({
  open,
  onOpenChange,
  guest,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  guest: Guest | null
}) {
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        guest
          ? {
              nom: guest.nom,
              prenom: guest.prenom ?? "",
              nb_personnes: guest.nb_personnes,
              telephone: guest.telephone ?? "",
              besoin_hebergement: guest.besoin_hebergement,
              besoin_transport: guest.besoin_transport,
              point_depart: guest.point_depart ?? "",
              commentaires: guest.commentaires ?? "",
            }
          : empty,
      )
    }
  }, [open, guest])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire.")
      return
    }
    setSaving(true)
    try {
      await saveGuest({ id: guest?.id, ...form, nb_personnes: Math.max(1, form.nb_personnes) })
      toast.success(guest ? "Invité modifié." : "Invité ajouté.")
      onOpenChange(false)
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement.")
      console.error("[v0] saveGuest error:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{guest ? "Modifier l'invité" : "Ajouter un invité"}</DialogTitle>
          <DialogDescription>
            Renseignez les informations et les besoins de l&apos;invité.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => update("nom", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={form.prenom}
                onChange={(e) => update("prenom", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nb">Nombre de personnes</Label>
              <Input
                id="nb"
                type="number"
                min={1}
                value={form.nb_personnes}
                onChange={(e) => update("nb_personnes", Number.parseInt(e.target.value) || 1)}
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

          <div className="grid gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="besoin_heb" className="cursor-pointer">
                Besoin d&apos;hébergement
              </Label>
              <Switch
                id="besoin_heb"
                checked={form.besoin_hebergement}
                onCheckedChange={(v) => update("besoin_hebergement", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="besoin_tr" className="cursor-pointer">
                Besoin de transport
              </Label>
              <Switch
                id="besoin_tr"
                checked={form.besoin_transport}
                onCheckedChange={(v) => update("besoin_transport", v)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="depart">Point de départ</Label>
            <Input
              id="depart"
              value={form.point_depart}
              onChange={(e) => update("point_depart", e.target.value)}
              placeholder="Ville / lieu de départ"
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
