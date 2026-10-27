/* ============================================================
   HOMEPAGE SECTIONS: the built-in images and how many images each
   section holds. The admin dashboard (Homepage) can replace them;
   when nothing is chosen there, these are shown.
   ============================================================ */
window.ELYRA_HOME_DEFAULTS = {
  sections: {
    hero:    { label: "Hero (top of the page)", max: 1, maxSize: 1800, images: ["assets/img/catalog/earrings/earrings-02.jpg"], alt: "Diamond jewellery from Elyra" },
    gallery: { label: "From our collection", max: 8, maxSize: 1000, alt: "Elyra design",
      images: ["assets/img/catalog/bangles/bangles-03.jpg", "assets/img/catalog/bangles/bangles-06.jpg", "assets/img/catalog/mangalsutra/mangalsutra-07.jpg", "assets/img/catalog/rings/rings-11.jpg",
               "assets/img/catalog/bangles/bangles-15.jpg", "assets/img/catalog/bangles/bangles-09.jpg", "assets/img/catalog/mangalsutra/mangalsutra-05.jpg", "assets/img/catalog/earrings/earrings-07.jpg"] },
    bespoke: { label: "Bespoke jewellery", max: 1, maxSize: 1400, images: ["assets/img/catalog/bangles/bangles-21.jpg"], alt: "A bespoke diamond piece by Elyra" },
    bridal:  { label: "Wedding & bridal", max: 1, maxSize: 1400, images: ["assets/img/catalog/necklaces/necklaces-02.jpg"], alt: "Diamond bridal jewellery by Elyra" }
  },
  // "Shop by category" cards, in page order: one image each
  categories: [
    { label: "Rings", image: "assets/img/catalog/rings/rings-13.jpg" },
    { label: "Earrings", image: "assets/img/catalog/earrings/earrings-04.jpg" },
    { label: "Pendants & Necklaces", image: "assets/img/catalog/necklaces/necklaces-04.jpg" },
    { label: "Bracelets & Bangles", image: "assets/img/catalog/bangles/bangles-08.jpg" },
    { label: "Bridal Sets", image: "assets/img/catalog/necklaces/necklaces-03.jpg" },
    { label: "Mangalsutras", image: "assets/img/catalog/mangalsutra/mangalsutra-01.jpg" },
    { label: "Engagement", image: "assets/img/catalog/rings/rings-04.jpg" },
    { label: "Bespoke Designs", image: "assets/img/catalog/earrings/earrings-13.jpg" }
  ],
  featuredMax: 4,       // "Featured pieces" shows this many products marked Featured
  reviewPhotosMax: 3    // photos per customer review
};
