"use client"

export type NamedPerson = { firstName: string; lastName: string; kind: "adult" | "child" }
export function personLabel(person: NamedPerson) { return `${person.firstName.trim()} ${person.lastName.trim()}${person.kind === "child" ? " (enfant)" : ""}` }
export function NamedPeople({ value, onChange, title }: { value: NamedPerson[]; onChange: (value: NamedPerson[]) => void; title: string }) {
  function update(index: number, patch: Partial<NamedPerson>) { onChange(value.map((person, i) => i === index ? { ...person, ...patch } : person)) }
  return <div className="space-y-3 rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4">
    <p className="text-sm font-semibold text-[#6D1925]">{title}</p>
    {value.map((person, index) => <div key={index} className="grid gap-2 rounded-xl bg-[#FFF7E9] p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
      <input className="rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" aria-label={`Prénom personne ${index + 1}`} placeholder="Prénom *" maxLength={60} value={person.firstName} onChange={(event) => update(index, { firstName: event.target.value })} />
      <input className="rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" aria-label={`Nom personne ${index + 1}`} placeholder="Nom *" maxLength={60} value={person.lastName} onChange={(event) => update(index, { lastName: event.target.value })} />
      <select className="rounded-lg border border-[#6D1925]/15 bg-white p-2 text-sm" aria-label={`Âge personne ${index + 1}`} value={person.kind} onChange={(event) => update(index, { kind: event.target.value as NamedPerson["kind"] })}><option value="adult">Adulte</option><option value="child">Enfant</option></select>
      <button type="button" className="rounded-lg px-2 text-sm text-[#6D1925] underline" onClick={() => onChange(value.filter((_, i) => i !== index))}>Retirer</button>
    </div>)}
    <button type="button" onClick={() => onChange([...value, { firstName: "", lastName: "", kind: "adult" }])} className="min-h-11 rounded-xl border border-[#6D1925]/20 px-4 text-sm font-semibold text-[#6D1925]">+ Ajouter une personne</button>
  </div>
}
