"use client"

import { useEffect, useId, useState } from "react"

type Suggestion = { fulltext: string; city?: string }
export function AddressPicker({ value, onChange, city, className, label }: { value: string; onChange: (value: string) => void; city?: string; className: string; label: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const listId = useId()
  useEffect(() => {
    if (!open || value.trim().length < 3) { return }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ text: `${value.trim()} ${city ?? ""}`, type: "StreetAddress", maximumResponses: "6" })
        const response = await fetch(`https://data.geopf.fr/geocodage/completion/?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error("address_lookup_failed")
        const payload = await response.json() as { results?: Suggestion[] }
        setSuggestions((payload.results ?? []).filter((item) => item.fulltext && (!city || !item.city || item.city.toLocaleLowerCase("fr") === city.toLocaleLowerCase("fr"))))
      } catch { if (!controller.signal.aborted) setSuggestions([]) }
    }, 350)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [value, city, open])
  return <div className="relative"><input role="combobox" aria-label={label} aria-controls={listId} aria-expanded={open && suggestions.length > 0} autoComplete="off" className={className} placeholder="Numéro, rue ou gare…" value={value} onChange={(event) => { onChange(event.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} />
    {open && suggestions.length > 0 && <div id={listId} role="listbox" className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-[#6D1925]/15 bg-white p-1 shadow-xl">{suggestions.map((item) => <button type="button" role="option" aria-selected={false} key={item.fulltext} className="block w-full rounded-lg p-2 text-left text-sm hover:bg-[#FFF7E9]" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(item.fulltext); setOpen(false); setSuggestions([]) }}>{item.fulltext}</button>)}</div>}
  </div>
}
