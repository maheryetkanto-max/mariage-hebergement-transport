import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T00:00:00Z"));
}

function shell(title: string, intro: string, content: string) {
  return `<!doctype html>
  <html>
    <body style="margin:0;background:#FFF7E9;font-family:Arial,sans-serif;color:#3A2327">
      <div style="max-width:620px;margin:0 auto;padding:28px 16px">
        <div style="background:#6D1925;color:#FFF7E9;border-radius:20px 20px 0 0;padding:28px">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">Mariage Mahery &amp; Kanto</div>
          <h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.15;margin:8px 0 0">${esc(title)}</h1>
        </div>
        <div style="background:#ffffff;border:1px solid #ead9dc;border-top:0;border-radius:0 0 20px 20px;padding:28px">
          <p style="margin:0 0 20px;line-height:1.6">${intro}</p>
          ${content}
          <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #f0e5e7;font-size:12px;line-height:1.5;color:#765f63">
            Ces coordonnées sont transmises uniquement pour organiser l’hébergement ou le transport lié au mariage.
          </p>
        </div>
      </div>
    </body>
  </html>`;
}

function block(title: string, rows: Array<[string, string]>) {
  return `
    <div style="border:1px solid #ead9dc;border-radius:14px;padding:16px;margin:14px 0;background:#FFFDFC">
      <div style="font-weight:700;color:#6D1925;margin-bottom:10px">${esc(title)}</div>
      ${rows.map(([k,v]) => `<div style="display:flex;gap:10px;padding:6px 0;border-top:1px solid #f5edef">
        <div style="width:150px;flex:0 0 150px;font-size:12px;color:#806b6f">${esc(k)}</div>
        <div style="font-size:14px;font-weight:600">${v}</div>
      </div>`).join("")}
    </div>`;
}

function whatsappButton(url: unknown) {
  if (typeof url !== "string" || !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(url)) return "";
  return `<div style="margin:20px 0"><a href="${esc(url)}" style="display:inline-block;background:#25D366;color:#10351d;padding:14px 18px;border-radius:10px;font-weight:700;text-decoration:none">Rejoindre le groupe WhatsApp</a><p style="font-size:12px;color:#765f63">Ce lien est réservé aux personnes ayant confirmé leur réservation.</p></div>`;
}

