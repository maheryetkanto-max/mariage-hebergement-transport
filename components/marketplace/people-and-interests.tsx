"use client"

export const INTERESTS = [
  { value: "Musique", emoji: "🎵" },
  { value: "Lecture", emoji: "📚" },
  { value: "Instruments", emoji: "🎸" },
  { value: "Voyages", emoji: "🌍" },
  { value: "Cuisine", emoji: "🍳" },
  { value: "Jeux", emoji: "🎲" },
  { value: "Danse", emoji: "💃" },
  { value: "Animaux", emoji: "🐶" },
]

export function InterestChoices({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return <fieldset className="rounded-2xl border border-[#6D1925]/10 bg-white/70 p-4">
    <legend className="px-1 text-sm font-semibold text-[#6D1925]">Ce que j’aime (facultatif)</legend>
    <div className="flex flex-wrap gap-2">{INTERESTS.map(({ value: interest, emoji }) => <label key={interest} className={`cursor-pointer rounded-full border px-3 py-2 text-xs ${value.includes(interest) ? "border-[#6D1925] bg-[#6D1925] text-white" : "border-[#6D1925]/15 bg-[#FFF7E9] text-[#6D1925]"}`}><input className="sr-only" type="checkbox" checked={value.includes(interest)} onChange={() => onChange(value.includes(interest) ? value.filter((v) => v !== interest) : [...value, interest])} />{emoji} {interest}</label>)}</div>
  </fieldset>
}

export function PeopleList({ people }: { people: { name: string; origin: string | null; interests: string[] }[] }) {
  return <div className="space-y-2">{people.map((person, i) => <div key={`${person.name}-${i}`} className="rounded-xl bg-[#FFF7E9] p-3 text-sm"><strong className="text-[#6D1925]">🙂 {person.name}</strong>{person.origin && <span className="ml-2 text-xs text-[#6D1925]/65">📍 {person.origin}</span>}{person.interests?.length > 0 && <p className="mt-1 text-xs text-[#5B4549]">{person.name} aime : {person.interests.map((value) => `${INTERESTS.find((item) => item.value === value)?.emoji ?? "✨"} ${value}`).join(" · ")}</p>}</div>)}</div>
}
