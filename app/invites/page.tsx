"use client"

import { useMemo, useState } from "react"
import { Pencil, Plus, Search, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import {
  accommodationOccupancy,
  assignGuestAccommodation,
  assignGuestVehicle,
  deleteGuest,
  useAccommodations,
  useGuests,
  useVehicles,
  vehicleOccupancy,
} from "@/lib/data"
import type { Guest } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { GuestDialog } from "@/components/invites/guest-dialog"
import { ConfirmDelete } from "@/components/confirm-delete"
import { AssignSelect, type AssignOption } from "@/components/assign-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type YesNoFilter = "all" | "yes" | "no"

export default function InvitesPage() {
  const { data: guests = [], isLoading } = useGuests()
  const { data: accommodations = [] } = useAccommodations()
  const { data: vehicles = [] } = useVehicles()

  const [search, setSearch] = useState("")
  const [hebFilter, setHebFilter] = useState<YesNoFilter>("all")
  const [trFilter, setTrFilter] = useState<YesNoFilter>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Guest | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return guests.filter((g) => {
      const name = `${g.prenom ?? ""} ${g.nom}`.toLowerCase()
      const matchSearch =
        !q ||
        name.includes(q) ||
        (g.telephone ?? "").toLowerCase().includes(q) ||
        (g.point_depart ?? "").toLowerCase().includes(q)
      const matchHeb =
        hebFilter === "all" || (hebFilter === "yes") === g.besoin_hebergement
      const matchTr =
        trFilter === "all" || (trFilter === "yes") === g.besoin_transport
      return matchSearch && matchHeb && matchTr
    })
  }, [guests, search, hebFilter, trFilter])

  function accommodationOptions(guest: Guest): AssignOption[] {
    return accommodations
      .map((a) => {
        const { remaining } = accommodationOccupancy(a, guests)
        return { a, remaining }
      })
      .filter(({ a, remaining }) => a.id === guest.accommodation_id || remaining >= guest.nb_personnes)
      .map(({ a, remaining }) => ({
        value: a.id,
        label: `${a.nom} · ${remaining} place${remaining > 1 ? "s" : ""}`,
      }))
  }

  function vehicleOptions(guest: Guest): AssignOption[] {
    return vehicles
      .map((v) => {
        const { remaining } = vehicleOccupancy(v, guests)
        return { v, remaining }
      })
      .filter(({ v, remaining }) => v.id === guest.vehicle_id || remaining >= guest.nb_personnes)
      .map(({ v, remaining }) => ({
        value: v.id,
        label: `${v.conducteur} · ${remaining} place${remaining > 1 ? "s" : ""}`,
      }))
  }

  async function handleAssignHeb(guest: Guest, accId: string | null) {
    try {
      await assignGuestAccommodation(guest.id, accId)
      toast.success(accId ? "Hébergement affecté." : "Hébergement retiré.")
    } catch (err) {
      toast.error("Erreur lors de l'affectation.")
      console.error("[v0] assign heb error:", err)
    }
  }

  async function handleAssignTr(guest: Guest, vehId: string | null) {
    try {
      await assignGuestVehicle(guest.id, vehId)
      toast.success(vehId ? "Transport affecté." : "Transport retiré.")
    } catch (err) {
      toast.error("Erreur lors de l'affectation.")
      console.error("[v0] assign tr error:", err)
    }
  }

  function openAdd() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(g: Guest) {
    setEditing(g)
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Invités"
        description="Gérez la liste des invités, leurs besoins et leurs affectations."
      >
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un invité…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <FilterSelect
            label="Hébergement"
            value={hebFilter}
            onChange={setHebFilter}
          />
          <FilterSelect label="Transport" value={trFilter} onChange={setTrFilter} />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : filtered.length === 0 ? (
        <EmptyState hasGuests={guests.length > 0} onAdd={openAdd} />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden p-0 lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invité</TableHead>
                    <TableHead className="text-center">Pers.</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Hébergement</TableHead>
                    <TableHead>Transport</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {[g.prenom, g.nom].filter(Boolean).join(" ")}
                        </div>
                        {g.point_depart && (
                          <div className="text-xs text-muted-foreground">
                            Départ : {g.point_depart}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{g.nb_personnes}</TableCell>
                      <TableCell className="text-muted-foreground">{g.telephone || "—"}</TableCell>
                      <TableCell>
                        {g.besoin_hebergement ? (
                          <AssignSelect
                            value={g.accommodation_id}
                            onChange={(v) => handleAssignHeb(g, v)}
                            options={accommodationOptions(g)}
                            className="w-full min-w-[170px]"
                          />
                        ) : (
                          <Badge variant="secondary">Non requis</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {g.besoin_transport ? (
                          <AssignSelect
                            value={g.vehicle_id}
                            onChange={(v) => handleAssignTr(g, v)}
                            options={vehicleOptions(g)}
                            className="w-full min-w-[170px]"
                          />
                        ) : (
                          <Badge variant="secondary">Non requis</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(g)} aria-label="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(g)}
                            aria-label="Supprimer"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {filtered.map((g) => (
              <Card key={g.id} className="gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-foreground">
                      {[g.prenom, g.nom].filter(Boolean).join(" ")}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {g.nb_personnes} pers.
                      </span>
                      {g.telephone && <span>{g.telephone}</span>}
                    </div>
                    {g.point_depart && (
                      <div className="text-xs text-muted-foreground">Départ : {g.point_depart}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(g)} aria-label="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(g)}
                      aria-label="Supprimer"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Hébergement</span>
                    {g.besoin_hebergement ? (
                      <AssignSelect
                        value={g.accommodation_id}
                        onChange={(v) => handleAssignHeb(g, v)}
                        options={accommodationOptions(g)}
                        className="w-full"
                      />
                    ) : (
                      <Badge variant="secondary" className="w-fit">Non requis</Badge>
                    )}
                  </div>
                  <div className="grid gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Transport</span>
                    {g.besoin_transport ? (
                      <AssignSelect
                        value={g.vehicle_id}
                        onChange={(v) => handleAssignTr(g, v)}
                        options={vehicleOptions(g)}
                        className="w-full"
                      />
                    ) : (
                      <Badge variant="secondary" className="w-fit">Non requis</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        {filtered.length} invité{filtered.length > 1 ? "s" : ""} affiché
        {filtered.length > 1 ? "s" : ""} sur {guests.length}
      </p>

      <GuestDialog open={dialogOpen} onOpenChange={setDialogOpen} guest={editing} />
      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer cet invité ?"
        description={`${deleteTarget ? [deleteTarget.prenom, deleteTarget.nom].filter(Boolean).join(" ") : ""} sera définitivement supprimé.`}
        onConfirm={async () => {
          if (!deleteTarget) return
          try {
            await deleteGuest(deleteTarget.id)
            toast.success("Invité supprimé.")
          } catch (err) {
            toast.error("Erreur lors de la suppression.")
            console.error("[v0] delete guest error:", err)
          }
        }}
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: YesNoFilter
  onChange: (v: YesNoFilter) => void
}) {
  return (
    <Select value={value} onValueChange={(v: unknown) => onChange(v as YesNoFilter)}>
      <SelectTrigger className="min-w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label} : tous</SelectItem>
        <SelectItem value="yes">{label} : oui</SelectItem>
        <SelectItem value="no">{label} : non</SelectItem>
      </SelectContent>
    </Select>
  )
}

function EmptyState({ hasGuests, onAdd }: { hasGuests: boolean; onAdd: () => void }) {
  return (
    <Card className="items-center gap-3 py-12 text-center">
      <Users className="h-10 w-10 text-muted-foreground/50" />
      <div>
        <p className="font-medium">{hasGuests ? "Aucun résultat" : "Aucun invité pour le moment"}</p>
        <p className="text-sm text-muted-foreground">
          {hasGuests
            ? "Essayez de modifier votre recherche ou vos filtres."
            : "Commencez par ajouter votre premier invité."}
        </p>
      </div>
      {!hasGuests && (
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" /> Ajouter un invité
        </Button>
      )}
    </Card>
  )
}