async function sendViaAppsScript(url: string, secret: string, messages: Array<Record<string, string>>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, messages }),
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
  let result: { ok?: boolean; error?: string };
  try {
    result = await response.json();
  } catch {
    throw new Error("Apps Script did not return JSON");
  }
  if (result.ok !== true) throw new Error(`Apps Script: ${result.error ?? "unknown error"}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const legacyServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  let serviceKey = legacyServiceKey;

  if (!serviceKey && secretKeysRaw) {
    try {
      serviceKey = JSON.parse(secretKeysRaw).default;
    } catch {
      serviceKey = undefined;
    }
  }

  if (!supabaseUrl || !serviceKey) return json({ error: "server_configuration" }, 500);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let reservationId = "";
  let emailToken = "";
  try {
    const body = await req.json();
    reservationId = String(body?.reservation_id ?? "");
    emailToken = String(body?.email_token ?? "");
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!reservationId || !emailToken) return json({ error: "missing_parameters" }, 400);

  const { data: reservation, error: reservationError } = await admin
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .eq("email_token", emailToken)
    .single();

  if (reservationError || !reservation) return json({ error: "reservation_not_found" }, 404);

  const appsScriptUrl = Deno.env.get("APPS_SCRIPT_WEB_APP_URL");
  const appsScriptSecret = Deno.env.get("APPS_SCRIPT_SHARED_SECRET");
  if (!appsScriptUrl || !appsScriptSecret) {
    await admin.from("reservations").update({
      email_status: "failed",
      email_error: "Apps Script configuration missing",
      last_email_attempt_at: new Date().toISOString(),
    }).eq("id", reservationId);
    return json({ error: "email_not_configured" }, 503);
  }

  try {
    let providerEmail = "";
    let providerName = "";
    let providerPhone = "";
    let reserverOfferBlock = "";
    let providerOfferBlock = "";
    let subjectLabel = "";
    let whatsappUrl = "";

    if (reservation.offer_type === "accommodation") {
      const { data: offer, error } = await admin
        .from("accommodations")
        .select("*")
        .eq("id", reservation.accommodation_id)
        .single();
      if (error || !offer) throw new Error("accommodation_not_found");

      providerEmail = offer.email_proposant ?? "";
      whatsappUrl = offer.whatsapp_group_url ?? "";
      providerName = offer.propose_par ?? offer.contact ?? "la personne qui propose le logement";
      providerPhone = offer.telephone_proposant ?? "";
      subjectLabel = "hébergement";

      const maps = offer.adresse
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offer.adresse)}" style="color:#6D1925">Ouvrir dans Maps</a>`
        : "—";

      reserverOfferBlock = block("Votre hébergement", [
        ["Logement", esc(offer.nom)],
        ["Adresse", esc(offer.adresse ?? "—")],
        ["Dates", `${esc(formatDate(reservation.date_entree))} → ${esc(formatDate(reservation.date_sortie))}`],
        ["Personnes", esc(reservation.nb_personnes)],
        ["Montant total", Number(reservation.montant_total) === 0 ? "Gratuit" : `${Number(reservation.montant_total).toFixed(2)} €`],
        ["Carte", maps],
      ]);

      providerOfferBlock = block("Détails de la réservation", [
        ["Logement", esc(offer.nom)],
        ["Dates", `${esc(formatDate(reservation.date_entree))} → ${esc(formatDate(reservation.date_sortie))}`],
        ["Personnes", esc(reservation.nb_personnes)],
        ["Montant total", Number(reservation.montant_total) === 0 ? "Gratuit" : `${Number(reservation.montant_total).toFixed(2)} €`],
      ]);
    } else {
      const { data: offer, error } = await admin
        .from("vehicles")
        .select("*")
        .eq("id", reservation.vehicle_id)
        .single();
      if (error || !offer) throw new Error("vehicle_not_found");

      providerEmail = offer.email_conducteur ?? "";
      whatsappUrl = offer.whatsapp_group_url ?? "";
      providerName = offer.conducteur ?? "le conducteur";
      providerPhone = offer.telephone ?? "";
      subjectLabel = offer.type_trajet === "navette" ? "navette" : "covoiturage";

      const maps = offer.lieu_depart
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offer.lieu_depart)}" style="color:#6D1925">Ouvrir le point de départ dans Maps</a>`
        : "—";

      reserverOfferBlock = block("Votre transport", [
        ["Conducteur", esc(offer.conducteur)],
        ["Départ", `${esc(formatDate(offer.date_depart))}${offer.heure_depart ? " à " + esc(offer.heure_depart) : ""}`],
        ["Lieu", esc(offer.lieu_depart ?? offer.ville_depart ?? "—")],
        ["Destination", esc(offer.destination ?? "—")],
        ["Retour", offer.date_retour ? `${esc(formatDate(offer.date_retour))}${offer.heure_retour ? " à " + esc(offer.heure_retour) : ""}${offer.retour_lieu_depart || offer.retour_ville_arrivee ? " · " + esc(offer.retour_lieu_depart ?? "Clos Belair") + " → " + esc(offer.retour_ville_arrivee ?? "Île-de-France") : ""}` : "Non proposé"],
        ["Places réservées", esc(reservation.nb_personnes)],
        ["Participation totale", Number(reservation.montant_total) === 0 ? "Gratuit" : `${Number(reservation.montant_total).toFixed(2)} €`],
        ["Carte", maps],
      ]);

      providerOfferBlock = block("Détails de la réservation", [
        ["Trajet", esc(offer.ville_depart ?? offer.lieu_depart ?? "Départ") + " → " + esc(offer.destination ?? "Mariage")],
        ["Date", `${esc(formatDate(offer.date_depart))}${offer.heure_depart ? " à " + esc(offer.heure_depart) : ""}`],
        ["Places réservées", esc(reservation.nb_personnes)],
        ["Participation totale", Number(reservation.montant_total) === 0 ? "Gratuit" : `${Number(reservation.montant_total).toFixed(2)} €`],
      ]);
    }

    if (!providerEmail) throw new Error("provider_email_missing");

    const providerContactBlock = block("Votre contact", [
      ["Nom", esc(providerName)],
      ["Email", `<a href="mailto:${esc(providerEmail)}" style="color:#6D1925">${esc(providerEmail)}</a>`],
      ["Téléphone", providerPhone ? `<a href="tel:${esc(providerPhone)}" style="color:#6D1925">${esc(providerPhone)}</a>` : "—"],
    ]);

    const reserverContactBlock = block("Contact de la personne qui réserve", [
      ["Nom", esc(reservation.reserver_nom)],
      ["Email", `<a href="mailto:${esc(reservation.reserver_email)}" style="color:#6D1925">${esc(reservation.reserver_email)}</a>`],
      ["Téléphone", `<a href="tel:${esc(reservation.reserver_telephone)}" style="color:#6D1925">${esc(reservation.reserver_telephone)}</a>`],
      ["Genre", reservation.reserver_genre === "femme" ? "Femme" : reservation.reserver_genre === "homme" ? "Homme" : "—"],
    ]);

    const cancellationUrl = `https://mariage-mk-app.vercel.app/annuler?reservation=${encodeURIComponent(reservationId)}&code=${encodeURIComponent(emailToken)}`;
    const groupUrl = `https://mariage-mk-app.vercel.app/groupe?type=${encodeURIComponent(reservation.offer_type)}&offre=${encodeURIComponent(reservation.offer_type === "vehicle" ? reservation.vehicle_id : reservation.accommodation_id)}&reservation=${encodeURIComponent(reservationId)}&code=${encodeURIComponent(emailToken)}`;
    const groupButton = `<p style="margin-top:18px"><a href="${esc(groupUrl)}" style="color:#6D1925;font-weight:bold">Voir ou rejoindre le groupe WhatsApp de cette fiche</a></p>`;
    const cancellationButton = `<p style="margin-top:18px"><a href="${esc(cancellationUrl)}" style="color:#6D1925;font-weight:bold">Annuler ma place et la rendre disponible</a></p>`;

    const reserverHtml = shell(
      "Votre réservation est confirmée",
      "Votre réservation a bien été enregistrée. Voici le récapitulatif ainsi que les coordonnées de la personne qui propose cette offre.",
      reserverOfferBlock + providerContactBlock + whatsappButton(whatsappUrl) + groupButton + cancellationButton,
    );

    const providerHtml = shell(
      "Une nouvelle réservation a été faite",
      "Une personne vient de réserver une ou plusieurs places sur votre offre. Voici son récapitulatif et ses coordonnées.",
      providerOfferBlock + reserverContactBlock,
    );

    await sendViaAppsScript(appsScriptUrl, appsScriptSecret, [
      {
        to: reservation.reserver_email,
        subject: `Réservation confirmée — ${subjectLabel} mariage Mahery & Kanto`,
        body: `Votre réservation est confirmée. Pour voir le groupe WhatsApp : ${groupUrl}. Pour annuler votre place : ${cancellationUrl}. Consultez la version HTML de ce message pour les détails.${whatsappButton(whatsappUrl) ? `\nRejoindre le groupe WhatsApp : ${whatsappUrl}` : ""}`,
        htmlBody: reserverHtml,
        html: reserverHtml,
        replyTo: providerEmail,
        name: "Mariage Mahery & Kanto",
      },
      {
        to: providerEmail,
        subject: `Nouvelle réservation — ${subjectLabel} mariage Mahery & Kanto`,
        body: "Une nouvelle réservation a été faite. Consultez la version HTML de ce message pour les détails.",
        htmlBody: providerHtml,
        html: providerHtml,
        replyTo: reservation.reserver_email,
        name: "Mariage Mahery & Kanto",
      },
    ]);

    await admin.from("reservations").update({
      email_status: "sent",
      email_error: null,
      emails_sent_at: new Date().toISOString(),
      last_email_attempt_at: new Date().toISOString(),
    }).eq("id", reservationId);

    return json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await admin.from("reservations").update({
      email_status: "failed",
      email_error: message.slice(0, 1000),
      last_email_attempt_at: new Date().toISOString(),
    }).eq("id", reservationId);
    return json({ error: "email_send_failed", detail: message }, 502);
  }
});
