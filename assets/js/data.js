/* ============================================================
   ELYRA LIVE DATA
   When Supabase is connected, loads products, rates, site
   settings and reviews from the database before the page
   renders. If Supabase is not set up or does not answer within
   a few seconds, the site uses the built-in files instead.
   ============================================================ */
(function () {
  "use strict";
  var cfg = window.ELYRA_SUPABASE || {};
  var LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  var client = null;
  window.ElyraDB = null;

  // Load the Supabase library only when the site is connected to a project
  function connect() {
    if (!cfg.url || !cfg.anonKey) return Promise.resolve();
    return new Promise(function (resolve) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var tag = document.createElement("script");
      tag.src = LIB;
      tag.onload = resolve;
      tag.onerror = resolve;
      document.head.appendChild(tag);
    }).then(function () {
      if (window.supabase && window.supabase.createClient) {
        client = window.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false } });
        window.ElyraDB = client;
      }
    });
  }

  function toProduct(r) {
    return {
      id: r.id, name: r.name, category: r.category, occasions: r.occasions || [],
      featured: r.featured, madeToOrder: r.made_to_order, sample: r.sample,
      shape: r.shape, cut: r.cut, size: r.size, engraving: r.engraving,
      images: r.images || [], colourImages: r.colour_images || {},
      description: r.description, custom: r.custom, status: r.status, stock: r.stock
    };
  }

  function load() {
    if (!client) return Promise.resolve();
    return Promise.all([
      client.from("products").select("*").order("sort").order("name"),
      client.from("settings").select("key,value"),
      client.from("reviews").select("name,city,text,stars,source").order("sort").order("created_at", { ascending: false }).limit(6)
    ]).then(function (res) {
      var products = res[0], settings = res[1], reviews = res[2];
      if (!products.error && products.data && products.data.length) {
        window.ELYRA_PRODUCTS = products.data.filter(function (r) { return r.custom; }).map(toProduct);
      }
      if (!settings.error && settings.data) {
        settings.data.forEach(function (s) {
          if (s.key === "site") Object.assign(window.ELYRA, s.value);
          if (s.key === "pricing") window.ELYRA_PRICING = Object.assign({}, window.ELYRA_PRICING, s.value);
        });
      }
      if (!reviews.error && reviews.data) window.ELYRA.reviews = reviews.data;
    }).catch(function () { /* fall back to the built-in files */ });
  }

  var timeout = new Promise(function (resolve) { setTimeout(resolve, 5000); });
  window.ElyraDataReady = Promise.race([connect().then(load), timeout]);
})();
