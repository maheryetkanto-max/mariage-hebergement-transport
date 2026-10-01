"use client"

import { FrenchPhone } from "@/components/marketplace/french-phone"

export type NamedPerson = {
  firstName: string
  lastName: string
  kind: "adult" | "child"
  gender?: "homme" | "femme"
  phone?: string
}

export function personLabel(person: NamedPerson) {
  const gender = person.gender ? ` (${person.gender})` : ""
  const child = person.kind === "child" ? " · enfant" : ""
  return `${person.firstName.trim()} ${person.lastName.trim()}${gender}${child}`
}

export function NamedPeople({
  value,
  onChange,
  title,
  collectContact = false,
}: {
  value: NamedPerson[]
  onChange: (value: NamedPerson[]) => void
  title: string
  collectContact?: boolean
}) {
  function update(index: number, patch: Partial<NamedPerson>) {
    onChange(value.map((person, i) => i === index ? { ...person, ...patch } : person))
  }

  return <div className="space-y-3 rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4">
    <p className="text-sm font-semibold text-[#6D1925]">{title}</p>
    {value.map((person, index) => <div key={index} className={`grid gap-2 rounded-xl bg-[#FFF7E9] p-3 ${collectContact ? "sm:grid-cols-2" : "sm:grid-cols-[1fr_1fr_auto_auto]"}`}>
      <input className="rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" aria-label={`Prénom personne ${index + 1}`} placeholder="Prénom *" maxLength={60} value={person.firstName} onChange={(event) => update(index, { firstName: event.target.value })} />
      <input className="rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" aria-label={`Nom personne ${index + 1}`} placeholder="Nom *" maxLength={60} value={person.lastName} onChange={(event) => update(index, { lastName: event.target.value })} />
      <select className="rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" aria-label={`Âge personne ${index + 1}`} value={person.kind} onChange={(event) => update(index, { kind: event.target.value as NamedPerson["kind"] })}>
        <option value="adult">Adulte</option>
        <option value="child">Enfant</option>
      </select>
      {collectContact && <>
        <select className="rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" aria-label={`Sexe personne ${index + 1}`} value={person.gender ?? ""} onChange={(event) => update(index, { gender: event.target.value as "homme" | "femme" })}>
          <option value="">Sexe *</option>
          <option value="femme">👩 Femme</option>
          <option value="homme">👨 Homme</option>
        </select>
        <div className="sm:col-span-2">
          <FrenchPhone className="w-full rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" value={person.phone ?? "+33"} onChange={(phone) => update(index, { phone })} />
          <p className="mt-1 text-[11px] text-[#6D1925]/55">Téléphone de cette personne *</p>
        </div>
      </>}
      <button type="button" className={`rounded-lg px-2 text-sm text-[#6D1925] underline ${collectContact ? "sm:col-span-2 justify-self-start" : ""}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>Retirer</button>
    </div>)}
    {!collectContact && <button type="button" onClick={() => onChange([...value, { firstName: "", lastName: "", kind: "adult" }])} className="min-h-11 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">+ Ajouter une personne</button>}
  </div>
}
