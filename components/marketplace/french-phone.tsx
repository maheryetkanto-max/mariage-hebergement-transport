"use client"

export function formatFrenchPhone(raw: string) {
  const compact = raw.replace(/[\s().-]/g, "")
  if (!compact || compact === "+") return "+33"
  const digits = compact.startsWith("+33") ? compact.slice(3) : compact.startsWith("0033") ? compact.slice(4) : compact.replace(/\D/g, "")
  return "+33" + digits.replace(/^0/, "").replace(/\D/g, "").slice(0, 9)
}

export function isFrenchPhone(value: string) {
  return /^\+33[1-9][0-9]{8}$/.test(value)
}

export function FrenchPhone({ value, onChange, className }: { value: string; onChange: (value: string) => void; className: string }) {
  return <input aria-label="Téléphone français" className={className} type="tel" inputMode="tel" autoComplete="tel" required pattern="\+33[1-9][0-9]{8}" title="Numéro français à 10 chiffres, par exemple +33612345678" placeholder="+33612345678" value={value} onChange={(event) => onChange(formatFrenchPhone(event.target.value))} onFocus={() => { if (!value) onChange("+33") }} />
}
