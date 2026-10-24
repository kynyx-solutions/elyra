/* ============================================================
   ELYRA SITE SCRIPT
   Builds the shared header/footer, fills in details from
   config.js, renders the catalogue and sends forms to WhatsApp.
   You normally do not need to edit this file.
   ============================================================ */
(function () {
  "use strict";

  var C = window.ELYRA || {};
  var PRODUCTS = window.ELYRA_PRODUCTS || [];

  var CATEGORIES = {
    rings: "Rings",
    earrings: "Earrings",
    pendants: "Pendants & Necklaces",
    bracelets: "Bracelets & Bangles",
    bridal: "Bridal Sets",
    mangalsutra: "Mangalsutras"
  };
  var OCCASIONS = {
    engagement: "Engagement",
    bridal: "Wedding & Bridal",
    everyday: "Everyday",
    gifting: "Gifting",
    statement: "Statement & Occasion"
  };
  var METALS = { gold: "Gold", platinum: "Platinum", silver: "Silver" };
  var PRICE_BANDS = [
    { key: "under-50k", label: "Up to ₹50,000", min: -1, max: 50000 },
    { key: "50k-1l", label: "₹50,001 – ₹1,00,000", min: 50000, max: 100000 },
    { key: "1l-3l", label: "₹1,00,001 – ₹3,00,000", min: 100000, max: 300000 },
    { key: "3l-plus", label: "Above ₹3,00,000", min: 300000, max: Infinity }
  ];
  var POLICIES = [
    ["shipping.html", "Shipping & Delivery"],
    ["returns.html", "Returns, Refunds & Cancellations"],
    ["exchange-buyback.html", "Exchange & Buyback"],
    ["certification.html", "Certification & Hallmarking"],
    ["privacy.html", "Privacy Policy"],
    ["terms.html", "Terms of Use & Sale"],
    ["grievance.html", "Grievance Redressal"]
  ];

  var DIAMOND = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 10h36l10 14-28 32L4 24z"/><path d="M4 24h56M24 10l-6 14 14 32 14-32-6-14M18 24l6-14M46 24l-6-14"/></svg>';
  var WA_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.5.7 4.8 2 6.8L3 29l6.8-2.2c1.9 1 4 1.6 6.2 1.6 7 0 12.7-5.7 12.7-12.7S23 3 16 3zm0 23.1c-2 0-3.9-.5-5.5-1.5l-.4-.2-4 1.3 1.3-3.9-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.8C5.4 9.8 10.2 5 16 5s10.6 4.8 10.6 10.6S21.8 26.1 16 26.1zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>';

  /* ---------- helpers ---------- */
  function get(key) { return C[key]; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function inr(n) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  }
  function waLink(msg) {
    return "https://wa.me/" + String(C.whatsapp || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
  }
  function page() {
    var f = location.pathname.split("/").pop();
    return f === "" ? "index.html" : f;
  }
  function isPlaceholder(v) { return !v || /X{3,}|XX%|8000XX|yourdomain/.test(String(v)); }

  /* ---------- shared header & footer ---------- */
  function headerHTML() {
    var links = [
      ["shop.html", "Shop"],
      ["bridal.html", "Bridal"],
      ["custom.html", "Bespoke"],
      ["learn.html", "Diamond Guide"],
      ["about.html", "About"],
      ["consultation.html", "Book a Consultation"],
      ["contact.html", "Contact"]
    ];
    var here = page();
    var nav = links.map(function (l) {
      var cur = here === l[0] || (here === "product.html" && l[0] === "shop.html");
      return '<a href="' + l[0] + '"' + (cur ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
    }).join("");
    return '<a class="skip" href="#main">Skip to content</a>' +
      '<header class="site-header"><div class="wrap hdr">' +
      '<a class="logo" href="index.html" aria-label="Elyra by Shree Creations, home"><img class="logo-img" src="assets/img/logo.jpg" alt="Elyra by Shree Creations"></a>' +
      '<nav class="nav" id="nav" aria-label="Main">' + nav + "</nav>" +
      '<a class="btn btn-gold btn-sm hdr-cta" href="#" data-wa="Hi Elyra, I would like help choosing a piece.">WhatsApp us</a>' +
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>' +
      "</div></header>";
  }

  function footerHTML() {
    var shop = '<li><a href="shop.html">All jewellery</a></li>' + Object.keys(CATEGORIES).map(function (k) {
      return '<li><a href="shop.html?category=' + k + '">' + CATEGORIES[k] + "</a></li>";
    }).join("");
    return '<footer class="site-footer"><div class="wrap">' +
      '<div class="ftr">' +
        '<div><a class="logo" href="index.html"><img class="logo-img logo-img-lg" src="assets/img/logo.jpg" alt="Elyra by Shree Creations"></a>' +
        '<p class="muted" style="margin-top:18px">Bespoke diamond jewellery, natural or lab-grown, from a family of gem merchants four generations strong. Forever, for everyone.</p>' +
        '<ul class="ftr-contact">' +
          '<li><span data-cfg="address"></span></li>' +
          '<li><a data-cfg-href="phone" data-cfg="phone" href="#"></a>' + (C.phoneAlt ? ' · <a data-cfg-href="phoneAlt" data-cfg="phoneAlt" href="#"></a>' : "") + "</li>" +
          '<li><a data-cfg-href="email" data-cfg="email" href="#"></a></li>' +
          '<li class="muted" data-cfg="hours"></li>' +
        "</ul>" +
        '<p class="social"><a data-cfg-href="instagram" href="#" target="_blank" rel="noopener">Instagram</a> · <a data-cfg-href="facebook" href="#" target="_blank" rel="noopener">Facebook</a> · <a data-cfg-href="googleReviewsUrl" href="#" target="_blank" rel="noopener">Google</a></p></div>' +
        "<div><h4>Shop</h4><ul>" + shop + "</ul></div>" +
        '<div><h4>Help</h4><ul><li><a href="custom.html">You dream it, we create it</a></li><li><a href="consultation.html">Book a consultation</a></li><li><a href="faq.html">FAQ</a></li><li><a href="shipping.html">Shipping & delivery</a></li><li><a href="returns.html">Returns & refunds</a></li><li><a href="exchange-buyback.html">Exchange & buyback</a></li><li><a href="certification.html">Certification & hallmarking</a></li></ul></div>' +
        '<div><h4>Company</h4><ul><li><a href="about.html">About Elyra</a></li><li><a href="learn.html">Diamond guide</a></li><li><a href="contact.html">Contact</a></li><li><a href="privacy.html">Privacy policy</a></li><li><a href="terms.html">Terms of use & sale</a></li><li><a href="grievance.html">Grievance redressal</a></li></ul></div>' +
      "</div>" +
      '<p class="disclosure">Every diamond sold by Elyra is clearly identified as natural or laboratory-grown on its listing, quote, certificate and invoice. Our natural diamonds are ethically sourced under the Kimberley Process.</p>' +
      '<div class="ftr-legal"><span>© <span data-year></span> <span data-cfg="legalName"></span>. All rights reserved.</span><span data-requires="gstin">GSTIN: <span data-cfg="gstin"></span></span></div>' +
      "</div></footer>" +
      '<a class="wa-float" href="#" data-wa="Hi Elyra, I have a question." aria-label="Chat with Elyra on WhatsApp">' + WA_ICON + "</a>";
  }

  /* ---------- config → page ---------- */
  function applyConfig(root) {
    root.querySelectorAll("[data-cfg]").forEach(function (el) {
      var v = get(el.getAttribute("data-cfg"));
      if (v != null && v !== "") el.textContent = v;
    });
    root.querySelectorAll("[data-cfg-href]").forEach(function (el) {
      var k = el.getAttribute("data-cfg-href"), v = get(k);
      if (!v) return;
      if (/email$/i.test(k)) v = "mailto:" + v;
      else if (/phone(Alt)?$/i.test(k)) v ="tel:" + String(v).replace(/[^\d+]/g, "");
      el.href = v;
    });
    root.querySelectorAll("[data-wa]").forEach(function (el) {
      el.href = waLink(el.getAttribute("data-wa") || "Hi Elyra");
      el.target = "_blank";
      el.rel = "noopener";
    });
    root.querySelectorAll("[data-requires]").forEach(function (el) {
      el.hidden = !C[el.getAttribute("data-requires")];
    });
    root.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- products ---------- */
  function placeholder(text) {
    return '<div class="ph" role="img" aria-label="Photo coming soon">' + DIAMOND + "<span>" + esc(text || "Photo coming soon") + "</span></div>";
  }
  function media(p, i) {
    var src = p.images && p.images[i || 0];
    return src ? '<img src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy">' : placeholder();
  }
  function card(p) {
    var d = normalise(p, defaultsOf(p));
    return '<a class="pcard" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
      '<div class="pcard-media">' + media(p) + (p.sample && C.showSampleBadges ? '<span class="badge">Sample listing</span>' : "") + "</div>" +
      '<div class="pcard-body"><div class="pcard-cat">' + esc(CATEGORIES[p.category] || "") + "</div>" +
      "<h3>" + esc(p.name) + "</h3>" +
      '<p class="pcard-meta">' + esc(metalLabel(d)) + "<br>" + esc(caratLabel(p, d.carat)) + " " + esc(PR.stones[d.stone].short.toLowerCase()) + " diamond</p>" +
      '<div class="price">' + inr(quote(p, d).total) + " <small>incl. GST · customisable</small></div></div></a>";
  }
  function matches(p, spec) {
    if (!spec || spec === "all") return true;
    if (spec === "featured") return !!p.featured;
    var parts = spec.split(":");
    if (parts[0] === "occasion") return (p.occasions || []).indexOf(parts[1]) > -1;
    if (parts[0] === "category") return p.category === parts[1];
    return true;
  }
  function renderLists() {
    document.querySelectorAll("[data-product-list]").forEach(function (el) {
      var spec = el.getAttribute("data-product-list");
      var limit = parseInt(el.getAttribute("data-limit") || "0", 10);
      var list = PRODUCTS.filter(function (p) { return matches(p, spec); });
      if (limit) list = list.slice(0, limit);
      el.innerHTML = list.length ? list.map(card).join("") : '<p class="muted">New pieces coming soon. <a href="consultation.html">Ask us about custom designs</a>.</p>';
    });
  }

  /* ---------- shop page ---------- */
  function fillSelect(sel, map, allLabel) {
    sel.innerHTML = '<option value="">' + allLabel + "</option>" + Object.keys(map).map(function (k) {
      return '<option value="' + k + '">' + map[k] + "</option>";
    }).join("");
  }
  function initShop() {
    var grid = document.getElementById("shop-grid");
    if (!grid) return;
    var f = document.getElementById("filters");
    var priceMap = {};
    PRICE_BANDS.forEach(function (b) { priceMap[b.key] = b.label; });
    fillSelect(f.category, CATEGORIES, "All categories");
    fillSelect(f.metal, METALS, "Any metal");
    fillSelect(f.price, priceMap, "All prices");
    fillSelect(f.occasion, OCCASIONS, "All occasions");

    var params = new URLSearchParams(location.search);
    ["category", "metal", "price", "occasion", "sort"].forEach(function (k) {
      if (params.get(k)) f[k].value = params.get(k);
    });

    function run() {
      var v = { category: f.category.value, metal: f.metal.value, price: f.price.value, occasion: f.occasion.value, sort: f.sort.value };
      var band = PRICE_BANDS.filter(function (b) { return b.key === v.price; })[0];
      var list = PRODUCTS.filter(function (p) {
        return (!v.category || p.category === v.category) &&
          (!v.metal || p.custom.metals.indexOf(v.metal) > -1) &&
          (!v.occasion || (p.occasions || []).indexOf(v.occasion) > -1) &&
          (!band || (basePrice(p) > band.min && basePrice(p) <= band.max));
      });
      if (v.sort === "price-asc") list.sort(function (a, b) { return basePrice(a) - basePrice(b); });
      if (v.sort === "price-desc") list.sort(function (a, b) { return basePrice(b) - basePrice(a); });

      grid.innerHTML = list.length ? list.map(card).join("") :
        '<div class="empty"><h3>No pieces match these filters yet</h3><p class="muted">Try removing a filter, or tell us what you are looking for and we will source or design it.</p><a class="btn btn-outline" href="consultation.html">Request a custom piece</a></div>';
      document.getElementById("shop-count").textContent = list.length + (list.length === 1 ? " piece" : " pieces");

      var q = new URLSearchParams();
      Object.keys(v).forEach(function (k) { if (v[k]) q.set(k, v[k]); });
      history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
    }
    f.addEventListener("change", run);
    f.addEventListener("reset", function () { setTimeout(run, 0); });
    run();
  }

  /* ---------- pricing ---------- */
  var PR = window.ELYRA_PRICING || {};
  var SWATCH = {
    "Yellow": "#e3c27c", "White": "#e6e6e3", "Rose": "#e6b29c", "Natural white": "#dfe2e4",
    "White (rhodium)": "#d9dcdf", "Yellow (gold-plated)": "#e8cc8a", "Rose (gold-plated)": "#ebbba6"
  };

  function find(list, key) { return list.filter(function (x) { return x.key === key; })[0]; }
  function purityOf(s) { var m = PR.metals[s.metal]; return find(m.purities, s.purity) || m.purities[0]; }
  function qualityOf(s) { return find(PR.qualities, s.quality) || PR.qualities[0]; }
  function sizeFactor(stone, carat) {
    var f = 1;
    PR.sizeFactors.forEach(function (b) { if (carat >= b.from) f = b[stone]; });
    return f;
  }
  function defaultsOf(p) {
    var d = p.custom.defaults, s = {};
    Object.keys(d).forEach(function (k) { s[k] = d[k]; });
    return s;
  }
  // Keep a selection valid, e.g. switching to platinum resets purity and colour
  function normalise(p, s) {
    var c = p.custom;
    if (c.metals.indexOf(s.metal) < 0) s.metal = c.metals[0];
    var m = PR.metals[s.metal];
    if (!find(m.purities, s.purity)) s.purity = (find(m.purities, "18k") || m.purities[0]).key;
    if (m.colours.indexOf(s.colour) < 0) s.colour = m.colours[0];
    if (!PR.stones[s.stone]) s.stone = "natural";
    if (!find(PR.qualities, s.quality)) s.quality = "premium";
    s.carat = parseFloat(s.carat);
    if (c.carats.indexOf(s.carat) < 0) s.carat = c.defaults.carat;
    return s;
  }
  function quote(p, s) {
    var c = p.custom, pu = purityOf(s);
    var weight = c.baseWeight * pu.density;
    var metal = weight * PR.rates[s.metal] * pu.purity;
    var making = weight * PR.metals[s.metal].making;
    var stones;
    if (c.stones === "centre") {
      var each = c.pair ? s.carat / 2 : s.carat;
      stones = s.carat * PR.centrePerCarat[s.stone][s.quality] * sizeFactor(s.stone, each) +
        (c.accentCarat || 0) * PR.accentPerCarat[s.stone][s.quality];
    } else {
      stones = s.carat * PR.accentPerCarat[s.stone][s.quality];
    }
    var engraving = s.engraving ? (PR.engravingCharge || 0) : 0;
    var sub = metal + making + stones + engraving;
    var total = Math.round(sub * (1 + PR.gst) / PR.roundTo) * PR.roundTo;
    return { weight: weight, metal: metal, making: making, stones: stones, engraving: engraving, gst: sub * PR.gst, total: total };
  }
  function basePrice(p) { return quote(p, normalise(p, defaultsOf(p))).total; }
  function metalLabel(s) {
    var pu = purityOf(s);
    if (s.metal === "platinum") return "Platinum " + pu.label;
    if (s.metal === "silver") return pu.label + " Sterling Silver, " + s.colour.toLowerCase();
    return pu.label + " " + s.colour + " Gold";
  }
  function caratLabel(p, n) {
    var t = n.toFixed(2) + " ct";
    return p.custom.pair ? t + " total (pair)" : p.custom.stones === "accent" ? t + " total" : t;
  }
  function certificateFor(p, s) {
    var each = p.custom.pair ? s.carat / 2 : s.carat;
    if (p.custom.stones === "centre" && each >= PR.certificateFrom) {
      return (s.stone === "natural" ? "GIA or IGI" : "IGI") + " grading report, plus Elyra quality certificate";
    }
    return "Elyra quality certificate listing every diamond and the metal purity";
  }

  /* ---------- product page ---------- */
  var PARAMS = { metal: "m", purity: "pu", colour: "c", stone: "st", quality: "q", carat: "ct" };

  function chipGroup(name, title, current, options) {
    return '<fieldset class="opt"><legend>' + title + ' <span class="opt-value">' + esc(current) + "</span></legend><div class=\"chips\">" +
      options.map(function (o) {
        return '<label class="chip' + (o.swatch ? " chip-swatch" : "") + '"><input type="radio" name="' + name + '" value="' + esc(o.value) + '"' + (o.checked ? " checked" : "") + ">" +
          "<span>" + (o.swatch ? '<i style="background:' + o.swatch + '"></i>' : "") + esc(o.label) + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</span></label>";
      }).join("") + "</div></fieldset>";
  }

  function initProduct() {
    var root = document.getElementById("product");
    if (!root) return;
    var params = new URLSearchParams(location.search);
    var p = PRODUCTS.filter(function (x) { return x.id === params.get("id"); })[0];
    if (!p) {
      root.innerHTML = '<div class="empty"><h2>We could not find that piece</h2><p class="muted">It may have sold out or moved. Browse the collection or message us. We are happy to help.</p><div class="btn-row" style="justify-content:center"><a class="btn btn-gold" href="shop.html">Back to the collection</a><a class="btn btn-outline" href="#" data-wa="Hi Elyra, I was looking for a piece on your website.">WhatsApp us</a></div></div>';
      applyConfig(root);
      return;
    }

    // Selection: product defaults, overridden by any options in the link
    var s = defaultsOf(p);
    Object.keys(PARAMS).forEach(function (k) { if (params.get(PARAMS[k])) s[k] = params.get(PARAMS[k]); });
    s.size = ""; s.engraving = "";
    normalise(p, s);

    document.title = p.name + " | Elyra by Shree Creations";
    var imgs = p.images && p.images.length ? p.images : [];
    // Photos can change with the metal / colour chosen (see colourImages in products.js)
    function imagesFor(sel) {
      var ci = p.colourImages || {};
      return ci[sel.metal + ":" + sel.colour] || ci[sel.metal] || imgs;
    }
    var shownImages = null;
    function renderGallery(list) {
      if (shownImages === list) return;
      shownImages = list;
      var main = document.getElementById("pd-main");
      main.innerHTML = (list.length ? '<img src="' + esc(list[0]) + '" alt="' + esc(p.name) + '">' : placeholder()) +
        (p.sample && C.showSampleBadges ? '<span class="badge">Sample listing</span>' : "");
      document.getElementById("pd-thumbs").innerHTML = list.length > 1 ? list.map(function (src, i) {
        return '<button type="button" data-src="' + esc(src) + '" aria-label="Show photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt=""></button>';
      }).join("") : "";
    }

    root.innerHTML =
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="shop.html">Shop</a> / <a href="shop.html?category=' + p.category + '">' + esc(CATEGORIES[p.category]) + "</a> / <span>" + esc(p.name) + "</span></nav>" +
      '<div class="pd">' +
        '<div class="pd-gallery"><div class="pd-main" id="pd-main"></div><div class="pd-thumbs" id="pd-thumbs"></div>' +
          '<a class="dream-mini" href="custom.html"><strong>You dream it, we create it.</strong> Have a photo of a design you love? Send it to us and we will make it for you. →</a>' +
        "</div>" +
        '<div class="pd-info">' +
          '<span class="eyebrow">' + esc(CATEGORIES[p.category]) + "</span>" +
          "<h1>" + esc(p.name) + "</h1>" +
          '<p class="pd-price"><span id="pd-price"></span> <small>estimated, incl. GST</small></p>' +
          '<p class="pd-disclosure" id="pd-chip"></p>' +
          "<p>" + esc(p.description) + "</p>" +
          '<form class="customiser" id="pd-form" onsubmit="return false"><h2 class="h3">Make it yours</h2><div id="pd-options"></div>' +
            (p.category === "rings" ? '<div class="form-row"><div class="field"><label for="pd-size">Ring size</label><select id="pd-size" name="size"><option value="">Not sure, help me choose</option>' +
              Array.apply(null, Array(17)).map(function (_, i) { return "<option>" + (i + 6) + "</option>"; }).join("") + "</select></div>" +
              (p.engraving ? '<div class="field"><label for="pd-engrave">Engraving (free, optional)</label><input id="pd-engrave" name="engraving" maxlength="15" placeholder="e.g. S ♥ V 2026"></div>' : "") + "</div>" : "") +
          "</form>" +
          '<div class="quote-box"><div class="quote-total"><span>Your estimated price</span><strong id="pd-total"></strong></div>' +
            '<details><summary>See price breakdown</summary><table class="table quote-table"><tbody id="pd-breakdown"></tbody></table>' +
            '<p class="small muted">Based on rates as of ' + esc(PR.ratesUpdated) + ". Gold and diamond prices change, so your final price is confirmed in writing before you pay.</p></details>" +
            '<div class="btn-row"><a class="btn btn-gold" id="pd-order" href="#" target="_blank" rel="noopener" data-track="' + esc(p.id) + '">' + WA_ICON + " Order on WhatsApp</a>" +
            '<a class="btn btn-outline" id="pd-call" href="#" target="_blank" rel="noopener">Book a call</a></div></div>' +
          '<ul class="pd-promise" id="pd-promise"></ul>' +
          '<h2 class="h3">Specifications</h2><div class="table-scroll"><table class="table"><tbody id="pd-specs"></tbody></table></div>' +
          '<p class="small muted">Metal weight is approximate and varies with size and design. Your invoice lists the exact gross weight, metal purity, diamond weight and certificate details. <a href="learn.html#certificate">How to read a certificate</a>.</p>' +
        "</div>" +
      "</div>";

    var opts = document.getElementById("pd-options");

    function renderOptions() {
      var c = p.custom, m = PR.metals[s.metal], q = qualityOf(s);
      opts.innerHTML =
        chipGroup("metal", "Metal", PR.metals[s.metal].label, c.metals.map(function (k) {
          return { value: k, label: PR.metals[k].label, checked: k === s.metal };
        })) +
        (m.purities.length > 1 ? chipGroup("purity", "Purity", purityOf(s).detail, m.purities.map(function (x) {
          return { value: x.key, label: x.label, sub: x.detail, checked: x.key === s.purity };
        })) : "") +
        (m.colours.length > 1 ? chipGroup("colour", "Colour", s.colour, m.colours.map(function (x) {
          return { value: x, label: x, swatch: SWATCH[x], checked: x === s.colour };
        })) : "") +
        chipGroup("stone", "Diamond", PR.stones[s.stone].label, Object.keys(PR.stones).map(function (k) {
          return { value: k, label: PR.stones[k].short, checked: k === s.stone };
        })) +
        '<p class="opt-note">' + esc(PR.stones[s.stone].note) + ' <a href="learn.html#natural-vs-lab">Compare</a></p>' +
        chipGroup("quality", "Quality", q.color + " colour · " + q.clarity + " clarity", PR.qualities.map(function (x) {
          return { value: x.key, label: x.label, sub: x.color + " · " + x.clarity, checked: x.key === s.quality };
        })) +
        chipGroup("carat", c.stones === "accent" ? "Total diamond weight" : c.pair ? "Carat (pair total)" : "Carat", caratLabel(p, s.carat), c.carats.map(function (n) {
          return { value: String(n), label: n.toFixed(2) + " ct", checked: n === s.carat };
        }));
    }

    function update() {
      var qt = quote(p, s), q = qualityOf(s), pu = purityOf(s);
      renderGallery(imagesFor(s));
      var isDefault = Object.keys(PARAMS).every(function (k) { return String(s[k]) === String(p.custom.defaults[k]); });
      var ready = !p.madeToOrder && isDefault && !s.engraving;

      document.getElementById("pd-price").textContent = inr(qt.total);
      document.getElementById("pd-total").textContent = inr(qt.total);
      document.getElementById("pd-chip").innerHTML = DIAMOND + " " + esc(PR.stones[s.stone].label) + " · " + esc(metalLabel(s));
      document.getElementById("pd-breakdown").innerHTML = [
        [metalLabel(s) + " (≈ " + qt.weight.toFixed(1) + " g)", qt.metal],
        ["Diamonds: " + caratLabel(p, s.carat) + ", " + q.label.toLowerCase(), qt.stones],
        ["Making & setting", qt.making],
        qt.engraving ? ["Engraving", qt.engraving] : null,
        ["GST (" + Math.round(PR.gst * 100) + "%)", qt.gst]
      ].filter(Boolean).map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + "</th><td>" + inr(r[1]) + "</td></tr>";
      }).join("") + '<tr class="quote-sum"><th scope="row">Estimated total</th><td>' + inr(qt.total) + "</td></tr>";

      var rows = [
        ["Diamond type", PR.stones[s.stone].label],
        ["Diamond quality", q.label + ": " + q.color + " colour, " + q.clarity + " clarity"],
        ["Total diamond weight", caratLabel(p, s.carat)],
        ["Shape", p.shape], ["Cut", p.cut],
        ["Certificate", certificateFor(p, s)],
        ["Metal", metalLabel(s)],
        ["Approx. metal weight", qt.weight.toFixed(1) + " g"],
        ["Hallmark", pu.mark],
        ["Size / fit", s.size ? "Ring size " + s.size : p.size],
        s.engraving ? ["Engraving", "“" + s.engraving + "”"] : null,
        ["Availability", ready ? "Ready to ship: dispatched in " + C.dispatchReady : "Made to order: ready in " + C.dispatchMade],
        ["SKU", p.id]
      ].filter(Boolean);
      document.getElementById("pd-specs").innerHTML = rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>";
      }).join("");

      document.getElementById("pd-promise").innerHTML = "<li>Free insured shipping across India</li><li>" +
        (ready ? esc(C.returnDays) + "-day returns on this ready-to-ship piece" : "Made to order for you: not returnable unless there is a defect") +
        '</li><li>Lifetime exchange. <a href="exchange-buyback.html">See terms</a></li>';

      var link = new URL(location.href);
      Object.keys(PARAMS).forEach(function (k) { link.searchParams.set(PARAMS[k], s[k]); });
      history.replaceState(null, "", link.pathname + link.search);

      var lines = [
        "Hi Elyra, I'd like to order:",
        p.name + " (" + p.id + ")",
        "Metal: " + metalLabel(s),
        "Diamond: " + PR.stones[s.stone].label + ", " + q.label + " (" + q.color + ", " + q.clarity + "), " + caratLabel(p, s.carat),
        p.category === "rings" ? "Ring size: " + (s.size || "please help me choose") : null,
        s.engraving ? "Engraving: " + s.engraving : null,
        "Estimated price: " + inr(qt.total),
        link.href
      ].filter(Boolean);
      document.getElementById("pd-order").href = waLink(lines.join("\n"));
      document.getElementById("pd-call").href = waLink("Hi Elyra, I'd like a call about the " + p.name + " (" + p.id + ") in " + metalLabel(s) + " with a " + caratLabel(p, s.carat) + " " + PR.stones[s.stone].short.toLowerCase() + " diamond.");

      var md = document.querySelector('meta[name="description"]');
      if (md) md.setAttribute("content", p.name + " in " + metalLabel(s) + " with " + caratLabel(p, s.carat) + " " + PR.stones[s.stone].label.toLowerCase() + ". Customise metal, purity, diamond and carat. From Elyra by Shree Creations, Patna.");
    }

    document.getElementById("pd-form").addEventListener("change", function (e) {
      var t = e.target;
      if (!t.name) return;
      s[t.name] = t.value;
      if (t.name === "metal") normalise(p, s);
      if (t.name === "carat") s.carat = parseFloat(t.value);
      if (t.name !== "size" && t.name !== "engraving") {
        renderOptions();
        var again = opts.querySelector('input[name="' + t.name + '"][value="' + t.value + '"]');
        if (again) again.focus();
      }
      update();
    });
    var engrave = document.getElementById("pd-engrave");
    if (engrave) engrave.addEventListener("input", function () { s.engraving = engrave.value.trim(); update(); });

    document.getElementById("pd-thumbs").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-src]");
      var img = document.querySelector("#pd-main img");
      if (b && img) img.src = b.getAttribute("data-src");
    });

    renderOptions();
    update();
    applyConfig(root);

    var related = PRODUCTS.filter(function (x) {
      return x.id !== p.id && (x.category === p.category || (x.occasions || []).some(function (o) { return (p.occasions || []).indexOf(o) > -1; }));
    }).slice(0, 4);
    var rel = document.getElementById("related");
    if (rel) {
      if (related.length) rel.innerHTML = related.map(card).join("");
      else rel.closest("section").hidden = true;
    }

    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product",
      name: p.name, sku: p.id, description: p.description,
      brand: { "@type": "Brand", name: "Elyra by Shree Creations" },
      image: imagesFor(normalise(p, defaultsOf(p))).map(function (src) { return new URL(src, location.href).href; }),
      offers: { "@type": "Offer", priceCurrency: "INR", price: basePrice(p), availability: "https://schema.org/InStock", url: location.href.split("&")[0] }
    });
    document.head.appendChild(ld);
  }

  /* ---------- policy side navigation ---------- */
  function initPolicyNav() {
    document.querySelectorAll("[data-policy-nav]").forEach(function (el) {
      var here = page();
      el.innerHTML = '<h2 class="policy-nav-title">Policies</h2><ul>' + POLICIES.map(function (p) {
        return '<li><a href="' + p[0] + '"' + (p[0] === here ? ' aria-current="page"' : "") + ">" + p[1] + "</a></li>";
      }).join("") + "</ul>";
    });
  }

  /* ---------- forms → WhatsApp ---------- */
  function renderReviews() {
    var el = document.getElementById("review-list");
    if (!el) return;
    var list = (C.reviews || []).filter(function (r) { return r && r.text; });
    el.hidden = !list.length;
    el.innerHTML = list.map(function (r) {
      var n = Math.max(1, Math.min(5, r.stars || 5));
      return '<figure class="card review-card"><div class="rating-stars" aria-label="' + n + ' out of 5 stars">' + "★★★★★".slice(0, n) + "</div>" +
        "<blockquote><p>“" + esc(r.text) + "”</p></blockquote><figcaption><cite>" + esc(r.name || "Google reviewer") + "</cite> · Google review</figcaption></figure>";
    }).join("");
  }

  function initPhotoPreviews() {
    document.querySelectorAll('input[type="file"][data-preview]').forEach(function (input) {
      var box = document.getElementById(input.getAttribute("data-preview"));
      input.addEventListener("change", function () {
        box.innerHTML = "";
        Array.prototype.slice.call(input.files, 0, 6).forEach(function (file) {
          var img = document.createElement("img");
          img.alt = "Your photo: " + file.name;
          img.src = URL.createObjectURL(file);
          box.appendChild(img);
        });
      });
    });
  }

  function initForms() {
    var params = new URLSearchParams(location.search);
    document.querySelectorAll("form[data-wa-form]").forEach(function (f) {
      // Prefill from the link, e.g. consultation.html?type=bridal
      params.forEach(function (val, key) {
        var el = f.querySelector('[name="' + key + '"]');
        if (el) el.value = val;
      });
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!f.reportValidity()) return;
        var lines = [f.getAttribute("data-wa-form")];
        f.querySelectorAll("[name]").forEach(function (el) {
          if (el.type === "checkbox" || !el.value) return;
          var lab = f.querySelector('label[for="' + el.id + '"]');
          var name = (lab ? lab.textContent : el.name).replace(/\s*\*\s*$/, "").trim();
          lines.push(name + ": " + el.value);
        });
        var photos = f.querySelector('input[type="file"]');
        if (photos && photos.files.length) lines.push("Photos: I'm attaching " + photos.files.length + " photo" + (photos.files.length > 1 ? "s" : "") + " in this chat.");
        track("form_submit", f.getAttribute("data-wa-form"));
        window.open(waLink(lines.join("\n")), "_blank", "noopener");
        var ok = f.querySelector(".form-ok");
        if (ok) ok.hidden = false;
      });
    });
  }

  /* ---------- mobile menu ---------- */
  function initMenu() {
    var btn = document.querySelector(".menu-btn"), nav = document.getElementById("nav");
    if (!btn || !nav) return;
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- analytics ---------- */
  function track(name, label) {
    if (window.gtag) window.gtag("event", name, { event_label: label, page_path: location.pathname });
  }
  function initAnalytics() {
    if (C.ga4Id) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.ga4Id);
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", C.ga4Id);
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
      if (a) track("whatsapp_click", a.getAttribute("data-track") || document.title);
    });
  }

  /* ---------- setup-mode banner ---------- */
  function setupBanner() {
    if (C.showSetupBanner === false) return;
    var missing = [
      ["whatsapp", "WhatsApp number"], ["phone", "phone"], ["email", "email"], ["address", "address"],
      ["gstin", "GSTIN"], ["exchangeValue", "exchange %"], ["buybackValue", "buyback %"],
      ["grievanceName", "grievance officer"]
    ].filter(function (m) { return isPlaceholder(C[m[0]]) || (m[0] === "grievanceName" && /^Name of/.test(C[m[0]])); })
     .map(function (m) { return m[1]; });
    var todos = document.querySelectorAll(".todo").length;
    var samples = PRODUCTS.some(function (p) { return p.sample; });
    if (!missing.length && !todos && !samples) return;
    var parts = [];
    if (missing.length) parts.push("replace placeholders in <code>assets/js/config.js</code> (" + missing.join(", ") + ")");
    if (samples) parts.push("replace sample listings in <code>assets/js/products.js</code>");
    if (todos) parts.push("fix " + todos + " highlighted item" + (todos > 1 ? "s" : "") + " on this page");
    var b = document.createElement("div");
    b.className = "setup-banner";
    b.setAttribute("role", "note");
    b.innerHTML = "<strong>Setup mode.</strong> Before launch: " + parts.join("; ") + ".";
    document.body.insertBefore(b, document.body.firstChild);
  }

  /* ---------- boot ---------- */
  var h = document.getElementById("site-header");
  var f = document.getElementById("site-footer");
  if (h) h.outerHTML = headerHTML();
  if (f) f.outerHTML = footerHTML();
  renderLists();
  initShop();
  initProduct();
  initPolicyNav();
  renderReviews();
  applyConfig(document);
  initForms();
  initPhotoPreviews();
  initMenu();
  initAnalytics();
  setupBanner();
})();
