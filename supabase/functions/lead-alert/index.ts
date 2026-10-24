// ============================================================
// ELYRA: new-lead email alert (Supabase Edge Function)
// Triggered by a Database Webhook on INSERT into public.leads.
// Sends an email through Resend (resend.com, free tier) to the
// addresses saved in Admin → Rates & settings → Alerts.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY   your Resend API key
//   ALERT_FROM       e.g. "Elyra Leads <leads@elyrashree.com>" (a domain verified in Resend)
//   WEBHOOK_SECRET   any long random string; also set as the webhook's x-webhook-secret header
//   ADMIN_URL        e.g. https://elyra.kynyx.com/admin/
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const TYPES: Record<string, string> = {
  enquiry: "Enquiry", consultation: "Consultation request", bespoke: "Bespoke design request",
  order: "Order click", call: "Call request",
};

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("Unauthorised", { status: 401 });
  }
  const payload = await req.json();
  const lead = payload?.record;
  if (!lead) return new Response("No record", { status: 400 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data } = await db.from("settings").select("value").eq("key", "alerts").maybeSingle();
  const alerts = data?.value ?? {};
  const to: string[] = (alerts.emails ?? []).filter(Boolean);
  if (!alerts.enabled || !to.length) return new Response("Alerts off", { status: 200 });

  const rows: [string, unknown][] = [
    ["Name", lead.name], ["Phone", lead.phone], ["Email", lead.email], ["City", lead.city],
    ["Product", lead.product_name], ["Estimated price", lead.estimated_price ? "₹" + Number(lead.estimated_price).toLocaleString("en-IN") : null],
    ...Object.entries(lead.config ?? {}), ...Object.entries(lead.details ?? {}),
    ["Photos", lead.photos?.length ? `${lead.photos.length} uploaded` : null], ["Page", lead.source_page],
  ];
  const table = rows.filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#6a6357">${esc(k)}</td><td style="padding:6px 0"><strong>${esc(v)}</strong></td></tr>`).join("");
  const link = (Deno.env.get("ADMIN_URL") ?? "") + "#/lead/" + lead.id;
  const title = `New ${TYPES[lead.type] ?? "lead"}${lead.name ? " from " + lead.name : ""}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("ALERT_FROM"),
      to,
      subject: title,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1815">
        <h2 style="font-family:Georgia,serif;font-weight:400">${esc(title)}</h2>
        <table>${table}</table>
        <p><a href="${esc(link)}" style="display:inline-block;background:#c9a14a;color:#140f05;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Open in Elyra Admin</a></p>
      </div>`,
    }),
  });
  return new Response(res.ok ? "Sent" : await res.text(), { status: res.ok ? 200 : 502 });
});
