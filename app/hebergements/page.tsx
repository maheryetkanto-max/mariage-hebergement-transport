"use client"

import { useState } from "react"
import { BedDouble, MapPin, Pencil, Phone, Plus, Trash2, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import {
  accommodationOccupancy,
  assignGuestAccommodation,
  deleteAccommodation,
  guestsForAccommodation,
  useAccommodations,
  useGuests,
} from "@/lib/data"
import type { Accommodation } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { AccommodationDialog } from "@/components/hebergements/accommodation-dialog"
import { ConfirmDelete } from "@/components/confirm-delete"
import { AssignSelect, type AssignOption } from "@/components/assign-select"
import { CapacityBar } from "@/components/capacity-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function HebergementsPage() {
  const { data: accommodations = [], isLoading } = useAccommodations()
  const { data: guests = [] } = useGuests()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Accommodation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Accommodation | null>(null)

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(a: Accommodation) {
    setEditing(a)
    setDialogOpen(true)
  }

  // Guests that still need lodging and are not yet assigned anywhere.
  function unassignedNeedingLodging(remaining: number): AssignOption[] {
    return guests
      .filter((g) => g.besoin_hebergement && !g.accommodation_id && g.nb_personnes <= remaining)
      .map((g) => ({
        value: g.id,
        label: `${[g.prenom, g.nom].filter(Boolean).join(" ")} (${g.nb_personnes})`,
      }))
  }

  async function addGuest(guestId: string | null, accId: string) {
    if (!guestId) return
    try {
      await assignGuestAccommodation(guestId, accId)
      toast.success("Invité affecté à l'hébergement.")
    } catch (err) {
      toast.error("Erreur lors de l'affectation.")
      console.error("[v0] add guest to accommodation error:", err)
    }
  }

  async function removeGuest(guestId: string) {
    try {
      await assignGuestAccommodation(guestId, null)
      toast.success("Invité retiré de l'hébergement.")
    } catch (err) {
      toast.error("Erreur lors du retrait.")
      console.error("[v0] remove guest error:", err)
    }
  }

  const minCapacite = editing ? accommodationOccupancy(editing, guests).occupied : 0

  return (
    <div>
      <PageHeader
        title="Hébergements"
        description="Logements disponibles et personnes affectées à chacun."
      >
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : accommodations.length === 0 ? (
        <Card className="items-center gap-3 py-12 text-center">
          <BedDouble className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">Aucun hébergement</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez les logements disponibles pour vos invités.
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Ajouter un hébergement
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accommodations.map((acc) => {
            const { occupied, remaining } = accommodationOccupancy(acc, guests)
            const assigned = guestsForAccommodation(acc.id, guests)
            const options = unassignedNeedingLodging(remaining)
            return (
              <Card key={acc.id} className="gap-4">
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-serif text-xl font-semibold">{acc.nom}</h3>
                      <Badge variant="outline">{acc.type}</Badge>
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {acc.adresse && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> {acc.adresse}
                        </p>
                      )}
                      {acc.contact && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 shrink-0" /> {acc.contact}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(acc)} aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(acc)}
                      aria-label="Supprimer"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <CapacityBar occupied={occupied} total={acc.capacite} />

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Personnes affectées ({assigned.length})
                    </span>
                    {assigned.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune personne affectée.</p>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {assigned.map((g) => (
                          <li
                            key={g.id}
                            className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-sm"
                          >
                            <span>
                              {[g.prenom, g.nom].filter(Boolean).join(" ")}
                              <span className="ml-1 text-xs text-muted-foreground">
                                · {g.nb_personnes} pers.
                              </span>
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeGuest(g.id)}
                              aria-label="Retirer"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {remaining > 0 ? (
                    options.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <AssignSelect
                          value={null}
                          onChange={(v) => addGuest(v, acc.id)}
                          options={options}
                          placeholder="Affecter un invité…"
                          noneLabel="— Choisir —"
                          className="w-full"
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Aucun invité en attente ne rentre dans les {remaining} place
                        {remaining > 1 ? "s" : ""} restantes.
                      </p>
                    )
                  ) : (
                    <Badge variant="secondary" className="w-fit">
                      Hébergement complet
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AccommodationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accommodation={editing}
        minCapacite={minCapacite}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer cet hébergement ?"
        description={`${deleteTarget?.nom ?? ""} sera supprimé et les invités affectés seront libérés.`}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteAccommodation(deleteTarget.id)
            toast.success("Hébergement supprimé.")
          } catch (err) {
            toast.error("Erreur lors de la suppression.")
            console.error("[v0] delete accommodation error:", err)
          }
        }}
      />
    </div>
  )
}
