"use client"

import { useId, useMemo, useState } from "react"
import ileDeFrance from "@/data/communes-idf.json"
import aube from "@/data/communes-aube.json"

export type CityArea = "idf" | "aube" | "idf-aube"

const cities = {
  idf: ileDeFrance,
  aube,
  "idf-aube": [...ileDeFrance, ...aube],
}

export function normalizeCity(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("fr")
}

export function isListedCity(value: string, area: CityArea) {
  return cities[area].some((city) => normalizeCity(city.name) === normalizeCity(value))
}

export function idfDepartment(value: string) {
  const city = ileDeFrance.find((entry) => normalizeCity(entry.name) === normalizeCity(value))
  return city?.code.slice(0, 2) ?? null
}

export function CityPicker({ value, onChange, area, placeholder, className, label }: {
  value: string
  onChange: (value: string) => void
  area: CityArea
  placeholder: string
  className: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const id = useId()
  const suggestions = useMemo(() => {
    const query = normalizeCity(value)
    const matches = cities[area].filter((city) => !query || normalizeCity(city.name).includes(query))
    return matches.sort((a, b) => {
      const aStarts = normalizeCity(a.name).startsWith(query) ? 0 : 1
      const bStarts = normalizeCity(b.name).startsWith(query) ? 0 : 1
      return aStarts - bStarts || a.name.localeCompare(b.name, "fr")
    }).slice(0, query ? undefined : 10)
  }, [area, value])

  return <div className="relative">
    <input
      type="text"
      role="combobox"
      autoComplete="off"
      aria-label={label}
      aria-autocomplete="list"
      aria-expanded={open && suggestions.length > 0}
      aria-controls={id}
      className={className}
      placeholder={placeholder}
      value={value}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      onChange={(event) => { onChange(event.target.value); setOpen(true); setActive(0) }}
      onKeyDown={(event) => {
        if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((index) => Math.min(index + 1, suggestions.length - 1)) }
        if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)) }
        if (event.key === "Escape") setOpen(false)
        if (event.key === "Enter" && open && suggestions.length) {
          event.preventDefault()
          onChange(suggestions[active]?.name ?? suggestions[0].name)
          setOpen(false)
        }
      }}
    />
    {open && suggestions.length > 0 && <ul id={id} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#6D1925]/15 bg-white p-1 shadow-xl">
      {suggestions.map((city, index) => <li role="option" aria-selected={active === index} key={city.code}>
        <button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm text-[#34171C] hover:bg-[#FFF7E9] ${active === index ? "bg-[#FFF7E9]" : ""}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(city.name); setOpen(false) }}>
          {city.name} <span className="text-xs text-[#6D1925]/50">{city.code.slice(0, 2)}</span>
        </button>
      </li>)}
    </ul>}
  </div>
}
