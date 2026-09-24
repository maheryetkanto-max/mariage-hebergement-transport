"use client"

import { useState } from "react"
import { Car, Clock, MapPin, Pencil, Phone, Plus, Trash2, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import {
  assignGuestVehicle,
  deleteVehicle,
  guestsForVehicle,
  useGuests,
  useVehicles,
  vehicleOccupancy,
} from "@/lib/data"
import type { Vehicle } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { VehicleDialog } from "@/components/transports/vehicle-dialog"
import { ConfirmDelete } from "@/components/confirm-delete"
import { AssignSelect, type AssignOption } from "@/components/assign-select"
import { CapacityBar } from "@/components/capacity-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function TransportsPage() {
  const { data: vehicles = [], isLoading } = useVehicles()
  const { data: guests = [] } = useGuests()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(v: Vehicle) {
    setEditing(v)
    setDialogOpen(true)
  }

  function unassignedNeedingTransport(remaining: number): AssignOption[] {
    return guests
      .filter((g) => g.besoin_transport && !g.vehicle_id && g.nb_personnes <= remaining)
      .map((g) => ({
        value: g.id,
        label: `${[g.prenom, g.nom].filter(Boolean).join(" ")} (${g.nb_personnes})`,
      }))
  }

  async function addGuest(guestId: string | null, vehId: string) {
    if (!guestId) return
    try {
      await assignGuestVehicle(guestId, vehId)
      toast.success("Invité affecté à la voiture.")
    } catch (err) {
      toast.error("Erreur lors de l'affectation.")
      console.error("[v0] add guest to vehicle error:", err)
    }
  }

  async function removeGuest(guestId: string) {
    try {
      await assignGuestVehicle(guestId, null)
      toast.success("Invité retiré de la voiture.")
    } catch (err) {
      toast.error("Erreur lors du retrait.")
      console.error("[v0] remove guest from vehicle error:", err)
    }
  }

  const minPlaces = editing ? vehicleOccupancy(editing, guests).occupied : 0

  return (
    <div>
      <PageHeader
        title="Transports"
        description="Voitures et trajets proposés, avec les passagers affectés."
      >
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : vehicles.length === 0 ? (
        <Card className="items-center gap-3 py-12 text-center">
          <Car className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">Aucune voiture</p>
            <p className="text-sm text-muted-foreground">
              Ajoutez les trajets et voitures disponibles pour vos invités.
            </p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Ajouter une voiture
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((veh) => {
            const { occupied, remaining } = vehicleOccupancy(veh, guests)
            const passengers = guestsForVehicle(veh.id, guests)
            const options = unassignedNeedingTransport(remaining)
            return (
              <Card key={veh.id} className="gap-4">
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-0">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-xl font-semibold">{veh.conducteur}</h3>
                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {veh.telephone && (
                        <p className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 shrink-0" /> {veh.telephone}
                        </p>
                      )}
                      {veh.lieu_depart && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> {veh.lieu_depart}
                        </p>
                      )}
                      {veh.heure_depart && (
                        <p className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0" /> Départ à {veh.heure_depart}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(veh)} aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(veh)}
                      aria-label="Supprimer"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <CapacityBar occupied={occupied} total={veh.places} />

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Passagers ({passengers.length})
                    </span>
                    {passengers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun passager affecté.</p>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {passengers.map((g) => (
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
                          onChange={(v) => addGuest(v, veh.id)}
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
                      Voiture complète
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicle={editing}
        minPlaces={minPlaces}
      />
      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer cette voiture ?"
        description={`Le trajet de ${deleteTarget?.conducteur ?? ""} sera supprimé et les passagers seront libérés.`}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteVehicle(deleteTarget.id)
            toast.success("Voiture supprimée.")
          } catch (err) {
            toast.error("Erreur lors de la suppression.")
            console.error("[v0] delete vehicle error:", err)
          }
        }}
      />
    </div>
  )
}
