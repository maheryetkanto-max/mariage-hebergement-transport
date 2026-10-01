"use client"

import { useEffect, useId, useMemo, useState } from "react"
import ileDeFrance from "@/data/communes-idf.json"
import aube from "@/data/communes-aube.json"

type CityEntry = { name: string; code: string }

export type CityArea = "idf" | "aube" | "idf-aube" | "troyes-2h"

const staticCities: Record<Exclude<CityArea, "troyes-2h">, CityEntry[]> = {
  idf: ileDeFrance,
  aube,
  "idf-aube": [...ileDeFrance, ...aube],
}

const TROYEs = { lat: 48.2973, lon: 4.0744 }
const TROYEs_DEPARTMENTS = ["10", "51", "52", "89", "21", "77", "55"]
const TROYEs_RADIUS_KM = 155

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function normalizeCity(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("fr")
}

export function isListedCity(value: string, area: CityArea) {
  if (area === "troyes-2h") return Boolean(value.trim())
  return staticCities[area].some((city) => normalizeCity(city.name) === normalizeCity(value))
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
  const [troyesCities, setTroyesCities] = useState<CityEntry[]>(aube)
  const id = useId()

  useEffect(() => {
    if (area !== "troyes-2h") return
    let cancelled = false
    Promise.all(
      TROYEs_DEPARTMENTS.map(async (department) => {
        const url = new URL("https://geo.api.gouv.fr/communes")
        url.searchParams.set("codeDepartement", department)
        url.searchParams.set("fields", "nom,code,centre")
        url.searchParams.set("format", "json")
        const response = await fetch(url.toString())
        if (!response.ok) throw new Error("city_lookup_failed")
        return response.json() as Promise<Array<{ nom: string; code: string; centre?: { coordinates?: [number, number] } }>>
      }),
    )
      .then((groups) => {
        if (cancelled) return
        const merged = groups
          .flat()
          .filter((city) => {
            const coords = city.centre?.coordinates
            if (!coords) return false
            const [lon, lat] = coords
            return haversineKm(TROYEs.lat, TROYEs.lon, lat, lon) <= TROYEs_RADIUS_KM
          })
          .map((city) => ({ name: city.nom, code: city.code }))
          .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }))
        if (merged.length) setTroyesCities(merged)
      })
      .catch(() => {
        if (!cancelled) setTroyesCities([...aube].sort((a, b) => a.name.localeCompare(b.name, "fr")))
      })
    return () => { cancelled = true }
  }, [area])

  const source = area === "troyes-2h" ? troyesCities : staticCities[area]

  const suggestions = useMemo(() => {
    const query = normalizeCity(value)
    const matches = source.filter((city) => !query || normalizeCity(city.name).includes(query))
    return matches
      .sort((a, b) => {
        const aStarts = query && normalizeCity(a.name).startsWith(query) ? 0 : 1
        const bStarts = query && normalizeCity(b.name).startsWith(query) ? 0 : 1
        return aStarts - bStarts || a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      })
      .slice(0, query ? 120 : 100)
  }, [source, value])

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
    {open && suggestions.length > 0 && <ul id={id} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-[#6D1925]/15 bg-white p-1 shadow-xl">
      {suggestions.map((city, index) => <li role="option" aria-selected={active === index} key={city.code}>
        <button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm text-[#34171C] hover:bg-[#FFF7E9] ${active === index ? "bg-[#FFF7E9]" : ""}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(city.name); setOpen(false) }}>
          {city.name} <span className="text-xs text-[#6D1925]/50">{city.code.slice(0, 2)}</span>
        </button>
      </li>)}
    </ul>}
  </div>
}
