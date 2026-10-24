/* ============================================================
   ELYRA CATALOGUE
   The entries below are SAMPLES: names and specifications are
   illustrative. Replace them with real pieces before launch.
   Prices are calculated live from assets/js/pricing.js.

   Fields
   - id:          your SKU code, unique (used in the page link)
   - category:    rings | earrings | pendants | bracelets | bridal | mangalsutra
   - occasions:   any of engagement, bridal, everyday, gifting, statement
   - featured:    true to show on the home page
   - madeToOrder: true if crafted after the order is confirmed
   - images:      photo paths; first one is the main photo; [] shows a placeholder
   - shape, cut:  diamond shape and cut grade
   - size:        fit / size note
   - engraving:   true to offer free engraving (rings and bands)
   - colourImages: optional photos per metal / colour. They replace "images" when chosen. Keys:
                  "gold:Yellow", "gold:White", "gold:Rose", "platinum", "silver", or
                  "silver:Rose (gold-plated)". Example:
                  colourImages: { "gold:White": ["assets/img/products/ELR-R001-white-1.jpg"],
                                  "platinum":   ["assets/img/products/ELR-R001-pt-1.jpg"] }
   - custom:      the customiser for this piece
       stones:      "centre" (solitaire / studs, priced by size) or "accent" (many small diamonds)
       pair:        true for earrings: the carat is the total for the pair
       carats:      carat choices offered (total diamond weight for "accent" pieces)
       accentCarat: extra small diamonds on a "centre" piece (e.g. a halo), in carats
       baseWeight:  approx. metal weight in grams, in 18K gold (other metals are scaled)
       metals:      metals offered: any of "gold", "platinum", "silver"
       defaults:    the setup shown first (and used for the price on cards)
   ============================================================ */
