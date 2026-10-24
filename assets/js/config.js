/* ============================================================
   ELYRA SITE SETTINGS — edit this file first.
   Every page reads business details and policy terms from here,
   so you only change them in one place.
   Anything containing "X" is a placeholder and triggers the
   orange "Setup mode" banner until it is replaced.
   ============================================================ */
window.ELYRA = {
  // ---- Business identity ----
  brand: "Elyra by Shree Creations",
  legalName: "Shree Creations",            // exactly as on your GST certificate
  ownerName: "Shreya Poddar",
  city: "Patna",

  // ---- Contact ----
  phone: "+91 94310 27748",                 // shown on site and used for tap-to-call
  phoneAlt: "+91 82109 61619",              // second number
  whatsapp: "919431027748",                 // country code + number, digits only (confirm this is the WhatsApp number)
  email: "vishveshpoddar@hotmail.com",
  address: "Flat No. 133, 4th Floor, Grand Apartment, Fraser Road, Patna, Bihar 800001",
  hours: "Monday–Saturday, 11:00 am – 8:00 pm (visits by appointment)",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Elyra+by+Shree+Creations+Patna",
  gstin: "",                                // add your GSTIN here; it is hidden on the site while blank

  // ---- Web & social ----
  siteUrl: "https://elyra.kynyx.com",  // live address (Vercel)
  instagram: "https://www.instagram.com/elyra_shree_creations/",
  facebook: "https://www.facebook.com/ElyraShreeCreations/",
  googleReviewsUrl: "https://www.google.com/maps/search/?api=1&query=Elyra+by+Shree+Creations+Patna",
  googleRating: "4.8",                      // from your Google Business Profile, update as it changes

  // ---- Customer reviews shown on the home page ----
  // Copy real reviews from your Google profile (with the reviewer's first name). Leave empty to show only the rating.
  // Example: { name: "Priya", text: "Beautiful earrings and very helpful service.", stars: 5 }
  reviews: [],

  // ---- Policy terms (used inside the policy pages) ----
  returnDays: "7",                          // days after delivery for ready-to-ship returns
  dispatchReady: "2–4 business days",
  dispatchMade: "15–21 days",
  deliveryTime: "2–7 business days after dispatch",
  refundDays: "7 business days",
  advancePayment: "50%",                    // advance for made-to-order pieces
  exchangeValue: "As confirmed in writing on your invoice",   // e.g. "90% of the diamond value on your invoice"
  buybackValue: "As confirmed in writing on your invoice",     // e.g. "70% of the diamond value on your invoice"
  exchangeValueLab: "As confirmed in writing on your invoice",
  buybackValueLab: "As confirmed in writing on your invoice",
  certLab: "GIA or IGI",
  certThreshold: "0.30 ct",                 // single diamonds at or above this get a lab report
  freeResizeWindow: "30 days",

  // ---- Grievance Officer (required under the Consumer Protection (E-Commerce) Rules, 2020) ----
  grievanceName: "Vishvesh Poddar",
  grievanceDesignation: "Grievance Officer (Chief Operating Officer)",
  grievanceEmail: "vishveshpoddar@hotmail.com",
  grievancePhone: "+91 94310 27748",

  policyUpdated: "24 October 2026",

  // ---- Analytics (leave blank until you have the ID) ----
  ga4Id: "",                                // e.g. "G-ABC123XYZ"

  // Developer helpers: set to true to show the "Setup mode" checklist banner and "Sample listing" badges.
  showSetupBanner: false,
  showSampleBadges: false
};
