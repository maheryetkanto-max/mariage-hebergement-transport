"use client"

import type { Gender } from "@/lib/types"

export type Owner = { firstName: string; lastName: string }
export type OwnerNames = { single: Owner; man: Owner; woman: Owner }
export const emptyOwnerNames = (): OwnerNames => ({
  single: { firstName: "", lastName: "" },
  man: { firstName: "", lastName: "" },
  woman: { firstName: "", lastName: "" },
})

export function ownerIsComplete(gender: Gender, names: OwnerNames) {
  const complete = (person: Owner) => !!person.firstName.trim() && !!person.lastName.trim()
  return gender === "homme_et_femme" ? complete(names.man) && complete(names.woman) : complete(names.single)
}

export function ownerFullNames(gender: Gender, names: OwnerNames) {
  const full = (person: Owner) => `${person.firstName.trim()} ${person.lastName.trim()}`
  return gender === "homme_et_femme" ? `${full(names.man)} et ${full(names.woman)}` : full(names.single)
}

export function ownerFirstNames(fullName: string, gender: Gender | null) {
  if (gender !== "homme_et_femme") return fullName.trim().split(/\s+/)[0] ?? fullName
  const [man, woman] = fullName.split(/\s+et\s+/i)
  return woman ? `${man.trim().split(/\s+/)[0]} et ${woman.trim().split(/\s+/)[0]}` : fullName
}

export function OwnerFields({ gender, names, onChange }: {
  gender: Gender; names: OwnerNames; onChange: (names: OwnerNames) => void
}) {
  const people: { key: keyof OwnerNames; title: string }[] = gender === "homme_et_femme"
    ? [{ key: "man", title: "Homme" }, { key: "woman", title: "Femme" }]
    : [{ key: "single", title: gender === "homme" ? "Homme" : "Femme" }]
  const field = "w-full rounded-xl border border-[#6D1925]/15 bg-white px-3 py-2.5 text-sm"
  return <div className="grid gap-3 sm:grid-cols-2">
    {people.map(({ key, title }) => <div key={key} className="rounded-xl bg-white/70 p-3">
      <p className="mb-2 text-sm font-semibold text-[#6D1925]">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs">Prénom *<input className={field} required aria-label={`Prénom ${title.toLowerCase()}`} value={names[key].firstName} onChange={(event) => onChange({ ...names, [key]: { ...names[key], firstName: event.target.value } })} /></label>
        <label className="text-xs">Nom *<input className={field} required aria-label={`Nom ${title.toLowerCase()}`} value={names[key].lastName} onChange={(event) => onChange({ ...names, [key]: { ...names[key], lastName: event.target.value } })} /></label>
      </div>
    </div>)}
  </div>
}
