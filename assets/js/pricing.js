/* ============================================================
   ELYRA PRICING: drives the product customiser's live price.
   UPDATE THESE RATES REGULARLY (gold moves daily).
   Metal rates: market reference rates on 24 Oct 2026 (Groww, Goodreturns),
   before GST and making. Making charges and diamond per-carat rates are
   STILL PLACEHOLDERS: replace them with your supplier's rates.

   Price = (metal + making + diamonds) × (1 + GST), rounded.
   - metal    = weight × rate per gram of pure metal × purity
   - weight   = product's baseWeight (grams in 18K gold) × density factor
   - making   = weight × making charge per gram
   - diamonds = centre stone (carat × per-carat rate × size factor)
                + accent diamonds (carat × accent rate)
   ============================================================ */
window.ELYRA_PRICING = {
  ratesUpdated: "24 October 2026",
  gst: 0.03,            // 3% GST on jewellery
  roundTo: 100,         // round final price to the nearest ₹100

  // ₹ per gram of PURE metal (24K gold, pure platinum, fine silver), 24 Oct 2026
  rates: { gold: 14250, platinum: 4760, silver: 220 },

  metals: {
    gold: {
      label: "Gold",
      making: 1500,     // ₹ making + setting charge per gram
      colours: ["Yellow", "White", "Rose"],
      purities: [
        { key: "14k", label: "14K", detail: "58.5% gold", purity: 0.585, density: 0.84, mark: "BIS hallmark 14K585 with HUID" },
        { key: "18k", label: "18K", detail: "75% gold",   purity: 0.75,  density: 1.0,  mark: "BIS hallmark 18K750 with HUID" },
        { key: "22k", label: "22K", detail: "91.6% gold", purity: 0.916, density: 1.13, mark: "BIS hallmark 22K916 with HUID" }
      ]
    },
    platinum: {
      label: "Platinum",
      making: 2500,
      colours: ["Natural white"],
      purities: [
        { key: "pt950", label: "PT950", detail: "95% platinum", purity: 0.95, density: 1.33, mark: "Stamped PT950" }
      ]
    },
    silver: {
      label: "Silver",
      making: 400,
      colours: ["White (rhodium)", "Yellow (gold-plated)", "Rose (gold-plated)"],
      purities: [
        { key: "925", label: "925", detail: "92.5% sterling silver", purity: 0.925, density: 0.67, mark: "Stamped 925" }
      ]
    }
  },

  stones: {
    natural:  { label: "Natural diamond",   short: "Natural",   note: "Formed in the earth over millions of years. Our speciality. GIA or IGI certified from 0.30 ct." },
    labgrown: { label: "Lab-grown diamond", short: "Lab-grown", note: "Grown in a laboratory: same sparkle, lower price, much lower resale value. IGI certified from 0.30 ct." }
  },

  qualities: [
    { key: "classic",     label: "Classic",     color: "G–H", clarity: "SI1–SI2",   note: "Bright and eye-clean in most settings" },
    { key: "premium",     label: "Premium",     color: "G–H", clarity: "VS1–VS2",   note: "Clean to the eye: our most popular grade" },
    { key: "exceptional", label: "Exceptional", color: "E–F", clarity: "VVS1–VVS2", note: "Near-colourless, near-flawless" }
  ],

  // Grades offered for each diamond type; the first is the default. A grade whose
  // rate below is 0 shows as out of stock for the products that need it.
  stoneQualities: { natural: ["classic"], labgrown: ["premium", "exceptional"] },

  // ₹ per carat for a 0.50 ct centre stone, Excellent / Very Good cut
  centrePerCarat: {
    natural:  { classic: 150000, premium: 210000, exceptional: 320000 },
    labgrown: { classic: 18000,  premium: 24000,  exceptional: 32000 }
  },

  // Larger stones cost more per carat. Factor applied from each size upward.
  sizeFactors: [
    { from: 0,    natural: 0.55, labgrown: 0.80 },
    { from: 0.30, natural: 0.75, labgrown: 0.90 },
    { from: 0.50, natural: 1.00, labgrown: 1.00 },
    { from: 0.70, natural: 1.30, labgrown: 1.05 },
    { from: 0.90, natural: 1.45, labgrown: 1.10 },
    { from: 1.00, natural: 1.90, labgrown: 1.20 },
    { from: 1.50, natural: 2.30, labgrown: 1.30 },
    { from: 2.00, natural: 2.90, labgrown: 1.40 }
  ],

  // ₹ per carat for small accent diamonds (pavé, halos, eternity, tennis, bridal sets)
  accentPerCarat: {
    natural:  { classic: 55000, premium: 75000, exceptional: 100000 },
    labgrown: { classic: 12000, premium: 16000, exceptional: 22000 }
  },

  engravingCharge: 0,   // ₹; 0 = free engraving
  certificateFrom: 0.30 // centre stones at or above this carat get a lab report
};
