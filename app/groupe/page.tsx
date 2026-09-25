"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Status = { count: number; url: string | null; phones: ({ name: string; phone: string } | string)[] }

export default function GroupePage() {
  const [params, setParams] = useState<URLSearchParams | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [link, setLink] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  useEffect(() => setParams(new URLSearchParams(window.location.search)), [])
  const load = useCallback(async (query: URLSearchParams) => {
    setError("")
    const { data, error: requestError } = await createClient().rpc("offer_group_status", {
      p_offer_type: query.get("type"), p_offer_id: query.get("offre"),
      p_reservation_id: query.get("reservation"), p_email_token: query.get("code"), p_owner_token: query.get("gestion"),
    })
    if (requestError) setError("Ce lien de groupe n’est pas valable ou la fiche n’est plus disponible.")
    else setStatus(data as Status)
  }, [])
  useEffect(() => { if (params?.get("offre") && params?.get("type")) void load(params) }, [params, load])
  async function save() {
    if (!params || !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(link.trim())) { setError("Collez un lien d’invitation WhatsApp valide."); return }
    setBusy(true)
    const { error: requestError } = await createClient().rpc("set_offer_group_link", {
      p_offer_type: params.get("type"), p_offer_id: params.get("offre"), p_url: link.trim(),
      p_reservation_id: params.get("reservation"), p_email_token: params.get("code"), p_owner_token: params.get("gestion"),
    })
    setBusy(false)
    if (requestError) { setError("Le groupe n’a pas pu être enregistré. Vérifiez que trois personnes sont présentes et qu’aucun groupe n’existe déjà."); await load(params) }
    else await load(params)
  }
  return <main className="mx-auto max-w-2xl space-y-5 px-5 py-16 text-[#4B242B]">
    <h1 className="font-serif text-3xl text-[#6D1925]">Groupe WhatsApp de cette fiche</h1>
    <p>La création du groupe est facultative et possible dès qu’au moins trois personnes partagent cette fiche.</p>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {status && <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      <p className="font-semibold">{status.count} personne{status.count > 1 ? "s" : ""} inscrite{status.count > 1 ? "s" : ""}</p>
      {status.url ? <a className="inline-flex min-h-12 items-center rounded-xl bg-[#25D366] px-5 font-semibold text-[#10351d]" href={status.url} target="_blank" rel="noopener noreferrer">Rejoindre le groupe WhatsApp ↗</a> : status.count < 3 ? <p>Le bouton pour créer le groupe apparaîtra ici à partir de trois personnes. Revenez avec ce même lien.</p> : <div className="space-y-4">
        <p>1. Dans WhatsApp, créez un nouveau groupe et ajoutez les participants à l’aide des numéros ci-dessous. 2. Copiez le lien d’invitation du groupe. 3. Collez-le ici : les autres personnes pourront alors rejoindre le groupe en un clic.</p>
        <ul className="space-y-2">{status.phones.map((entry, index) => { const phone = typeof entry === "string" ? entry : entry.phone; const name = typeof entry === "string" ? "Contact de la fiche" : entry.name; return <li key={`${phone}-${index}`}><a className="underline" href={`tel:${phone}`}>{name} · {phone}</a></li> })}</ul>
        <a href="https://faq.whatsapp.com/3242937609289432/" target="_blank" rel="noopener noreferrer" className="block text-sm underline">Comment copier le lien d’invitation WhatsApp ↗</a>
        <label className="block text-sm font-semibold">Lien d’invitation <input className="mt-2 w-full rounded-xl border border-[#6D1925]/20 p-3 font-normal" type="url" placeholder="https://chat.whatsapp.com/…" value={link} onChange={(event) => setLink(event.target.value)} /></label>
        <button disabled={busy} onClick={save} className="rounded-xl bg-[#6D1925] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Enregistrement…" : "Enregistrer le groupe"}</button>
      </div>}
    </section>}
    {params && <button onClick={() => void load(params)} className="text-sm font-semibold text-[#6D1925] underline">Actualiser</button>}
  </main>
}
