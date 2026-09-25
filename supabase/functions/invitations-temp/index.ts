import { createClient } from "npm:@supabase/supabase-js@2"

const header = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
const html = (notice = "") => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Transport et hébergement · Mahery & Kanto</title><style>
:root{color-scheme:light;font-family:system-ui,-apple-system,sans-serif;color:#35191e;background:#fff7e9}*{box-sizing:border-box}body{margin:0}header{background:#6d1925;color:#fff7e9;padding:22px 5vw}header b{font-family:Georgia,serif;font-size:25px}main{max-width:760px;margin:30px auto;padding:0 16px 60px}h1{font-family:Georgia,serif;font-size:clamp(30px,6vw,45px);color:#6d1925;margin:0 0 13px}.intro{line-height:1.6}.card{background:white;border:1px solid #6d192526;border-radius:22px;padding:24px;margin:20px 0;box-shadow:0 10px 30px #6d19250d}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.full{grid-column:1/-1}label{display:block;font-size:14px;font-weight:650;color:#6d1925}input,select,textarea{display:block;width:100%;padding:12px;border:1px solid #bca5a7;border-radius:10px;margin-top:6px;font:inherit;background:#fff;color:#35191e}textarea{min-height:86px}button{border:0;background:#6d1925;color:white;border-radius:12px;font:inherit;font-weight:700;padding:14px 22px;cursor:pointer}.notice{padding:15px;border-radius:12px;background:#eaf6ed;color:#155e30;margin:16px 0}.error{background:#fff0ee;color:#992d30}.fine{font-size:13px;color:#685455;line-height:1.55}.check{display:flex;align-items:flex-start;gap:9px}.check input{width:auto;margin-top:3px}a{color:#6d1925}@media(max-width:550px){.grid{grid-template-columns:1fr}.full{grid-column:auto}.card{padding:18px}}
</style></head><body><header><b>Mahery & Kanto</b><div>31 décembre 2026 · entraide entre invités</div></header><main><h1>Transport & hébergement</h1><p class="intro">Déposez votre proposition ou votre demande. Nous conservons les réponses pour les retrouver dans l’application quand sa mise à jour sera publiée.</p><p class="intro"><strong>Les demandes de place ne sont pas encore des réservations confirmées.</strong> Nous vous recontacterons pour confirmer les disponibilités. Aucune coordonnée saisie ici n’est publiée aux autres invités.</p>${notice}<form method="post" class="card"><div class="grid"><label class="full">Que souhaitez-vous faire ? *<select name="intent" required><option value="">Choisir…</option><option value="propose_transport">Proposer un transport</option><option value="cherche_transport">Chercher une place en voiture</option><option value="propose_hebergement">Proposer un hébergement</option><option value="cherche_hebergement">Chercher un hébergement</option></select></label><label>Prénom *<input name="first_name" required maxlength="80" autocomplete="given-name"></label><label>Nom *<input name="last_name" required maxlength="80" autocomplete="family-name"></label><label>Email *<input name="email" type="email" required maxlength="200" autocomplete="email"></label><label>Téléphone français *<input name="phone" type="tel" required placeholder="+33 6 12 34 56 78" autocomplete="tel"></label><label class="full">Ville de départ ou du logement *<input name="city" required maxlength="100" placeholder="Ex. Massy, Troyes…"></label><label class="full">Adresse exacte de prise en charge ou du logement (si vous proposez)<input name="exact_address" maxlength="250" placeholder="Numéro, rue et code postal. Cette adresse reste privée."></label><label>Jour du trajet (si concerné)<input name="departure_date" type="date" min="2026-12-29" max="2027-01-02"></label><label>Heure du trajet (si concerné)<input name="departure_time" type="time" step="900"></label><label class="full">Lieu de dépose (si vous proposez un transport)<select name="arrival_place"><option value="">Choisir si concerné</option><option>Église protestante Unie de Troyes</option><option>Salle de réception : Clos Belair</option><option>Gare de Troyes</option><option>Gare de Vendeuvre-sur-Barse</option><option>Gare de Bar-sur-Aube</option><option>Gare de Romilly-sur-Seine</option><option>Gare de Nogent-sur-Seine</option></select></label><label>Nombre d’adultes concernés *<input name="adult_count" type="number" min="0" max="15" value="1" required></label><label>Nombre d’enfants concernés *<input name="child_count" type="number" min="0" max="15" value="0" required></label><label class="full">Prénom et nom des autres adultes et enfants avec vous<input name="companions" maxlength="600" placeholder="Un prénom et un nom par personne, en précisant « enfant »"></label><label class="full">Places que vous proposez (si vous proposez un trajet ou un hébergement)<input name="seat_count" type="number" min="1" max="15" placeholder="Places disponibles en plus de votre groupe"></label><label>Taille du bagage (si transport)<select name="luggage"><option value="">Sans précision</option><option>Petit</option><option>Moyen</option><option>Gros</option></select></label><label>Temps jusqu’à la salle en minutes (si hébergement)<input name="accommodation_minutes" type="number" min="0" max="600"></label><label class="full">Annonce ou personne que vous souhaitez rejoindre (si connue)<input name="offer_reference" maxlength="160" placeholder="Ex. transport proposé par Marie, depuis Massy"></label><label class="full">Autres informations<textarea name="notes" maxlength="1200" placeholder="Précisions utiles : gare, horaires, enfants, dates de l’hébergement…"></textarea></label><label class="full check"><input name="consent" type="checkbox" required value="yes"><span>J’accepte que mes coordonnées soient enregistrées pour organiser le transport ou l’hébergement. *</span></label><div class="full"><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit">Envoyer mes informations</button></div></div></form><p class="fine">Les places seront décomptées uniquement lors d’une confirmation ultérieure dans l’application. Si vous avez déjà rempli ce formulaire, évitez d’envoyer une deuxième fois la même demande.</p></main></body></html>`

const clean = (form: FormData, key: string, length = 250) => String(form.get(key) ?? "").trim().slice(0, length)
const escape = (value: string) => value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char)

