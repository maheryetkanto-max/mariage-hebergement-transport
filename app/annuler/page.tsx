"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { revalidateAll } from "@/lib/data"

export default function AnnulerPage() {
  const [reservation, setReservation] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setReservation(params.get("reservation") || "")
    setCode(params.get("code") || "")
  }, [])
  async function cancel() {
    setBusy(true)
    const { data, error } = await createClient().rpc("cancel_own_reservation", {
      p_reservation_id: reservation,
      p_email_token: code,
    })
    setBusy(false)
    if (error) setMessage("Impossible d’annuler cette place. Vérifiez votre lien ou contactez les organisateurs.")
    else {
      setMessage(data ? "Votre place a été annulée et remise à disposition." : "Cette place était déjà annulée.")
      revalidateAll()
      window.history.replaceState(null, "", "/annuler")
    }
  }
  return <main className="mx-auto max-w-xl px-5 py-20 text-[#4B242B]">
    <h1 className="font-serif text-3xl text-[#6D1925]">Annuler ma place</h1>
    <p className="my-5">Si vous vous désistez, les places que vous aviez confirmées seront de nouveau disponibles.</p>
    {reservation && code ? <button type="button" disabled={busy || !!message} onClick={cancel} className="rounded-xl bg-[#6D1925] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Annulation…" : "Confirmer mon désistement"}</button> : <p>Lien d’annulation incomplet.</p>}
    {message && <p role="status" className="mt-5 font-semibold">{message}</p>}
  </main>
}
