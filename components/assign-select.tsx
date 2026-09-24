"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const NONE = "__none__"

export interface AssignOption {
  value: string
  label: string
  disabled?: boolean
}

export function AssignSelect({
  value,
  onChange,
  options,
  placeholder = "Non affecté",
  noneLabel = "— Aucun —",
  className,
  size = "sm",
}: {
  value: string | null
  onChange: (value: string | null) => void
  options: AssignOption[]
  placeholder?: string
  noneLabel?: string
  className?: string
  size?: "sm" | "default"
}) {
  return (
    <Select
      value={value ?? NONE}
      onValueChange={(v: unknown) => onChange(v === NONE ? null : (v as string))}
    >
      <SelectTrigger size={size} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{noneLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