Deno.serve(async (request: Request) => {
  if (request.method === "GET") return new Response(html(), { headers: header })
  if (request.method !== "POST") return new Response("Méthode non autorisée", { status: 405 })
  try {
    if (Number(request.headers.get("content-length") || 0) > 12000) return new Response(html('<div class="notice error">Formulaire trop long.</div>'), { status: 413, headers: header })
    const form = await request.formData()
    if (clean(form, "website")) return new Response(html('<div class="notice">Merci, votre réponse a été enregistrée.</div>'), { headers: header })
    const intent = clean(form, "intent")
    const email = clean(form, "email", 200).toLowerCase()
    const phone = clean(form, "phone", 30).replace(/[\s.()-]/g, "")
    const adultCount = Number(clean(form, "adult_count"))
    const childCount = Number(clean(form, "child_count"))
    const seats = clean(form, "seat_count")
    const minutes = clean(form, "accommodation_minutes")
    if (!["propose_transport", "cherche_transport", "propose_hebergement", "cherche_hebergement"].includes(intent) ||
      !clean(form, "first_name", 80) || !clean(form, "last_name", 80) || !clean(form, "city", 100) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^(?:\+33[1-9]\d{8}|0[1-9]\d{8})$/.test(phone) ||
      !Number.isInteger(adultCount) || adultCount < 0 || adultCount > 15 ||
      !Number.isInteger(childCount) || childCount < 0 || childCount > 15 || adultCount + childCount < 1 ||
      (seats && (!Number.isInteger(Number(seats)) || Number(seats) < 1 || Number(seats) > 15)) ||
      (minutes && (!Number.isInteger(Number(minutes)) || Number(minutes) < 0 || Number(minutes) > 600)) ||
      clean(form, "consent") !== "yes") {
      return new Response(html('<div class="notice error">Vérifiez les champs obligatoires, les nombres de personnes et le numéro français.</div>'), { status: 400, headers: header })
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceKey) throw new Error("Configuration absente")
    const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const { error } = await client.from("intake_submissions").insert({
      intent, first_name: clean(form, "first_name", 80), last_name: clean(form, "last_name", 80),
      email, phone: phone.startsWith("0") ? "+33" + phone.slice(1) : phone,
      city: clean(form, "city", 100), exact_address: clean(form, "exact_address"),
      departure_date: clean(form, "departure_date") || null, departure_time: clean(form, "departure_time", 5) || null,
      arrival_place: clean(form, "arrival_place", 120), adult_count: adultCount, child_count: childCount,
      seat_count: seats ? Number(seats) : null, companions: clean(form, "companions", 600),
      luggage: clean(form, "luggage", 20), accommodation_minutes: minutes ? Number(minutes) : null,
      offer_reference: clean(form, "offer_reference", 160), notes: clean(form, "notes", 1200),
    })
    if (error) throw error
    return new Response(html('<div class="notice"><strong>Vos informations ont été enregistrées.</strong> Nous les reprendrons dans l’application et reviendrons vers vous avant de confirmer une place.</div>'), { headers: header })
  } catch (error) {
    console.error(error)
    return new Response(html('<div class="notice error">Impossible d’enregistrer pour le moment. Réessayez dans quelques instants.</div>'), { status: 500, headers: header })
  }
})
