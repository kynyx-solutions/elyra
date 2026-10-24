/* ============================================================
   ELYRA ADMIN DASHBOARD
   Single-page app on Supabase: dashboard, leads, customers,
   orders, products, blog, reviews, rates & settings, staff.
   Security is enforced by the database rules in supabase/schema.sql;
   this file only decides what to show.
   ============================================================ */
(() => {
  "use strict";

  const cfg = window.ELYRA_SUPABASE || {};
  const app = document.getElementById("app");
  const SITE = "../";
  const BASE = location.origin + location.pathname;
  const FILE_PRICING = window.ELYRA_PRICING || {};
  const FILE_SITE = window.ELYRA || {};

  /* ---------- helpers ---------- */
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => (n === null || n === undefined || n === "" || isNaN(n)) ? "—" :
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  const asDate = (d) => new Date(String(d).length === 10 ? d + "T00:00:00" : d);
  const fmtDate = (d) => d ? asDate(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
  const localISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const imgUrl = (p) => !p ? "" : /^(https?:|data:|blob:)/.test(p) ? p : SITE + String(p).replace(/^\//, "");
  const waDigits = (p) => { let d = String(p || "").replace(/\D/g, ""); if (d.length === 10) d = "91" + d; return d; };
  const slugify = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
  const safeName = (f) => f.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const opt = (value, label, current) => `<option value="${esc(value)}"${String(value) === String(current ?? "") ? " selected" : ""}>${esc(label)}</option>`;
  const badge = (key, label) => `<span class="badge b-${esc(key)}">${esc(label || key)}</span>`;

  function toast(msg, kind = "ok") {
    const t = document.createElement("div");
    t.className = "toast" + (kind === "error" ? " error" : "");
    t.textContent = msg;
    $("#toasts").appendChild(t);
    setTimeout(() => t.remove(), kind === "error" ? 7000 : 3500);
  }
  const failed = (error, what) => { if (error) { toast((what ? what + ": " : "") + error.message, "error"); return true; } return false; };

  // Read a form into an object: checkboxes → boolean, type=number → number, data-list → array
  function readForm(form) {
    const out = {};
    $$("[name]", form).forEach((el) => {
      if (el.type === "checkbox") out[el.name] = el.checked;
      else if (el.type === "number") out[el.name] = el.value === "" ? null : Number(el.value);
      else if (el.dataset.list !== undefined) out[el.name] = el.value.split(",").map((x) => x.trim()).filter(Boolean);
      else out[el.name] = el.value.trim() === "" ? null : el.value.trim();
    });
    return out;
  }

  async function busy(btn, fn) {
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "Saving…";
    try { await fn(); } finally { btn.disabled = false; btn.textContent = label; }
  }

  function downloadCSV(filename, rows, cols) {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [cols.map((c) => q(c[0])).join(",")].concat(rows.map((r) => cols.map((c) => q(typeof c[1] === "function" ? c[1](r) : r[c[1]])).join(",")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function barRows(entries, max) {
    const top = max || Math.max(1, ...entries.map((e) => e[1]));
    return entries.length ? `<div class="bars">${entries.map(([label, n]) =>
      `<div class="bar-row"><span>${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round((n / top) * 100)}%"></div></div><b>${n}</b></div>`).join("")}</div>` :
      `<p class="muted small">No data yet.</p>`;
  }
  function countBy(rows, fn) {
    const m = {};
    rows.forEach((r) => { const k = fn(r); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }

  /* ---------- constants ---------- */
  const LEAD_TYPES = { enquiry: "Enquiry", consultation: "Consultation", bespoke: "Bespoke request", order: "Order click", call: "Call request" };
  const LEAD_STATUS = { new: "New", contacted: "Contacted", quoted: "Quoted", won: "Won", lost: "Lost" };
  const ORDER_STATUS = { quoted: "Quoted", confirmed: "Confirmed (advance paid)", in_production: "In production", ready: "Ready", dispatched: "Dispatched", delivered: "Delivered", cancelled: "Cancelled" };
  const OPEN_ORDER = ["confirmed", "in_production", "ready", "dispatched"];
  const BOOKED = ["confirmed", "in_production", "ready", "dispatched", "delivered"];
  const CATEGORIES = { rings: "Rings", earrings: "Earrings", pendants: "Pendants & Necklaces", bracelets: "Bracelets & Bangles", bridal: "Bridal Sets", mangalsutra: "Mangalsutras" };
  const OCCASIONS = { engagement: "Engagement", bridal: "Wedding & Bridal", everyday: "Everyday", gifting: "Gifting", statement: "Statement" };
  const PRODUCT_STATUS = { active: "Active", hidden: "Hidden", sold_out: "Sold out" };

  /* ---------- Supabase ---------- */
  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    app.innerHTML = authCard(`<h1>Connect Supabase</h1><p>The admin dashboard needs a Supabase project. Add the project URL and anon key to <code>assets/js/supabase-config.js</code>, publish, then reload this page.</p><p class="small muted">Step-by-step instructions: <code>supabase/SETUP.md</code>.</p>`);
    return;
  }
  const db = window.supabase.createClient(cfg.url, cfg.anonKey);
  let me = null;           // { user, profile }
  let staffCache = null;   // profiles list

  async function staffList() {
    if (!staffCache) {
      const { data } = await db.from("profiles").select("id,full_name,email,role").order("full_name");
      staffCache = data || [];
    }
    return staffCache;
  }
  const staffName = (list, id) => { const s = list.find((x) => x.id === id); return s ? (s.full_name || s.email) : ""; };
  const isOwner = () => me && me.profile && me.profile.role === "owner";

  async function uploadMedia(folder, file) {
    const path = `${folder}/${Date.now()}-${safeName(file)}`;
    const { error } = await db.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
    if (failed(error, "Upload")) return null;
    return db.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  async function getSetting(key) {
    const { data } = await db.from("settings").select("value").eq("key", key).maybeSingle();
    return data ? data.value : null;
  }
  async function saveSetting(key, value) {
    const { error } = await db.from("settings").upsert({ key, value });
    return !failed(error, "Save");
  }

  /* ---------- auth screens ---------- */
  function authCard(inner) {
    return `<div class="auth-wrap"><div class="auth-card"><img class="auth-logo" src="${SITE}assets/img/logo.jpg" alt="Elyra by Shree Creations">${inner}</div></div>`;
  }

  const views = {};
  const PUBLIC = ["login", "signup", "forgot", "reset"];

  views.login = () => {
    app.innerHTML = authCard(`<h1>Admin login</h1><p class="sub">Elyra by Shree Creations</p>
      <form class="form" id="f"><div class="field"><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password" required></div>
      <button class="btn btn-gold" type="submit">Log in</button></form>
      <div class="auth-links"><a href="#/forgot">Forgot password?</a><a href="#/signup">Invited? Create your account</a></div>`);
    $("#f").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      await busy($("button", e.target), async () => {
        const { error } = await db.auth.signInWithPassword({ email: f.email, password: f.password });
        if (!failed(error, "Login")) { me = null; location.hash = "#/dashboard"; }
      });
    });
  };

  views.signup = () => {
    app.innerHTML = authCard(`<h1>Create your account</h1><p class="sub">Use the email address the owner invited.</p>
      <form class="form" id="f"><div class="field"><label for="n">Your name</label><input id="n" name="name" autocomplete="name" required></div>
      <div class="field"><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="p">Password (at least 8 characters)</label><input id="p" name="password" type="password" minlength="8" autocomplete="new-password" required></div>
      <button class="btn btn-gold" type="submit">Create account</button></form>
      <div class="auth-links"><a href="#/login">Back to login</a></div>`);
    $("#f").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      await busy($("button", e.target), async () => {
        const { data, error } = await db.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name }, emailRedirectTo: BASE } });
        if (failed(error, "Sign up")) return;
        if (data.session) { me = null; location.hash = "#/dashboard"; }
        else app.innerHTML = authCard(`<h1>Check your email</h1><p>We sent a confirmation link to <strong>${esc(f.email)}</strong>. Click it, then log in.</p><div class="auth-links"><a href="#/login">Go to login</a></div>`);
      });
    });
  };

  views.forgot = () => {
    app.innerHTML = authCard(`<h1>Reset password</h1><p class="sub">We will email you a reset link.</p>
      <form class="form" id="f"><div class="field"><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
      <button class="btn btn-gold" type="submit">Send reset link</button></form><div class="auth-links"><a href="#/login">Back to login</a></div>`);
    $("#f").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      await busy($("button", e.target), async () => {
        const { error } = await db.auth.resetPasswordForEmail(f.email, { redirectTo: BASE });
        if (!failed(error)) toast("If that email has an account, a reset link is on its way.");
      });
    });
  };

  views.reset = async () => {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { location.hash = "#/forgot"; return; }
    app.innerHTML = authCard(`<h1>Choose a new password</h1>
      <form class="form" id="f"><div class="field"><label for="p">New password</label><input id="p" name="password" type="password" minlength="8" autocomplete="new-password" required></div>
      <div class="field"><label for="p2">Repeat password</label><input id="p2" name="password2" type="password" minlength="8" autocomplete="new-password" required></div>
      <button class="btn btn-gold" type="submit">Save password</button></form>`);
    $("#f").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      if (f.password !== f.password2) return toast("The passwords don't match.", "error");
      await busy($("button", e.target), async () => {
        const { error } = await db.auth.updateUser({ password: f.password });
        if (!failed(error)) { toast("Password updated."); location.hash = "#/dashboard"; }
      });
    });
  };

  /* ---------- shell & routing ---------- */
  const NAV = [
    ["dashboard", "Dashboard"], ["leads", "Leads"], ["customers", "Customers"], ["orders", "Orders"],
    ["products", "Products"], ["blog", "Blog"], ["reviews", "Reviews"], ["settings", "Rates & settings"],
    ["staff", "Staff", true], ["account", "My account"]
  ];
  const SECTION = { lead: "leads", customer: "customers", order: "orders", product: "products", post: "blog" };

  function renderShell(active) {
    if (!$("#view")) {
      app.innerHTML = `<div class="layout"><aside class="side"><a class="side-logo" href="#/dashboard"><img src="${SITE}assets/img/logo.jpg" alt="Elyra"></a><nav id="nav"></nav>
        <div class="side-foot">Elyra Admin<br><a href="${SITE}index.html" target="_blank" rel="noopener" style="color:var(--gold-2)">View website ↗</a></div></aside>
        <div class="main"><header class="topbar"><span class="who" id="who"></span><span class="row"><a class="btn btn-sm" href="${SITE}index.html" target="_blank" rel="noopener">View website</a><button class="btn btn-sm" id="logout" type="button">Log out</button></span></header><main id="view"></main></div></div>`;
      $("#logout").addEventListener("click", async () => { await db.auth.signOut(); });
    }
    $("#who").textContent = `${me.profile.full_name || me.user.email} · ${me.profile.role === "owner" ? "Owner" : "Staff"}`;
    const section = SECTION[active] || active;
    $("#nav").innerHTML = NAV.filter((n) => !n[2] || isOwner()).map(([k, label]) =>
      `<a href="#/${k}" class="${k === section ? "active" : ""}">${esc(label)}${k === "leads" ? '<span class="nav-badge" id="new-count" hidden></span>' : ""}</a>`).join("");
    db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => {
      const b = $("#new-count");
      if (b && count) { b.hidden = false; b.textContent = count; }
    });
  }

  async function ensureUser() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { location.hash = "#/login"; return false; }
    if (!me || me.user.id !== session.user.id) {
      const { data: profile } = await db.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      me = { user: session.user, profile };
    }
    if (!me.profile) {
      app.innerHTML = authCard(`<h1>No access yet</h1><p>You're signed in as <strong>${esc(me.user.email)}</strong>, but this email hasn't been given access to the dashboard. Ask the owner to invite this exact email address, then sign up again.</p><button class="btn" id="lo" type="button">Log out</button>`);
      $("#lo").addEventListener("click", () => db.auth.signOut());
      return false;
    }
    return true;
  }

  async function route() {
    if (/access_token=|error_description=|type=recovery/.test(location.hash)) { app.innerHTML = authCard("<p>Signing you in…</p>"); return; }
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, query] = raw.split("?");
    const [name, id] = (path || "dashboard").split("/");
    const params = new URLSearchParams(query || "");
    if (PUBLIC.includes(name)) return views[name]();
    if (!(await ensureUser())) return;
    const view = views[name] && !PUBLIC.includes(name) ? name : "dashboard";
    if (view === "staff" && !isOwner()) { location.hash = "#/dashboard"; return; }
    renderShell(view);
    const main = $("#view");
    main.innerHTML = '<p class="loading">Loading…</p>';
    window.scrollTo(0, 0);
    try { await views[view](main, id, params); }
    catch (err) { console.error(err); main.innerHTML = `<div class="panel"><h2>Something went wrong</h2><p>${esc(err.message)}</p></div>`; }
  }

  /* ---------- dashboard ---------- */
  views.dashboard = async (main) => {
    const todayISO = localISO();
    const [L, F, O, CU] = await Promise.all([
      db.from("leads").select("id,created_at,type,status,source_page,product_name,name,phone").gte("created_at", daysAgo(91)).order("created_at", { ascending: false }),
      db.from("leads").select("id,name,phone,type,follow_up,status").lte("follow_up", todayISO).not("status", "in", "(won,lost)").order("follow_up").limit(20),
      db.from("orders").select("id,order_no,status,amount,advance_paid,created_at,due_date,description").order("created_at", { ascending: false }).limit(1000),
      db.from("customers").select("id,name,phone,birthday,anniversary").or("birthday.not.is.null,anniversary.not.is.null")
    ]);
    const leads = L.data || [], follow = F.data || [], orders = O.data || [], customers = CU.data || [];
    const since = (days) => leads.filter((l) => new Date(l.created_at) >= new Date(Date.now() - days * 864e5));
    const last30 = since(30);
    const prev30 = leads.filter((l) => { const t = new Date(l.created_at); return t < new Date(Date.now() - 30 * 864e5) && t >= new Date(Date.now() - 60 * 864e5); });
    const won = leads.filter((l) => l.status === "won").length;
    const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;
    const newCount = leads.filter((l) => l.status === "new").length;
    const openOrders = orders.filter((o) => OPEN_ORDER.includes(o.status));
    const booked30 = orders.filter((o) => BOOKED.includes(o.status) && new Date(o.created_at) >= new Date(Date.now() - 30 * 864e5));
    const bookedValue = booked30.reduce((s, o) => s + Number(o.amount || 0), 0);
    const outstanding = openOrders.reduce((s, o) => s + Math.max(0, Number(o.amount || 0) - Number(o.advance_paid || 0)), 0);
    const trend = prev30.length ? Math.round(((last30.length - prev30.length) / prev30.length) * 100) : null;

    // leads per week, last 12 weeks
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(Date.now() - i * 7 * 864e5), start = new Date(end.getTime() - 7 * 864e5);
      weeks.push({ label: end.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), n: leads.filter((l) => { const t = new Date(l.created_at); return t > start && t <= end; }).length });
    }
    const wmax = Math.max(1, ...weeks.map((w) => w.n));

    // birthdays & anniversaries in the next 30 days
    const upcoming = [];
    const now = new Date(); now.setHours(0, 0, 0, 0);
    customers.forEach((c) => [["birthday", "Birthday"], ["anniversary", "Anniversary"]].forEach(([k, label]) => {
      if (!c[k]) return;
      const d = asDate(c[k]);
      let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
      if (next < now) next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
      const days = Math.round((next - now) / 864e5);
      if (days <= 30) upcoming.push({ c, label, next, days });
    }));
    upcoming.sort((a, b) => a.days - b.days);
    const dueSoon = openOrders.filter((o) => o.due_date && asDate(o.due_date) <= new Date(Date.now() + 14 * 864e5)).sort((a, b) => asDate(a.due_date) - asDate(b.due_date));

    main.innerHTML = `
      <div class="page-head"><div><h1>Dashboard</h1><p>Welcome back, ${esc(me.profile.full_name || me.user.email)}. Here's how Elyra is doing.</p></div>
        <div class="row"><a class="btn" href="#/leads?status=new">Open new leads</a><a class="btn btn-gold" href="#/order/new">New order</a></div></div>
      <div class="grid g6" style="margin-bottom:18px">
        <a class="kpi" href="#/leads?status=new"><span>New leads</span><strong>${newCount}</strong><small>waiting for a reply</small></a>
        <a class="kpi" href="#/leads"><span>Leads, 30 days</span><strong>${last30.length}</strong><small>${trend === null ? "first month" : (trend >= 0 ? "▲ " : "▼ ") + Math.abs(trend) + "% vs previous 30"}</small></a>
        <div class="kpi"><span>Conversion, 90 days</span><strong>${conversion}%</strong><small>${won} won of ${leads.length} leads</small></div>
        <a class="kpi" href="#/orders"><span>Open orders</span><strong>${openOrders.length}</strong><small>${inr(outstanding)} balance due</small></a>
        <div class="kpi"><span>Booked, 30 days</span><strong>${inr(bookedValue)}</strong><small>${booked30.length} orders</small></div>
        <a class="kpi" href="#/leads?followup=due"><span>Follow-ups due</span><strong>${follow.length}</strong><small>today or overdue</small></a>
      </div>
      <div class="grid g2">
        <div class="panel"><h2>Leads per week</h2><div class="cols">${weeks.map((w) => `<div class="col"><b>${w.n || ""}</b><i style="height:${Math.round((w.n / wmax) * 120)}px"></i><span>${esc(w.label)}</span></div>`).join("")}</div></div>
        <div class="panel"><h2>Leads by type (90 days)</h2>${barRows(countBy(leads, (l) => LEAD_TYPES[l.type]))}</div>
        <div class="panel"><h2>Where leads come from</h2>${barRows(countBy(leads, (l) => l.source_page || "unknown").slice(0, 8))}</div>
        <div class="panel"><h2>Most-enquired products</h2>${barRows(countBy(leads, (l) => l.product_name).slice(0, 8))}</div>
        <div class="panel"><h2>Follow-ups due</h2>${follow.length ? `<ul class="list">${follow.map((l) => `<li><a href="#/lead/${l.id}">${esc(l.name || l.phone || LEAD_TYPES[l.type])}</a><span>${asDate(l.follow_up) < now ? badge("overdue", "Overdue") : ""} ${fmtDate(l.follow_up)}</span></li>`).join("")}</ul>` : '<p class="muted small">Nothing due. Nice work.</p>'}</div>
        <div class="panel"><h2>Recent leads</h2>${leads.length ? `<ul class="list">${leads.slice(0, 8).map((l) => `<li><a href="#/lead/${l.id}">${esc(l.name || l.product_name || LEAD_TYPES[l.type])}</a><span>${badge(l.status, LEAD_STATUS[l.status])} <span class="muted small">${fmtDateTime(l.created_at)}</span></span></li>`).join("")}</ul>` : '<p class="muted small">No leads yet. They appear here as customers use the website forms.</p>'}</div>
        <div class="panel"><h2>Orders due in the next 14 days</h2>${dueSoon.length ? `<ul class="list">${dueSoon.map((o) => `<li><a href="#/order/${o.id}">${esc(o.order_no)} · ${esc(o.description.slice(0, 40))}</a><span>${badge(o.status, ORDER_STATUS[o.status])} ${fmtDate(o.due_date)}</span></li>`).join("")}</ul>` : '<p class="muted small">No orders due soon.</p>'}</div>
        <div class="panel"><h2>Birthdays &amp; anniversaries (30 days)</h2>${upcoming.length ? `<ul class="list">${upcoming.slice(0, 10).map((u) => `<li><a href="#/customer/${u.c.id}">${esc(u.c.name)}</a><span>${esc(u.label)} · ${u.days === 0 ? "today" : "in " + u.days + " days"} ${u.c.phone ? `<a class="btn btn-sm btn-wa" target="_blank" rel="noopener" href="https://wa.me/${waDigits(u.c.phone)}">WhatsApp</a>` : ""}</span></li>`).join("")}</ul>` : '<p class="muted small">Add birthdays and anniversaries to customer records to see reminders here.</p>'}</div>
      </div>`;
  };

  /* ---------- leads ---------- */
  views.leads = async (main, _id, params) => {
    main.innerHTML = `
      <div class="page-head"><div><h1>Leads</h1><p>Every enquiry, consultation, bespoke request and order click from the website.</p></div>
        <div class="row"><button class="btn" id="export" type="button">Export CSV</button></div></div>
      <form class="filters" id="filters">
        <input name="q" type="search" placeholder="Search name, phone, product, city…">
        <select name="type"><option value="">All types</option>${Object.entries(LEAD_TYPES).map(([k, v]) => opt(k, v, params.get("type"))).join("")}</select>
        <select name="status"><option value="">All statuses</option>${Object.entries(LEAD_STATUS).map(([k, v]) => opt(k, v, params.get("status"))).join("")}</select>
        <select name="range">${opt("30", "Last 30 days", "")}${opt("90", "Last 90 days", "")}${opt("365", "Last 12 months", "")}${opt("all", "All time", "all")}</select>
        <label class="check"><input type="checkbox" name="followup"${params.get("followup") ? " checked" : ""}> Follow-up due</label>
      </form>
      <div id="out"><p class="loading">Loading…</p></div>`;
    const form = $("#filters", main);
    let rows = [];
    const staff = await staffList();

    async function load() {
      const f = readForm(form);
      let q = db.from("leads").select("*").order("created_at", { ascending: false }).limit(1000);
      if (f.type) q = q.eq("type", f.type);
      if (f.status) q = q.eq("status", f.status);
      if (f.range && f.range !== "all") q = q.gte("created_at", daysAgo(Number(f.range)));
      if (f.followup) q = q.lte("follow_up", localISO()).not("status", "in", "(won,lost)");
      const { data, error } = await q;
      if (failed(error, "Leads")) return;
      rows = data || [];
      render();
    }
    function render() {
      const term = (form.q.value || "").toLowerCase();
      const list = term ? rows.filter((l) => JSON.stringify([l.name, l.phone, l.email, l.city, l.product_name, l.details]).toLowerCase().includes(term)) : rows;
      $("#out", main).innerHTML = list.length ? `<div class="table-wrap"><table><thead><tr><th>Received</th><th>Type</th><th>Customer</th><th>About</th><th>Status</th><th>Follow-up</th><th>Assigned</th></tr></thead><tbody>
        ${list.map((l) => `<tr class="click" data-id="${l.id}"><td>${fmtDateTime(l.created_at)}</td><td>${esc(LEAD_TYPES[l.type])}</td>
          <td><strong>${esc(l.name || "—")}</strong><br><span class="muted small">${esc(l.phone || "via WhatsApp")}${l.city ? " · " + esc(l.city) : ""}</span></td>
          <td>${esc(l.product_name || l.details?.["Looking for"] || l.details?.["Type of piece"] || l.details?.["Topic"] || "")}${l.estimated_price ? `<br><span class="muted small">${inr(l.estimated_price)}</span>` : ""}</td>
          <td>${badge(l.status, LEAD_STATUS[l.status])}</td><td>${l.follow_up ? fmtDate(l.follow_up) : "—"}</td><td>${esc(staffName(staff, l.assigned_to)) || "—"}</td></tr>`).join("")}
        </tbody></table></div><p class="muted small">${list.length} lead${list.length === 1 ? "" : "s"}</p>` : '<div class="panel empty">No leads match these filters.</div>';
      $$("tr.click", main).forEach((tr) => tr.addEventListener("click", () => { location.hash = "#/lead/" + tr.dataset.id; }));
    }
    form.addEventListener("change", load);
    form.q.addEventListener("input", render);
    $("#export", main).addEventListener("click", () => downloadCSV(`elyra-leads-${localISO()}.csv`, rows, [
      ["Received", (l) => fmtDateTime(l.created_at)], ["Type", (l) => LEAD_TYPES[l.type]], ["Status", (l) => LEAD_STATUS[l.status]],
      ["Name", "name"], ["Phone", "phone"], ["Email", "email"], ["City", "city"], ["Product", "product_name"],
      ["Estimated price", "estimated_price"], ["Configuration", (l) => l.config ? Object.entries(l.config).filter((e) => e[1]).map((e) => e[0] + ": " + e[1]).join("; ") : ""],
      ["Details", (l) => Object.entries(l.details || {}).map((e) => e[0] + ": " + e[1]).join("; ")],
      ["Source page", "source_page"], ["Follow-up", "follow_up"], ["Assigned to", (l) => staffName(staff, l.assigned_to)], ["Notes", "notes"]
    ]));
    await load();
  };

  views.lead = async (main, id) => {
    const [{ data: l, error }, staff] = await Promise.all([db.from("leads").select("*").eq("id", id).maybeSingle(), staffList()]);
    if (failed(error) || !l) { main.innerHTML = '<div class="panel empty">Lead not found. <a href="#/leads">Back to leads</a></div>'; return; }
    let photos = [];
    if (l.photos && l.photos.length) {
      const { data } = await db.storage.from("lead-uploads").createSignedUrls(l.photos, 3600);
      photos = (data || []).filter((p) => p.signedUrl);
    }
    const kv = (obj) => Object.entries(obj || {}).filter((e) => e[1] !== null && e[1] !== "").map(([k, v]) => `<tr><th>${esc(k.replace(/_/g, " "))}</th><td>${esc(v)}</td></tr>`).join("");
    const wa = l.phone ? `https://wa.me/${waDigits(l.phone)}?text=${encodeURIComponent("Hi " + (l.name || "") + ", this is Elyra by Shree Creations. Thank you for your enquiry!")}` : "";

    main.innerHTML = `
      <div class="page-head"><div><a href="#/leads" class="small">← All leads</a><h1>${esc(l.name || LEAD_TYPES[l.type])}</h1>
        <p>${esc(LEAD_TYPES[l.type])} · received ${fmtDateTime(l.created_at)} · from <code>${esc(l.source_page || "website")}</code></p></div>
        <div class="row">${wa ? `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">WhatsApp</a><a class="btn" href="tel:${esc(l.phone)}">Call</a>` : ""}
          ${l.customer_id ? `<a class="btn" href="#/customer/${l.customer_id}">View customer</a>` : '<button class="btn" id="to-customer" type="button">Save as customer</button>'}
          <a class="btn btn-gold" href="#/order/new?lead=${l.id}">Create order</a></div></div>
      <div class="grid g2">
        <div>
          <div class="panel"><h2>Contact</h2><table class="kv"><tbody>${kv({ Name: l.name, Phone: l.phone || "Not given (contacted via WhatsApp)", Email: l.email, City: l.city })}</tbody></table></div>
          ${l.product_name || l.config ? `<div class="panel"><h2>Product</h2><table class="kv"><tbody>${kv({ Product: l.product_name, SKU: l.product_id })}${kv(l.config)}${l.estimated_price ? `<tr><th>Estimated price</th><td><strong>${inr(l.estimated_price)}</strong></td></tr>` : ""}</tbody></table>
            ${l.product_id ? `<p class="small"><a href="${SITE}product.html?id=${encodeURIComponent(l.product_id)}" target="_blank" rel="noopener">Open product page ↗</a></p>` : ""}</div>` : ""}
          ${Object.keys(l.details || {}).length ? `<div class="panel"><h2>What they told us</h2><table class="kv"><tbody>${kv(l.details)}</tbody></table></div>` : ""}
          ${photos.length ? `<div class="panel"><h2>Photos</h2><div class="images photos">${photos.map((p) => `<a href="${esc(p.signedUrl)}" target="_blank" rel="noopener"><img src="${esc(p.signedUrl)}" alt="Customer photo"></a>`).join("")}</div></div>` : ""}
        </div>
        <div>
          <form class="panel form" id="f"><h2>Manage</h2>
            <div class="field"><label>Status</label><select name="status">${Object.entries(LEAD_STATUS).map(([k, v]) => opt(k, v, l.status)).join("")}</select></div>
            <div class="field"><label>Follow-up date</label><input type="date" name="follow_up" value="${esc(l.follow_up || "")}"></div>
            <div class="field"><label>Assigned to</label><select name="assigned_to"><option value="">Nobody</option>${staff.map((s) => opt(s.id, s.full_name || s.email, l.assigned_to)).join("")}</select></div>
            <div class="field"><label>Notes</label><textarea name="notes" placeholder="Call summary, quote sent, next step…">${esc(l.notes || "")}</textarea></div>
            <div class="row"><button class="btn btn-gold" type="submit">Save</button><span class="spacer"></span><button class="btn btn-danger" id="del" type="button">Delete lead</button></div>
          </form>
        </div>
      </div>`;

    $("#f", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      await busy($("button[type=submit]", e.target), async () => {
        const { error } = await db.from("leads").update({ status: f.status, follow_up: f.follow_up, assigned_to: f.assigned_to, notes: f.notes }).eq("id", l.id);
        if (!failed(error, "Save")) toast("Lead updated.");
      });
    });
    $("#del", main).addEventListener("click", async () => {
      if (!confirm("Delete this lead permanently?")) return;
      if (l.photos && l.photos.length) await db.storage.from("lead-uploads").remove(l.photos);
      const { error } = await db.from("leads").delete().eq("id", l.id);
      if (!failed(error)) { toast("Lead deleted."); location.hash = "#/leads"; }
    });
    const toCustomer = $("#to-customer", main);
    if (toCustomer) toCustomer.addEventListener("click", async () => {
      let customerId = null;
      if (l.phone) {
        const { data } = await db.from("customers").select("id").eq("phone", l.phone).maybeSingle();
        if (data) customerId = data.id;
      }
      if (!customerId) {
        const { data, error } = await db.from("customers").insert({ name: l.name || "WhatsApp customer", phone: l.phone, email: l.email, city: l.city, ring_size: l.config?.ring_size || null }).select("id").single();
        if (failed(error, "Customer")) return;
        customerId = data.id;
      }
      const { error } = await db.from("leads").update({ customer_id: customerId }).eq("id", l.id);
      if (!failed(error)) { toast("Saved as customer."); location.hash = "#/customer/" + customerId; }
    });
  };

  /* ---------- customers ---------- */
  views.customers = async (main) => {
    const { data, error } = await db.from("customers").select("*").order("name").limit(2000);
    if (failed(error, "Customers")) return;
    const rows = data || [];
    main.innerHTML = `
      <div class="page-head"><div><h1>Customers</h1><p>${rows.length} customer record${rows.length === 1 ? "" : "s"}.</p></div>
        <div class="row"><button class="btn" id="export" type="button">Export CSV</button><a class="btn btn-gold" href="#/customer/new">Add customer</a></div></div>
      <div class="filters" style="grid-template-columns:1fr"><input id="q" type="search" placeholder="Search name, phone, email, city…"></div>
      <div id="out"></div>`;
    function render() {
      const term = $("#q", main).value.toLowerCase();
      const list = term ? rows.filter((c) => [c.name, c.phone, c.email, c.city].join(" ").toLowerCase().includes(term)) : rows;
      $("#out", main).innerHTML = list.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>City</th><th>Ring size</th><th>Birthday</th><th>Anniversary</th></tr></thead><tbody>
        ${list.map((c) => `<tr class="click" data-id="${c.id}"><td><strong>${esc(c.name)}</strong><br><span class="muted small">${esc(c.email || "")}</span></td><td>${esc(c.phone || "—")}</td><td>${esc(c.city || "—")}</td><td>${esc(c.ring_size || "—")}</td><td>${c.birthday ? fmtDate(c.birthday) : "—"}</td><td>${c.anniversary ? fmtDate(c.anniversary) : "—"}</td></tr>`).join("")}
        </tbody></table></div>` : '<div class="panel empty">No customers yet. Use "Save as customer" on a lead, or add one here.</div>';
      $$("tr.click", main).forEach((tr) => tr.addEventListener("click", () => { location.hash = "#/customer/" + tr.dataset.id; }));
    }
    $("#q", main).addEventListener("input", render);
    $("#export", main).addEventListener("click", () => downloadCSV(`elyra-customers-${localISO()}.csv`, rows, [
      ["Name", "name"], ["Phone", "phone"], ["Email", "email"], ["City", "city"], ["Ring size", "ring_size"], ["Birthday", "birthday"], ["Anniversary", "anniversary"], ["Notes", "notes"], ["Added", (c) => fmtDate(c.created_at)]
    ]));
    render();
  };

  views.customer = async (main, id) => {
    const isNew = id === "new";
    let c = { name: "", phone: "", email: "", city: "", ring_size: "", birthday: "", anniversary: "", notes: "" };
    let leads = [], orders = [];
    if (!isNew) {
      const [C1, L1, O1] = await Promise.all([
        db.from("customers").select("*").eq("id", id).maybeSingle(),
        db.from("leads").select("id,created_at,type,status,product_name").eq("customer_id", id).order("created_at", { ascending: false }),
        db.from("orders").select("id,order_no,created_at,status,amount,description").eq("customer_id", id).order("created_at", { ascending: false })
      ]);
      if (!C1.data) { main.innerHTML = '<div class="panel empty">Customer not found. <a href="#/customers">Back</a></div>'; return; }
      c = C1.data; leads = L1.data || []; orders = O1.data || [];
    }
    const spent = orders.filter((o) => BOOKED.includes(o.status)).reduce((s, o) => s + Number(o.amount || 0), 0);
    main.innerHTML = `
      <div class="page-head"><div><a href="#/customers" class="small">← All customers</a><h1>${isNew ? "New customer" : esc(c.name)}</h1>${isNew ? "" : `<p>${orders.length} order${orders.length === 1 ? "" : "s"} · ${inr(spent)} lifetime value</p>`}</div>
        <div class="row">${c.phone ? `<a class="btn btn-wa" href="https://wa.me/${waDigits(c.phone)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}${isNew ? "" : `<a class="btn btn-gold" href="#/order/new?customer=${c.id}">New order</a>`}</div></div>
      <div class="grid g2">
        <form class="panel form" id="f"><h2>Details</h2>
          <div class="grid g2"><div class="field"><label>Name *</label><input name="name" required value="${esc(c.name)}"></div><div class="field"><label>Phone / WhatsApp</label><input name="phone" type="tel" value="${esc(c.phone || "")}"></div></div>
          <div class="grid g2"><div class="field"><label>Email</label><input name="email" type="email" value="${esc(c.email || "")}"></div><div class="field"><label>City</label><input name="city" value="${esc(c.city || "")}"></div></div>
          <div class="grid g3"><div class="field"><label>Ring size</label><input name="ring_size" value="${esc(c.ring_size || "")}"></div><div class="field"><label>Birthday</label><input name="birthday" type="date" value="${esc(c.birthday || "")}"></div><div class="field"><label>Anniversary</label><input name="anniversary" type="date" value="${esc(c.anniversary || "")}"></div></div>
          <div class="field"><label>Notes</label><textarea name="notes" placeholder="Preferences, family occasions, metal they like…">${esc(c.notes || "")}</textarea></div>
          <div class="row"><button class="btn btn-gold" type="submit">${isNew ? "Add customer" : "Save"}</button><span class="spacer"></span>${isNew ? "" : '<button class="btn btn-danger" id="del" type="button">Delete</button>'}</div>
        </form>
        <div>
          <div class="panel"><h2>Orders</h2>${orders.length ? `<ul class="list">${orders.map((o) => `<li><a href="#/order/${o.id}">${esc(o.order_no)} · ${esc((o.description || "").slice(0, 40))}</a><span>${badge(o.status, ORDER_STATUS[o.status])} ${inr(o.amount)}</span></li>`).join("")}</ul>` : '<p class="muted small">No orders yet.</p>'}</div>
          <div class="panel"><h2>Leads</h2>${leads.length ? `<ul class="list">${leads.map((l) => `<li><a href="#/lead/${l.id}">${esc(LEAD_TYPES[l.type])}${l.product_name ? " · " + esc(l.product_name) : ""}</a><span>${badge(l.status, LEAD_STATUS[l.status])} <span class="muted small">${fmtDate(l.created_at)}</span></span></li>`).join("")}</ul>` : '<p class="muted small">No linked leads.</p>'}</div>
        </div>
      </div>`;
    $("#f", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      await busy($("button[type=submit]", e.target), async () => {
        const q = isNew ? db.from("customers").insert(f).select("id").single() : db.from("customers").update(f).eq("id", c.id).select("id").single();
        const { data, error } = await q;
        if (failed(error, "Save")) return;
        toast("Customer saved.");
        if (isNew) location.hash = "#/customer/" + data.id;
      });
    });
    const del = $("#del", main);
    if (del) del.addEventListener("click", async () => {
      if (!confirm("Delete this customer? Their orders and leads are kept but unlinked.")) return;
      const { error } = await db.from("customers").delete().eq("id", c.id);
      if (!failed(error)) { toast("Customer deleted."); location.hash = "#/customers"; }
    });
  };

  /* ---------- orders ---------- */
  views.orders = async (main, _id, params) => {
    const { data, error } = await db.from("orders").select("*, customers(name,phone)").order("created_at", { ascending: false }).limit(2000);
    if (failed(error, "Orders")) return;
    const rows = data || [];
    main.innerHTML = `
      <div class="page-head"><div><h1>Orders</h1><p>Track every order from quote to delivery.</p></div>
        <div class="row"><button class="btn" id="export" type="button">Export CSV</button><a class="btn btn-gold" href="#/order/new">New order</a></div></div>
      <form class="filters" id="filters" style="grid-template-columns:2fr 1fr"><input name="q" type="search" placeholder="Search order no., customer, item…">
        <select name="status"><option value="">All statuses</option><option value="open"${params.get("status") === "open" ? " selected" : ""}>Open (not delivered)</option>${Object.entries(ORDER_STATUS).map(([k, v]) => opt(k, v, params.get("status"))).join("")}</select></form>
      <div id="out"></div>`;
    const form = $("#filters", main);
    function render() {
      const f = readForm(form), term = (f.q || "").toLowerCase();
      const list = rows.filter((o) => (!f.status || (f.status === "open" ? OPEN_ORDER.includes(o.status) || o.status === "quoted" : o.status === f.status)) &&
        (!term || [o.order_no, o.description, o.customers?.name, o.customers?.phone].join(" ").toLowerCase().includes(term)));
      $("#out", main).innerHTML = list.length ? `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Item</th><th class="num">Amount</th><th class="num">Balance</th><th>Status</th><th>Due</th></tr></thead><tbody>
        ${list.map((o) => { const bal = Math.max(0, Number(o.amount || 0) - Number(o.advance_paid || 0)); const late = o.due_date && OPEN_ORDER.concat("quoted").includes(o.status) && asDate(o.due_date) < new Date(new Date().toDateString());
          return `<tr class="click" data-id="${o.id}"><td><strong>${esc(o.order_no)}</strong><br><span class="muted small">${fmtDate(o.created_at)}</span></td><td>${esc(o.customers?.name || "—")}</td><td>${esc((o.description || "").slice(0, 60))}</td>
          <td class="num">${inr(o.amount)}</td><td class="num">${bal ? inr(bal) : "Paid"}</td><td>${badge(o.status, ORDER_STATUS[o.status])}</td><td>${o.due_date ? fmtDate(o.due_date) : "—"} ${late ? badge("overdue", "Late") : ""}</td></tr>`; }).join("")}
        </tbody></table></div><p class="muted small">${list.length} order${list.length === 1 ? "" : "s"} · ${inr(list.reduce((s, o) => s + Number(o.amount || 0), 0))} total</p>` : '<div class="panel empty">No orders yet.</div>';
      $$("tr.click", main).forEach((tr) => tr.addEventListener("click", () => { location.hash = "#/order/" + tr.dataset.id; }));
    }
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    $("#export", main).addEventListener("click", () => downloadCSV(`elyra-orders-${localISO()}.csv`, rows, [
      ["Order no", "order_no"], ["Date", (o) => fmtDate(o.created_at)], ["Customer", (o) => o.customers?.name], ["Phone", (o) => o.customers?.phone], ["Item", "description"],
      ["Amount", "amount"], ["Advance paid", "advance_paid"], ["Balance", (o) => Math.max(0, Number(o.amount || 0) - Number(o.advance_paid || 0))],
      ["Status", (o) => ORDER_STATUS[o.status]], ["Due date", "due_date"], ["Tracking", "tracking"], ["Notes", "notes"]
    ]));
    render();
  };

  views.order = async (main, id, params) => {
    const isNew = id === "new";
    let o = { customer_id: params.get("customer") || "", lead_id: null, product_id: "", description: "", amount: "", advance_paid: 0, status: "quoted", due_date: "", tracking: "", notes: "", config: null };
    const [CU, PRD] = await Promise.all([db.from("customers").select("id,name,phone").order("name").limit(3000), db.from("products").select("id,name").order("name")]);
    if (isNew && params.get("lead")) {
      const { data: l } = await db.from("leads").select("*").eq("id", params.get("lead")).maybeSingle();
      if (l) {
        o.lead_id = l.id; o.customer_id = l.customer_id || ""; o.product_id = l.product_id || ""; o.amount = l.estimated_price || ""; o.config = l.config;
        o.description = [l.product_name, ...Object.entries(l.config || {}).filter((e) => e[1]).map((e) => e[0].replace(/_/g, " ") + ": " + e[1])].filter(Boolean).join("\n") ||
          Object.entries(l.details || {}).map((e) => e[0] + ": " + e[1]).join("\n");
        if (!l.customer_id) toast("Tip: save this lead as a customer first to link the order.");
      }
    } else if (!isNew) {
      const { data } = await db.from("orders").select("*").eq("id", id).maybeSingle();
      if (!data) { main.innerHTML = '<div class="panel empty">Order not found. <a href="#/orders">Back</a></div>'; return; }
      o = data;
    }
    const customers = CU.data || [], products = PRD.data || [];
    const bal = Math.max(0, Number(o.amount || 0) - Number(o.advance_paid || 0));
    main.innerHTML = `
      <div class="page-head"><div><a href="#/orders" class="small">← All orders</a><h1>${isNew ? "New order" : esc(o.order_no)}</h1>${isNew ? "" : `<p>Created ${fmtDateTime(o.created_at)} · balance due <strong>${inr(bal)}</strong></p>`}</div>
        <div class="row">${o.lead_id ? `<a class="btn" href="#/lead/${o.lead_id}">View lead</a>` : ""}${o.customer_id ? `<a class="btn" href="#/customer/${o.customer_id}">View customer</a>` : ""}</div></div>
      <form class="panel form" id="f">
        <div class="grid g2"><div class="field"><label>Customer</label><select name="customer_id"><option value="">Choose a customer</option>${customers.map((c) => opt(c.id, c.name + (c.phone ? " · " + c.phone : ""), o.customer_id)).join("")}</select><div class="hint">Not listed? <a href="#/customer/new">Add a customer</a> first.</div></div>
          <div class="field"><label>Product (optional)</label><select name="product_id"><option value="">Custom / not in catalogue</option>${products.map((p) => opt(p.id, p.name + " · " + p.id, o.product_id)).join("")}</select></div></div>
        <div class="field"><label>Item &amp; specification *</label><textarea name="description" required placeholder="e.g. Aurelia Solitaire Ring, 18K yellow gold, 0.50 ct natural G–H VS, size 12">${esc(o.description)}</textarea></div>
        <div class="grid g4"><div class="field"><label>Amount (₹, incl. GST)</label><input name="amount" type="number" min="0" step="1" value="${esc(o.amount)}"></div>
          <div class="field"><label>Advance paid (₹)</label><input name="advance_paid" type="number" min="0" step="1" value="${esc(o.advance_paid)}"></div>
          <div class="field"><label>Status</label><select name="status">${Object.entries(ORDER_STATUS).map(([k, v]) => opt(k, v, o.status)).join("")}</select></div>
          <div class="field"><label>Due / delivery date</label><input name="due_date" type="date" value="${esc(o.due_date || "")}"></div></div>
        <div class="grid g2"><div class="field"><label>Courier &amp; tracking number</label><input name="tracking" value="${esc(o.tracking || "")}"></div><div class="field"><label>Internal notes</label><input name="notes" value="${esc(o.notes || "")}"></div></div>
        <div class="row"><button class="btn btn-gold" type="submit">${isNew ? "Create order" : "Save"}</button><span class="spacer"></span>${isNew ? "" : '<button class="btn btn-danger" id="del" type="button">Delete</button>'}</div>
      </form>`;
    $("#f", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      f.amount = f.amount || 0; f.advance_paid = f.advance_paid || 0;
      if (isNew) { f.lead_id = o.lead_id; f.config = o.config; }
      await busy($("button[type=submit]", e.target), async () => {
        const q = isNew ? db.from("orders").insert(f).select("id,order_no").single() : db.from("orders").update(f).eq("id", o.id).select("id,order_no").single();
        const { data, error } = await q;
        if (failed(error, "Save")) return;
        if (isNew && o.lead_id) await db.from("leads").update({ status: "won" }).eq("id", o.lead_id);
        toast(`Order ${data.order_no} saved.`);
        if (isNew) location.hash = "#/order/" + data.id; else route();
      });
    });
    const del = $("#del", main);
    if (del) del.addEventListener("click", async () => {
      if (!confirm(`Delete order ${o.order_no}?`)) return;
      const { error } = await db.from("orders").delete().eq("id", o.id);
      if (!failed(error)) { toast("Order deleted."); location.hash = "#/orders"; }
    });
  };

  /* ---------- products & inventory ---------- */
  views.products = async (main) => {
    const { data, error } = await db.from("products").select("*").order("sort").order("name");
    if (failed(error, "Products")) return;
    const rows = data || [];
    const inStockReady = rows.filter((p) => !p.made_to_order && p.status === "active");
    main.innerHTML = `
      <div class="page-head"><div><h1>Products &amp; inventory</h1><p>${rows.length} products · ${rows.filter((p) => p.status === "active").length} live · ${inStockReady.reduce((s, p) => s + (p.stock || 0), 0)} ready-to-ship pieces in stock</p></div>
        <div class="row"><button class="btn" id="export" type="button">Export CSV</button><a class="btn btn-gold" href="#/product/new">Add product</a></div></div>
      <form class="filters" id="filters" style="grid-template-columns:2fr 1fr 1fr"><input name="q" type="search" placeholder="Search name or SKU…">
        <select name="category"><option value="">All categories</option>${Object.entries(CATEGORIES).map(([k, v]) => opt(k, v, "")).join("")}</select>
        <select name="status"><option value="">All statuses</option>${Object.entries(PRODUCT_STATUS).map(([k, v]) => opt(k, v, "")).join("")}<option value="low">Low stock (ready to ship, ≤ 1)</option></select></form>
      <div id="out"></div>`;
    const form = $("#filters", main);
    function render() {
      const f = readForm(form), term = (f.q || "").toLowerCase();
      const list = rows.filter((p) => (!f.category || p.category === f.category) &&
        (!f.status || (f.status === "low" ? !p.made_to_order && p.stock <= 1 : p.status === f.status)) &&
        (!term || (p.name + " " + p.id).toLowerCase().includes(term)));
      $("#out", main).innerHTML = list.length ? `<div class="table-wrap"><table><thead><tr><th></th><th>Product</th><th>Category</th><th>Availability</th><th class="num">Stock</th><th>Status</th><th>Home page</th></tr></thead><tbody>
        ${list.map((p) => `<tr class="click" data-id="${esc(p.id)}"><td>${p.images && p.images[0] ? `<img class="thumb" src="${esc(imgUrl(p.images[0]))}" alt="">` : '<div class="thumb"></div>'}</td>
          <td><strong>${esc(p.name)}</strong><br><span class="muted small">${esc(p.id)}${p.sample ? " · sample" : ""}</span></td><td>${esc(CATEGORIES[p.category] || p.category)}</td>
          <td>${p.made_to_order ? "Made to order" : "Ready to ship"}</td><td class="num">${p.made_to_order ? "—" : `${p.stock}${p.stock <= 1 ? " " + badge("overdue", "Low") : ""}`}</td>
          <td>${badge(p.status, PRODUCT_STATUS[p.status])}</td><td>${p.featured ? "Featured" : ""}</td></tr>`).join("")}
        </tbody></table></div>` : '<div class="panel empty">No products match.</div>';
      $$("tr.click", main).forEach((tr) => tr.addEventListener("click", () => { location.hash = "#/product/" + encodeURIComponent(tr.dataset.id); }));
    }
    form.addEventListener("input", render);
    form.addEventListener("change", render);
    $("#export", main).addEventListener("click", () => downloadCSV(`elyra-products-${localISO()}.csv`, rows, [
      ["SKU", "id"], ["Name", "name"], ["Category", (p) => CATEGORIES[p.category]], ["Status", (p) => PRODUCT_STATUS[p.status]],
      ["Made to order", (p) => p.made_to_order ? "Yes" : "No"], ["Stock", "stock"], ["Featured", (p) => p.featured ? "Yes" : "No"],
      ["Metals", (p) => (p.custom?.metals || []).join(" / ")], ["Carat options", (p) => (p.custom?.carats || []).join(" / ")], ["Updated", (p) => fmtDate(p.updated_at)]
    ]));
    render();
  };

  views.product = async (main, rawId) => {
    const id = decodeURIComponent(rawId || "");
    const isNew = id === "new";
    const pricing = (await getSetting("pricing")) || FILE_PRICING;
    const metals = pricing.metals || FILE_PRICING.metals;
    let p = {
      id: "", name: "", category: "rings", occasions: [], description: "", shape: "Round brilliant", cut: "Excellent", size: "",
      engraving: false, featured: false, made_to_order: true, status: "active", stock: 0, images: [], colour_images: {}, sort: 100, sample: false,
      custom: { stones: "centre", pair: false, carats: [0.30, 0.50, 0.70, 1.00], accentCarat: 0, baseWeight: 3, metals: ["gold", "platinum", "silver"],
        defaults: { metal: "gold", purity: "18k", colour: "Yellow", stone: "natural", quality: "premium", carat: 0.50 } }
    };
    if (!isNew) {
      const { data } = await db.from("products").select("*").eq("id", id).maybeSingle();
      if (!data) { main.innerHTML = '<div class="panel empty">Product not found. <a href="#/products">Back</a></div>'; return; }
      p = data;
    }
    const c = p.custom || {};
    const d = c.defaults || {};
    let images = (p.images || []).slice();
    const allPurities = Object.entries(metals).flatMap(([m, v]) => v.purities.map((x) => [x.key, v.label + " " + x.label]));
    const allColours = [...new Set(Object.values(metals).flatMap((v) => v.colours))];

    main.innerHTML = `
      <div class="page-head"><div><a href="#/products" class="small">← All products</a><h1>${isNew ? "Add product" : esc(p.name)}</h1>${isNew ? "" : `<p>SKU ${esc(p.id)} · updated ${fmtDateTime(p.updated_at)}</p>`}</div>
        <div class="row">${isNew ? "" : `<a class="btn" href="${SITE}product.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">View on site ↗</a><button class="btn" id="dup" type="button">Duplicate</button>`}</div></div>
      <form class="form" id="f">
        <div class="panel"><h2>Basics</h2>
          <div class="grid g3"><div class="field"><label>SKU *</label><input name="id" required pattern="[A-Za-z0-9_-]+" value="${esc(p.id)}"${isNew ? "" : " readonly"}><div class="hint">Letters, numbers, - and _. Used in the page link; can't be changed later.</div></div>
            <div class="field"><label>Name *</label><input name="name" required value="${esc(p.name)}"></div>
            <div class="field"><label>Category</label><select name="category">${Object.entries(CATEGORIES).map(([k, v]) => opt(k, v, p.category)).join("")}</select></div></div>
          <div class="field"><label>Description</label><textarea name="description">${esc(p.description)}</textarea></div>
          <div class="field"><label>Occasions</label><div>${Object.entries(OCCASIONS).map(([k, v]) => `<label class="check"><input type="checkbox" data-occ="${k}"${(p.occasions || []).includes(k) ? " checked" : ""}> ${esc(v)}</label>`).join("")}</div></div>
          <div class="grid g3"><div class="field"><label>Diamond shape</label><input name="shape" value="${esc(p.shape)}"></div><div class="field"><label>Cut grade</label><input name="cut" value="${esc(p.cut)}"></div><div class="field"><label>Size / fit note</label><input name="size" value="${esc(p.size)}"></div></div>
        </div>
        <div class="panel"><h2>Availability &amp; inventory</h2>
          <div class="grid g4"><div class="field"><label>Status</label><select name="status">${Object.entries(PRODUCT_STATUS).map(([k, v]) => opt(k, v, p.status)).join("")}</select><div class="hint">Hidden = not shown on the website.</div></div>
            <div class="field"><label>Stock (ready-to-ship pieces)</label><input name="stock" type="number" min="0" step="1" value="${esc(p.stock)}"></div>
            <div class="field"><label>Sort order</label><input name="sort" type="number" step="1" value="${esc(p.sort)}"><div class="hint">Lower numbers show first.</div></div>
            <div class="field"><label>Options</label><label class="check"><input type="checkbox" name="made_to_order"${p.made_to_order ? " checked" : ""}> Made to order</label><br><label class="check"><input type="checkbox" name="featured"${p.featured ? " checked" : ""}> Featured on home page</label><br><label class="check"><input type="checkbox" name="engraving"${p.engraving ? " checked" : ""}> Offer engraving</label><br><label class="check"><input type="checkbox" name="sample"${p.sample ? " checked" : ""}> Sample listing</label></div></div>
        </div>
        <div class="panel"><h2>Photos</h2><p class="muted small">The first photo is the main one. JPG, PNG or WebP up to 10 MB; square photos of at least 1200 px look best.</p>
          <div class="images" id="imgs"></div>
          <div class="row" style="margin-top:12px"><label class="btn">Upload photos<input type="file" id="upload" accept="image/*" multiple hidden></label><span class="muted small" id="up-status"></span></div>
          <div class="field" style="margin-top:14px"><label>Photos for other metals / colours (advanced)</label><textarea name="colour_images" rows="3" placeholder='{"gold:White": ["https://…"], "platinum": ["https://…"]}'>${esc(Object.keys(p.colour_images || {}).length ? JSON.stringify(p.colour_images, null, 2) : "")}</textarea><div class="hint">JSON. Keys: gold:Yellow, gold:White, gold:Rose, platinum, silver. Upload photos above, copy their link, then remove them from the main list.</div></div>
        </div>
        <div class="panel"><h2>Customiser</h2>
          <div class="grid g4"><div class="field"><label>Diamond setting</label><select name="c_stones">${opt("centre", "Centre stone (solitaire / studs)", c.stones)}${opt("accent", "Many small diamonds (pavé, eternity, sets)", c.stones)}</select></div>
            <div class="field"><label>Carat choices *</label><input name="c_carats" required value="${esc((c.carats || []).join(", "))}"><div class="hint">Comma-separated, e.g. 0.30, 0.50, 1.00</div></div>
            <div class="field"><label>Metal weight in 18K gold (g) *</label><input name="c_baseWeight" type="number" min="0.1" step="0.1" required value="${esc(c.baseWeight)}"></div>
            <div class="field"><label>Extra accent diamonds (ct)</label><input name="c_accentCarat" type="number" min="0" step="0.01" value="${esc(c.accentCarat || 0)}"><div class="hint">e.g. a halo around a centre stone</div></div></div>
          <div class="field"><label>Metals offered</label><div>${Object.entries(metals).map(([k, v]) => `<label class="check"><input type="checkbox" data-metal="${k}"${(c.metals || []).includes(k) ? " checked" : ""}> ${esc(v.label)}</label>`).join("")}<label class="check"><input type="checkbox" name="c_pair"${c.pair ? " checked" : ""}> Earrings: carat is for the pair</label></div></div>
          <h3 style="margin-top:8px">Shown first (and used for the price on product cards)</h3>
          <div class="grid g6"><div class="field"><label>Metal</label><select name="d_metal">${Object.entries(metals).map(([k, v]) => opt(k, v.label, d.metal)).join("")}</select></div>
            <div class="field"><label>Purity</label><select name="d_purity">${allPurities.map(([k, v]) => opt(k, v, d.purity)).join("")}</select></div>
            <div class="field"><label>Colour</label><select name="d_colour">${allColours.map((k) => opt(k, k, d.colour)).join("")}</select></div>
            <div class="field"><label>Diamond</label><select name="d_stone">${Object.entries(pricing.stones || FILE_PRICING.stones).map(([k, v]) => opt(k, v.short, d.stone)).join("")}</select></div>
            <div class="field"><label>Quality</label><select name="d_quality">${(pricing.qualities || FILE_PRICING.qualities).map((q) => opt(q.key, q.label, d.quality)).join("")}</select></div>
            <div class="field"><label>Carat</label><input name="d_carat" type="number" min="0.01" step="0.01" value="${esc(d.carat)}"></div></div>
        </div>
        <div class="row"><button class="btn btn-gold" type="submit">${isNew ? "Add product" : "Save product"}</button><span class="spacer"></span>${isNew ? "" : '<button class="btn btn-danger" id="del" type="button">Delete product</button>'}</div>
      </form>`;

    function renderImages() {
      $("#imgs", main).innerHTML = images.length ? images.map((src, i) => `<div class="img-tile"><img src="${esc(imgUrl(src))}" alt="Photo ${i + 1}"><div class="row">
        <button class="btn btn-sm" type="button" data-move="${i}" data-dir="-1"${i === 0 ? " disabled" : ""} aria-label="Move left">←</button>
        <button class="btn btn-sm" type="button" data-move="${i}" data-dir="1"${i === images.length - 1 ? " disabled" : ""} aria-label="Move right">→</button>
        <button class="btn btn-sm btn-danger" type="button" data-remove="${i}" aria-label="Remove">✕</button>
        <button class="btn btn-sm" type="button" data-copy="${i}" aria-label="Copy link">Link</button></div></div>`).join("") : '<p class="muted small">No photos yet.</p>';
    }
    renderImages();
    $("#imgs", main).addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.remove !== undefined) images.splice(Number(b.dataset.remove), 1);
      if (b.dataset.move !== undefined) { const i = Number(b.dataset.move), j = i + Number(b.dataset.dir); [images[i], images[j]] = [images[j], images[i]]; }
      if (b.dataset.copy !== undefined) { navigator.clipboard.writeText(imgUrl(images[Number(b.dataset.copy)])).then(() => toast("Photo link copied.")); return; }
      renderImages();
    });
    $("#upload", main).addEventListener("change", async (e) => {
      const sku = ($("[name=id]", main).value || "new").replace(/[^A-Za-z0-9_-]/g, "");
      const files = [...e.target.files];
      for (let i = 0; i < files.length; i++) {
        $("#up-status", main).textContent = `Uploading ${i + 1} of ${files.length}…`;
        const url = await uploadMedia("products/" + sku, files[i]);
        if (url) images.push(url);
      }
      $("#up-status", main).textContent = files.length ? "Uploaded. Remember to save." : "";
      e.target.value = "";
      renderImages();
    });

    $("#f", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      const carats = String(f.c_carats).split(",").map((x) => parseFloat(x)).filter((x) => x > 0).sort((a, b) => a - b);
      const metalsOn = $$("[data-metal]", main).filter((x) => x.checked).map((x) => x.dataset.metal);
      if (!carats.length) return toast("Add at least one carat choice.", "error");
      if (!metalsOn.length) return toast("Choose at least one metal.", "error");
      let colourImages = {};
      if (f.colour_images) { try { colourImages = JSON.parse(f.colour_images); } catch (err) { return toast("Photos for other metals: the JSON isn't valid.", "error"); } }
      const defCarat = carats.includes(f.d_carat) ? f.d_carat : carats[0];
      const row = {
        id: f.id, name: f.name, category: f.category, description: f.description || "", shape: f.shape || "", cut: f.cut || "", size: f.size || "",
        occasions: $$("[data-occ]", main).filter((x) => x.checked).map((x) => x.dataset.occ),
        status: f.status, stock: f.stock || 0, sort: f.sort ?? 100, made_to_order: f.made_to_order, featured: f.featured, engraving: f.engraving, sample: f.sample,
        images, colour_images: colourImages,
        custom: { stones: f.c_stones, pair: f.c_pair, carats, accentCarat: f.c_accentCarat || 0, baseWeight: f.c_baseWeight, metals: metalsOn,
          defaults: { metal: metalsOn.includes(f.d_metal) ? f.d_metal : metalsOn[0], purity: f.d_purity, colour: f.d_colour, stone: f.d_stone, quality: f.d_quality, carat: defCarat } }
      };
      await busy($("button[type=submit]", e.target), async () => {
        const { error } = isNew ? await db.from("products").insert(row) : await db.from("products").update(row).eq("id", p.id);
        if (failed(error, "Save")) return;
        toast("Product saved. It's live on the website now.");
        if (isNew) location.hash = "#/product/" + encodeURIComponent(row.id);
      });
    });
    const del = $("#del", main);
    if (del) del.addEventListener("click", async () => {
      if (!confirm(`Delete ${p.name}? Tip: set the status to "Hidden" instead to keep its history.`)) return;
      const { error } = await db.from("products").delete().eq("id", p.id);
      if (!failed(error)) { toast("Product deleted."); location.hash = "#/products"; }
    });
    const dup = $("#dup", main);
    if (dup) dup.addEventListener("click", async () => {
      const newId = prompt("SKU for the copy:", p.id + "-2");
      if (!newId) return;
      const copy = Object.assign({}, p, { id: newId, name: p.name + " (copy)", status: "hidden", featured: false });
      delete copy.created_at; delete copy.updated_at;
      const { error } = await db.from("products").insert(copy);
      if (!failed(error, "Duplicate")) { toast("Copy created (hidden)."); location.hash = "#/product/" + encodeURIComponent(newId); }
    });
  };

  /* ---------- blog ---------- */
  views.blog = async (main) => {
    const { data, error } = await db.from("posts").select("id,slug,title,status,published_at,updated_at,tags").order("updated_at", { ascending: false });
    if (failed(error, "Blog")) return;
    const rows = data || [];
    main.innerHTML = `
      <div class="page-head"><div><h1>Blog</h1><p>${rows.filter((r) => r.status === "published").length} published · ${rows.filter((r) => r.status === "draft").length} drafts</p></div>
        <a class="btn btn-gold" href="#/post/new">Write an article</a></div>
      ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Title</th><th>Tags</th><th>Status</th><th>Published</th><th>Last edited</th></tr></thead><tbody>
        ${rows.map((r) => `<tr class="click" data-id="${r.id}"><td><strong>${esc(r.title)}</strong><br><span class="muted small">/${esc(r.slug)}</span></td><td>${esc((r.tags || []).join(", "))}</td><td>${badge(r.status, r.status === "published" ? "Published" : "Draft")}</td><td>${r.published_at ? fmtDate(r.published_at) : "—"}</td><td>${fmtDateTime(r.updated_at)}</td></tr>`).join("")}
      </tbody></table></div>` : `<div class="panel empty">No articles yet. Ideas: "How to choose an engagement ring", "Natural vs lab-grown diamonds", "Planning bridal jewellery for a Bihar wedding".</div>`}`;
    $$("tr.click", main).forEach((tr) => tr.addEventListener("click", () => { location.hash = "#/post/" + tr.dataset.id; }));
  };

  views.post = async (main, id) => {
    const isNew = id === "new";
    let p = { title: "", slug: "", excerpt: "", body: "", cover_image: "", tags: [], status: "draft", published_at: null, seo_title: "", seo_description: "", author_name: me.profile.full_name || "" };
    if (!isNew) {
      const { data } = await db.from("posts").select("*").eq("id", id).maybeSingle();
      if (!data) { main.innerHTML = '<div class="panel empty">Article not found. <a href="#/blog">Back</a></div>'; return; }
      p = data;
    }
    let cover = p.cover_image || "";
    let slugTouched = !isNew;
    const toLocalInput = (d) => d ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
    main.innerHTML = `
      <div class="page-head"><div><a href="#/blog" class="small">← All articles</a><h1>${isNew ? "New article" : esc(p.title)}</h1></div>
        <div class="row">${!isNew && p.status === "published" ? `<a class="btn" href="${SITE}post.html?slug=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">View on site ↗</a>` : ""}</div></div>
      <form class="form" id="f">
        <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr)">
          <div class="panel form">
            <div class="field"><label>Title *</label><input name="title" required value="${esc(p.title)}"></div>
            <div class="field"><label>Link (slug) *</label><input name="slug" required pattern="[a-z0-9-]+" value="${esc(p.slug)}"><div class="hint">post.html?slug=<span id="slug-preview">${esc(p.slug)}</span></div></div>
            <div class="field"><label>Short summary</label><textarea name="excerpt" rows="2" style="min-height:70px">${esc(p.excerpt)}</textarea></div>
            <div class="field"><label>Article</label>
              <div class="tabs"><button class="btn btn-sm on" type="button" data-tab="write">Write</button><button class="btn btn-sm" type="button" data-tab="preview">Preview</button></div>
              <div class="md-toolbar" id="tools">
                <button class="btn btn-sm" type="button" data-md="**|**" title="Bold"><b>B</b></button><button class="btn btn-sm" type="button" data-md="_|_" title="Italic"><i>I</i></button>
                <button class="btn btn-sm" type="button" data-md="\n## |" title="Heading">H2</button><button class="btn btn-sm" type="button" data-md="\n### |" title="Sub-heading">H3</button>
                <button class="btn btn-sm" type="button" data-md="\n- |" title="Bullet list">• List</button><button class="btn btn-sm" type="button" data-md="\n1. |" title="Numbered list">1. List</button>
                <button class="btn btn-sm" type="button" data-md="\n> |" title="Quote">“ Quote</button><button class="btn btn-sm" type="button" data-md="[|](https://)" title="Link">Link</button>
                <label class="btn btn-sm">Image<input type="file" id="body-img" accept="image/*" hidden></label>
              </div>
              <textarea class="md" name="body" id="body" placeholder="Write in Markdown: ## for headings, **bold**, - for lists.">${esc(p.body)}</textarea>
              <div class="preview prose" id="preview" hidden></div>
            </div>
          </div>
          <div>
            <div class="panel form"><h2>Publish</h2>
              <div class="field"><label>Status</label><select name="status">${opt("draft", "Draft (hidden)", p.status)}${opt("published", "Published (live)", p.status)}</select></div>
              <div class="field"><label>Publish date</label><input name="published_at" type="datetime-local" value="${esc(toLocalInput(p.published_at))}"><div class="hint">Left empty, it's set when you publish.</div></div>
              <div class="field"><label>Author</label><input name="author_name" value="${esc(p.author_name || "")}"></div>
              <div class="field"><label>Tags</label><input name="tags" data-list value="${esc((p.tags || []).join(", "))}" placeholder="Bridal, Guides"></div>
              <div class="row"><button class="btn btn-gold" type="submit">Save</button><span class="spacer"></span>${isNew ? "" : '<button class="btn btn-danger" id="del" type="button">Delete</button>'}</div>
            </div>
            <div class="panel form"><h2>Cover image</h2><div id="cover"></div><label class="btn">Upload cover<input type="file" id="cover-file" accept="image/*" hidden></label></div>
            <div class="panel form"><h2>Search engines</h2>
              <div class="field"><label>SEO title <span class="muted" id="st-n"></span></label><input name="seo_title" maxlength="70" value="${esc(p.seo_title || "")}"></div>
              <div class="field"><label>SEO description <span class="muted" id="sd-n"></span></label><textarea name="seo_description" maxlength="170" rows="3" style="min-height:80px">${esc(p.seo_description || "")}</textarea><div class="hint">Shown in Google results. About 150 characters.</div></div>
            </div>
          </div>
        </div>
      </form>`;
    const form = $("#f", main), body = $("#body", main);
    const renderCover = () => { $("#cover", main).innerHTML = cover ? `<img class="cover-preview" src="${esc(cover)}" alt=""><button class="btn btn-sm btn-danger" type="button" id="cover-x">Remove cover</button>` : '<p class="muted small">No cover image.</p>'; const x = $("#cover-x", main); if (x) x.onclick = () => { cover = ""; renderCover(); }; };
    renderCover();
    const counts = () => { $("#st-n", main).textContent = `(${form.seo_title.value.length}/70)`; $("#sd-n", main).textContent = `(${form.seo_description.value.length}/170)`; };
    counts();
    form.seo_title.addEventListener("input", counts);
    form.seo_description.addEventListener("input", counts);
    form.title.addEventListener("input", () => { if (!slugTouched) { form.slug.value = slugify(form.title.value); $("#slug-preview", main).textContent = form.slug.value; } });
    form.slug.addEventListener("input", () => { slugTouched = true; $("#slug-preview", main).textContent = form.slug.value; });

    function insert(before, after = "") {
      const s = body.selectionStart, e = body.selectionEnd, sel = body.value.slice(s, e);
      body.setRangeText(before + sel + after, s, e, "end");
      body.focus();
    }
    $("#tools", main).addEventListener("click", (e) => {
      const b = e.target.closest("button[data-md]");
      if (!b) return;
      const [a, z] = b.dataset.md.replace(/\\n/g, "\n").split("|");
      insert(a, z);
    });
    $("#body-img", main).addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      toast("Uploading image…");
      const url = await uploadMedia("blog", file);
      if (url) insert(`\n![${file.name.replace(/\.[^.]+$/, "")}](${url})\n`);
      e.target.value = "";
    });
    $("#cover-file", main).addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      toast("Uploading cover…");
      const url = await uploadMedia("blog", file);
      if (url) { cover = url; renderCover(); }
      e.target.value = "";
    });
    $$("[data-tab]", main).forEach((t) => t.addEventListener("click", () => {
      const preview = t.dataset.tab === "preview";
      $$("[data-tab]", main).forEach((x) => x.classList.toggle("on", x === t));
      body.hidden = preview; $("#tools", main).hidden = preview; $("#preview", main).hidden = !preview;
      if (preview) $("#preview", main).innerHTML = DOMPurify.sanitize(marked.parse(body.value || "*Nothing written yet.*"));
    }));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(form);
      const row = { title: f.title, slug: slugify(f.slug), excerpt: f.excerpt || "", body: body.value, cover_image: cover || null, tags: f.tags || [],
        status: f.status, author_name: f.author_name, seo_title: f.seo_title, seo_description: f.seo_description,
        published_at: f.published_at ? new Date(f.published_at).toISOString() : (f.status === "published" ? (p.published_at || new Date().toISOString()) : null) };
      await busy($("button[type=submit]", form), async () => {
        const q = isNew ? db.from("posts").insert(row).select("id").single() : db.from("posts").update(row).eq("id", p.id).select("id").single();
        const { data, error } = await q;
        if (failed(error, "Save")) return;
        toast(row.status === "published" ? "Article published." : "Draft saved.");
        if (isNew) location.hash = "#/post/" + data.id;
      });
    });
    const del = $("#del", main);
    if (del) del.addEventListener("click", async () => {
      if (!confirm("Delete this article permanently?")) return;
      const { error } = await db.from("posts").delete().eq("id", p.id);
      if (!failed(error)) { toast("Article deleted."); location.hash = "#/blog"; }
    });
  };

  /* ---------- reviews ---------- */
  views.reviews = async (main) => {
    const { data, error } = await db.from("reviews").select("*").order("sort").order("created_at", { ascending: false });
    if (failed(error, "Reviews")) return;
    const rows = data || [];
    main.innerHTML = `
      <div class="page-head"><div><h1>Reviews &amp; testimonials</h1><p>Published reviews appear in "Customer stories" on the home page (up to 6). Only add real reviews, with the customer's permission.</p></div></div>
      <div class="grid" style="grid-template-columns:minmax(0,3fr) minmax(0,2fr)">
        <div id="list"></div>
        <form class="panel form" id="f"><h2 id="f-title">Add a review</h2><input type="hidden" name="id">
          <div class="grid g2"><div class="field"><label>Customer first name *</label><input name="name" required></div><div class="field"><label>City</label><input name="city"></div></div>
          <div class="field"><label>Review *</label><textarea name="text" required></textarea></div>
          <div class="grid g3"><div class="field"><label>Stars</label><select name="stars">${[5, 4, 3, 2, 1].map((n) => opt(n, "★".repeat(n), 5)).join("")}</select></div>
            <div class="field"><label>Source</label><select name="source">${["Google", "Instagram", "Facebook", "WhatsApp", "In person"].map((s) => opt(s, s, "Google")).join("")}</select></div>
            <div class="field"><label>Order</label><input name="sort" type="number" value="100"></div></div>
          <label class="check"><input type="checkbox" name="published" checked> Show on website</label>
          <div class="row"><button class="btn btn-gold" type="submit">Save review</button><button class="btn" type="reset" id="clear">Clear</button><span class="spacer"></span><button class="btn btn-danger" type="button" id="del" hidden>Delete</button></div>
        </form>
      </div>`;
    const form = $("#f", main);
    $("#list", main).innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Review</th><th>Stars</th><th>Shown</th></tr></thead><tbody>
      ${rows.map((r) => `<tr class="click" data-id="${r.id}"><td><strong>${esc(r.name)}</strong>${r.city ? ", " + esc(r.city) : ""} <span class="muted small">· ${esc(r.source)}</span><br>${esc(r.text.slice(0, 140))}${r.text.length > 140 ? "…" : ""}</td><td>${"★".repeat(r.stars)}</td><td>${r.published ? badge("published", "Yes") : badge("draft", "No")}</td></tr>`).join("")}
      </tbody></table></div>` : '<div class="panel empty">No reviews yet. Copy your best Google reviews here.</div>';
    $$("tr.click", main).forEach((tr) => tr.addEventListener("click", () => {
      const r = rows.find((x) => x.id === tr.dataset.id);
      ["id", "name", "city", "text", "stars", "source", "sort"].forEach((k) => { form[k].value = r[k] ?? ""; });
      form.published.checked = r.published;
      $("#f-title", main).textContent = "Edit review";
      $("#del", main).hidden = false;
    }));
    $("#clear", main).addEventListener("click", () => { $("#f-title", main).textContent = "Add a review"; $("#del", main).hidden = true; });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(form);
      const id = f.id; delete f.id;
      f.stars = Number(f.stars); f.sort = f.sort ?? 100;
      await busy($("button[type=submit]", form), async () => {
        const { error } = id ? await db.from("reviews").update(f).eq("id", id) : await db.from("reviews").insert(f);
        if (!failed(error, "Save")) { toast("Review saved."); route(); }
      });
    });
    $("#del", main).addEventListener("click", async () => {
      if (!confirm("Delete this review?")) return;
      const { error } = await db.from("reviews").delete().eq("id", form.id.value);
      if (!failed(error)) { toast("Review deleted."); route(); }
    });
  };

  /* ---------- rates & settings ---------- */
  const SITE_FIELDS = [
    ["Business", [["brand", "Brand name"], ["legalName", "Legal name (as on GST certificate)"], ["gstin", "GSTIN"], ["city", "City"]]],
    ["Contact", [["phone", "Phone"], ["phoneAlt", "Second phone"], ["whatsapp", "WhatsApp number (digits with country code, e.g. 919431027748)"], ["email", "Email"], ["address", "Address"], ["hours", "Opening hours"], ["mapsUrl", "Google Maps link"]]],
    ["Online", [["siteUrl", "Website address"], ["instagram", "Instagram link"], ["facebook", "Facebook link"], ["googleReviewsUrl", "Google reviews link"], ["googleRating", "Google rating (e.g. 4.8)"], ["ga4Id", "Google Analytics ID (G-…)"]]],
    ["Policies", [["returnDays", "Return window (days)"], ["dispatchReady", "Ready-to-ship dispatch time"], ["dispatchMade", "Made-to-order time"], ["deliveryTime", "Delivery time"], ["refundDays", "Refund time"], ["advancePayment", "Advance for made-to-order"], ["freeResizeWindow", "Free resize window"], ["certLab", "Certificate lab (natural)"], ["certThreshold", "Certificate from (carat)"], ["policyUpdated", "Policies last updated"]]],
    ["Exchange & buyback", [["exchangeValue", "Exchange value: natural"], ["buybackValue", "Buyback value: natural"], ["exchangeValueLab", "Exchange value: lab-grown"], ["buybackValueLab", "Buyback value: lab-grown"]]],
    ["Grievance Officer", [["grievanceName", "Name"], ["grievanceDesignation", "Designation"], ["grievanceEmail", "Email"], ["grievancePhone", "Phone"]]]
  ];

  views.settings = async (main) => {
    const [pricingDB, siteDB, alertsDB] = await Promise.all([getSetting("pricing"), getSetting("site"), isOwner() ? getSetting("alerts") : null]);
    const pr = Object.assign({}, FILE_PRICING, pricingDB || {});
    const site = Object.assign({}, FILE_SITE, siteDB || {});
    const alerts = alertsDB || { enabled: true, emails: [site.email].filter(Boolean) };
    const Q = pr.qualities || [];
    const num = (name, value, step = "1") => `<input type="number" name="${name}" min="0" step="${step}" value="${esc(value)}">`;
    const stoneTable = (title, key) => `<h3>${title} (₹ per carat)</h3><div class="table-wrap"><table><thead><tr><th>Diamond</th>${Q.map((q) => `<th>${esc(q.label)}<br><span class="muted small">${esc(q.color)} · ${esc(q.clarity)}</span></th>`).join("")}</tr></thead><tbody>
      ${Object.entries(pr.stones || {}).map(([s, v]) => `<tr><th>${esc(v.short)}</th>${Q.map((q) => `<td>${num(`${key}.${s}.${q.key}`, pr[key]?.[s]?.[q.key] ?? 0, "500")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;

    main.innerHTML = `
      <div class="page-head"><div><h1>Rates &amp; settings</h1><p>Changes go live on the website as soon as you save.</p></div></div>
      <form class="panel form" id="rates"><h2>Metal &amp; diamond rates</h2>
        <p class="muted small">Last updated ${esc(pr.ratesUpdated || "—")}. Update metal rates often; gold moves daily. Prices on the site are shown as estimates.</p>
        <div class="table-wrap"><table><thead><tr><th>Metal</th><th>Rate (₹/g, pure metal)</th><th>Making &amp; setting (₹/g)</th></tr></thead><tbody>
          ${Object.entries(pr.metals || {}).map(([m, v]) => `<tr><th>${esc(v.label)}</th><td>${num("rates." + m, pr.rates?.[m] ?? 0)}</td><td>${num("making." + m, v.making ?? 0)}</td></tr>`).join("")}</tbody></table></div>
        <div class="grid g4"><div class="field"><label>GST (%)</label>${num("gstPct", Math.round((pr.gst || 0) * 1000) / 10, "0.1")}</div><div class="field"><label>Round prices to (₹)</label>${num("roundTo", pr.roundTo || 100)}</div>
          <div class="field"><label>Engraving charge (₹)</label>${num("engravingCharge", pr.engravingCharge || 0)}</div><div class="field"><label>Lab report from (carat)</label>${num("certificateFrom", pr.certificateFrom || 0.3, "0.01")}</div></div>
        ${stoneTable("Centre stones, 0.50 ct", "centrePerCarat")}
        ${stoneTable("Accent diamonds (pavé, eternity, sets)", "accentPerCarat")}
        <h3>Size factors for centre stones</h3><p class="muted small">Bigger stones cost more per carat. Each factor applies from that carat upward (0.50 ct = 1.00).</p>
        <div class="table-wrap"><table><thead><tr><th>From (ct)</th>${Object.values(pr.stones || {}).map((v) => `<th>${esc(v.short)}</th>`).join("")}</tr></thead><tbody>
          ${(pr.sizeFactors || []).map((b, i) => `<tr><td>${num(`sf.${i}.from`, b.from, "0.01")}</td>${Object.keys(pr.stones || {}).map((s) => `<td>${num(`sf.${i}.${s}`, b[s], "0.01")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <div class="row"><button class="btn btn-gold" type="submit">Save rates</button></div>
      </form>
      ${isOwner() ? `
      <form class="panel form" id="site"><h2>Business &amp; policy settings</h2>
        ${SITE_FIELDS.map(([group, fields]) => `<fieldset><legend>${esc(group)}</legend><div class="grid g2">${fields.map(([k, label]) => `<div class="field"><label>${esc(label)}</label><input name="${k}" value="${esc(site[k] ?? "")}"></div>`).join("")}</div></fieldset>`).join("")}
        <div class="row"><button class="btn btn-gold" type="submit">Save settings</button></div>
      </form>
      <form class="panel form" id="alerts"><h2>New-lead email alerts</h2>
        <label class="check"><input type="checkbox" name="enabled"${alerts.enabled ? " checked" : ""}> Email me when a new lead arrives</label>
        <div class="field"><label>Send alerts to</label><input name="emails" data-list value="${esc((alerts.emails || []).join(", "))}" placeholder="owner@example.com, staff@example.com"><div class="hint">Comma-separated. Needs the one-time email setup in supabase/SETUP.md (step 6).</div></div>
        <div class="row"><button class="btn btn-gold" type="submit">Save alerts</button></div>
      </form>` : '<div class="panel"><p class="muted">Only the owner can change business settings and alerts.</p></div>'}`;

    $("#rates", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      const next = JSON.parse(JSON.stringify(pr));
      Object.keys(next.metals || {}).forEach((m) => { next.rates[m] = f["rates." + m] || 0; next.metals[m].making = f["making." + m] || 0; });
      next.gst = (f.gstPct || 0) / 100;
      next.roundTo = f.roundTo || 1;
      next.engravingCharge = f.engravingCharge || 0;
      next.certificateFrom = f.certificateFrom || 0;
      ["centrePerCarat", "accentPerCarat"].forEach((key) => Object.keys(next.stones).forEach((s) => Q.forEach((q) => { next[key][s][q.key] = f[`${key}.${s}.${q.key}`] || 0; })));
      next.sizeFactors = (next.sizeFactors || []).map((b, i) => { const o = { from: f[`sf.${i}.from`] || 0 }; Object.keys(next.stones).forEach((s) => { o[s] = f[`sf.${i}.${s}`] || 0; }); return o; }).sort((a, b) => a.from - b.from);
      next.ratesUpdated = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      await busy($("button", e.target), async () => { if (await saveSetting("pricing", next)) { toast("Rates saved. Website prices updated."); route(); } });
    });
    const siteForm = $("#site", main);
    if (siteForm) siteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      const next = Object.assign({}, site);
      Object.keys(f).forEach((k) => { next[k] = f[k] ?? ""; });
      delete next.reviews; delete next.showSetupBanner; delete next.showSampleBadges;
      await busy($("button", e.target), async () => { if (await saveSetting("site", next)) toast("Settings saved. The website is updated."); });
    });
    const alertForm = $("#alerts", main);
    if (alertForm) alertForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      await busy($("button", e.target), async () => { if (await saveSetting("alerts", { enabled: f.enabled, emails: f.emails || [] })) toast("Alert settings saved."); });
    });
  };

  /* ---------- staff (owner only) ---------- */
  views.staff = async (main) => {
    const [P, I] = await Promise.all([db.from("profiles").select("*").order("created_at"), db.from("staff_invites").select("*").order("invited_at")]);
    const people = P.data || [], invites = I.data || [];
    main.innerHTML = `
      <div class="page-head"><div><h1>Staff</h1><p>Owners can do everything. Staff can't change business settings, alerts or staff.</p></div></div>
      <div class="grid g2">
        <div>
          <div class="table-wrap"><table><thead><tr><th>Person</th><th>Role</th><th>Since</th><th></th></tr></thead><tbody>
            ${people.map((p) => `<tr><td><strong>${esc(p.full_name || "—")}</strong><br><span class="muted small">${esc(p.email)}</span></td>
              <td>${p.id === me.user.id ? badge("active", p.role === "owner" ? "Owner (you)" : "Staff") : `<select data-role="${p.id}">${opt("staff", "Staff", p.role)}${opt("owner", "Owner", p.role)}</select>`}</td>
              <td>${fmtDate(p.created_at)}</td><td>${p.id === me.user.id ? "" : `<button class="btn btn-sm btn-danger" type="button" data-remove="${p.id}">Remove access</button>`}</td></tr>`).join("")}
          </tbody></table></div>
          ${invites.length ? `<div class="panel" style="margin-top:18px"><h2>Pending invites</h2><ul class="list">${invites.map((i) => `<li><span>${esc(i.email)} · ${esc(i.role)}</span><button class="btn btn-sm" type="button" data-uninvite="${esc(i.email)}">Cancel</button></li>`).join("")}</ul></div>` : ""}
        </div>
        <form class="panel form" id="f"><h2>Invite someone</h2>
          <div class="field"><label>Email</label><input name="email" type="email" required></div>
          <div class="field"><label>Role</label><select name="role">${opt("staff", "Staff", "staff")}${opt("owner", "Owner", "")}</select></div>
          <button class="btn btn-gold" type="submit">Send invite</button>
          <p class="small muted">Then share this sign-up link with them: <br><code>${esc(BASE)}#/signup</code></p>
        </form>
      </div>`;
    $("#f", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      const { error } = await db.from("staff_invites").upsert({ email: f.email.toLowerCase(), role: f.role });
      if (!failed(error, "Invite")) { toast("Invite saved. Share the sign-up link."); route(); }
    });
    $$("[data-role]", main).forEach((s) => s.addEventListener("change", async () => {
      const { error } = await db.from("profiles").update({ role: s.value }).eq("id", s.dataset.role);
      if (!failed(error)) { staffCache = null; toast("Role updated."); }
    }));
    $$("[data-remove]", main).forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Remove this person's dashboard access?")) return;
      const { error } = await db.from("profiles").delete().eq("id", b.dataset.remove);
      if (!failed(error)) { staffCache = null; toast("Access removed."); route(); }
    }));
    $$("[data-uninvite]", main).forEach((b) => b.addEventListener("click", async () => {
      const { error } = await db.from("staff_invites").delete().eq("email", b.dataset.uninvite);
      if (!failed(error)) route();
    }));
  };

  /* ---------- my account ---------- */
  views.account = async (main) => {
    main.innerHTML = `
      <div class="page-head"><div><h1>My account</h1><p>${esc(me.user.email)}</p></div></div>
      <div class="grid g2">
        <form class="panel form" id="name"><h2>Your name</h2><div class="field"><label>Name shown to the team</label><input name="full_name" required value="${esc(me.profile.full_name || "")}"></div><button class="btn btn-gold" type="submit">Save</button></form>
        <form class="panel form" id="pw"><h2>Change password</h2><div class="field"><label>New password</label><input name="password" type="password" minlength="8" autocomplete="new-password" required></div>
          <div class="field"><label>Repeat</label><input name="password2" type="password" minlength="8" autocomplete="new-password" required></div><button class="btn btn-gold" type="submit">Update password</button></form>
      </div>`;
    $("#name", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      const { error } = await db.from("profiles").update({ full_name: f.full_name }).eq("id", me.user.id);
      if (!failed(error)) { me.profile.full_name = f.full_name; staffCache = null; toast("Name saved."); renderShell("account"); }
    });
    $("#pw", main).addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = readForm(e.target);
      if (f.password !== f.password2) return toast("The passwords don't match.", "error");
      const { error } = await db.auth.updateUser({ password: f.password });
      if (!failed(error)) { e.target.reset(); toast("Password updated."); }
    });
  };


  /* ---------- start ---------- */
  window.addEventListener("hashchange", route);
  db.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") location.hash = "#/reset";
    else if (event === "SIGNED_IN" && /access_token=/.test(location.hash)) location.hash = "#/dashboard";
    else if (event === "SIGNED_OUT") { me = null; staffCache = null; location.hash = "#/login"; }
  });
  route();
})();