window.ELYRA_PRODUCTS = [
  {
    id: "ELR-R001",
    name: "Aurelia Solitaire Ring",
    category: "rings",
    occasions: ["engagement", "gifting"],
    featured: true,
    madeToOrder: true,
    sample: true,
    shape: "Round brilliant",
    cut: "Excellent",
    size: "Indian ring sizes 6–22",
    engraving: true,
    images: ["assets/img/catalog/rings/rings-10.jpg", "assets/img/catalog/rings/rings-13.jpg"],
    description: "A single certified solitaire held in a slim four-prong setting. Quiet, classic and made to be worn every day after the proposal.",
    custom: {
      stones: "centre", carats: [0.30, 0.40, 0.50, 0.70, 0.90, 1.00, 1.50, 2.00], accentCarat: 0, baseWeight: 3.0,
      metals: ["gold", "platinum", "silver"],
      defaults: { metal: "gold", purity: "18k", colour: "Yellow", stone: "natural", quality: "premium", carat: 0.50 }
    }
  },
  {
    id: "ELR-R002",
    name: "Celeste Cluster Ring",
    category: "rings",
    occasions: ["engagement", "everyday"],
    featured: true,
    madeToOrder: true,
    sample: true,
    shape: "Round brilliant cluster",
    cut: "Very Good",
    size: "Indian ring sizes 6–22",
    engraving: true,
    images: ["assets/img/catalog/rings/rings-11.jpg"],
    description: "A cluster of diamonds that reads as one large stone, paired with a matching contoured band.",
    custom: {
      stones: "accent", carats: [0.50, 0.75, 1.00], baseWeight: 4.2,
      metals: ["gold", "platinum", "silver"],
      defaults: { metal: "gold", purity: "18k", colour: "Yellow", stone: "natural", quality: "classic", carat: 0.75 }
    }
  },
  {
    id: "ELR-R003",
    name: "Eternity Band",
    category: "rings",
    occasions: ["bridal", "engagement"],
    featured: false,
    madeToOrder: true,
    sample: true,
    shape: "Round brilliant",
    cut: "Excellent",
    size: "Indian ring sizes 6–22 (made to your size)",
    engraving: true,
    images: ["assets/img/catalog/rings/rings-05.jpg"],
    description: "Matched diamonds set all the way around the band. Made to your exact size.",
    custom: {
      stones: "accent", carats: [0.50, 1.00, 1.50, 2.00], baseWeight: 3.4,
      metals: ["gold", "platinum", "silver"],
      defaults: { metal: "gold", purity: "18k", colour: "White", stone: "natural", quality: "premium", carat: 1.00 }
    }
  },
  {
    id: "ELR-E001",
    name: "Stellar Stud Earrings",
    category: "earrings",
    occasions: ["everyday", "gifting"],
    featured: true,
    madeToOrder: false,
    sample: true,
    shape: "Round brilliant",
    cut: "Very Good",
    size: "Screw-back fitting",
    images: ["assets/img/catalog/earrings/earrings-02.jpg", "assets/img/catalog/earrings/earrings-12.jpg"],
    description: "The everyday diamond stud. Secure screw backs, comfortable enough to sleep in.",
    custom: {
      stones: "centre", pair: true, carats: [0.30, 0.50, 0.70, 1.00, 1.50, 2.00], accentCarat: 0, baseWeight: 2.2,
      metals: ["gold", "platinum", "silver"],
      defaults: { metal: "gold", purity: "18k", colour: "White", stone: "natural", quality: "premium", carat: 0.50 }
    }
  },
  {
    id: "ELR-E002",
    name: "Lumière Heart Earrings",
    category: "earrings",
    occasions: ["gifting", "everyday"],
    featured: true,
    madeToOrder: true,
    sample: true,
    shape: "Round brilliant",
    cut: "Very Good",
    size: "Screw-back fitting",
    images: ["assets/img/catalog/earrings/earrings-04.jpg", "assets/img/catalog/earrings/earrings-03.jpg"],
    description: "A round diamond cradled in an open heart of gold. A thoughtful gift that is easy to wear every day.",
    custom: {
      stones: "centre", pair: true, carats: [0.20, 0.30, 0.50, 0.70], accentCarat: 0, baseWeight: 2.9,
      metals: ["gold", "platinum", "silver"],
      defaults: { metal: "gold", purity: "18k", colour: "Rose", stone: "natural", quality: "premium", carat: 0.30 }
    }
  },
  {
    id: "ELR-P002",
    name: "Heart Pendant",
    category: "pendants",
    occasions: ["everyday", "gifting"],
    featured: false,
    madeToOrder: false,
    sample: true,
    shape: "Round brilliant",
    cut: "Very Good",
    size: "16–18 inch adjustable chain",
    images: ["assets/img/catalog/necklaces/necklaces-01.jpg"],
    description: "An open heart accented with diamonds, on a fine adjustable chain.",
    custom: {
      stones: "accent", carats: [0.05, 0.08, 0.15], baseWeight: 1.9,
      metals: ["gold", "platinum", "silver"],
      defaults: { metal: "gold", purity: "18k", colour: "Yellow", stone: "natural", quality: "classic", carat: 0.08 }
    }
  },
  {
    id: "ELR-B001",
    name: "Riviera Tennis Bracelet",
    category: "bracelets",
    occasions: ["statement", "gifting"],
    featured: false,
    madeToOrder: true,
    sample: true,
    shape: "Round and baguette",
    cut: "Very Good",
    size: "6.5 or 7 inch, box clasp with safety catch",
    images: ["assets/img/catalog/bangles/bangles-14.jpg"],
    description: "A continuous line of diamonds with a secure double-lock clasp.",
    custom: {
      stones: "accent", carats: [2.00, 3.00, 4.00, 5.00], baseWeight: 11,
      metals: ["gold", "platinum", "silver"],
      defaults: { metal: "gold", purity: "18k", colour: "White", stone: "natural", quality: "premium", carat: 3.00 }
    }
  },
  {
    id: "ELR-BR01",
    name: "Noor Bridal Necklace Set",
    category: "bridal",
    occasions: ["bridal", "statement"],
    featured: false,
    madeToOrder: true,
    sample: true,
    shape: "Round, pear and marquise",
    cut: "Excellent",
    size: "Necklace and earrings; adjustable length",
    images: ["assets/img/catalog/necklaces/necklaces-03.jpg", "assets/img/catalog/necklaces/necklaces-02.jpg"],
    description: "A bridal necklace and earring set, made to order. Design changes are discussed during your bridal consultation.",
    custom: {
      stones: "accent", carats: [3.00, 4.50, 6.00], baseWeight: 32,
      metals: ["gold", "platinum"],
      defaults: { metal: "gold", purity: "18k", colour: "Yellow", stone: "natural", quality: "premium", carat: 4.50 }
    }
  },
  {
    id: "ELR-M001",
    name: "Saubhagya Mangalsutra",
    category: "mangalsutra",
    occasions: ["bridal", "everyday"],
    featured: false,
    madeToOrder: true,
    sample: true,
    shape: "Round brilliant",
    cut: "Very Good",
    size: "18 inch chain with black beads",
    images: ["assets/img/catalog/mangalsutra/mangalsutra-02.jpg", "assets/img/catalog/mangalsutra/mangalsutra-16.jpg"],
    description: "A modern, light mangalsutra with a diamond pendant, made for daily wear.",
    custom: {
      stones: "accent", carats: [0.15, 0.25, 0.40], baseWeight: 4.5,
      metals: ["gold"],
      defaults: { metal: "gold", purity: "18k", colour: "Yellow", stone: "natural", quality: "premium", carat: 0.25 }
    }
  }
];
